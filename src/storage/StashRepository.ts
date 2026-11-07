import type { StorageAdapter } from './StorageAdapter';
import {
  type Vault,
  type Profile,
  type Card,
  type Snippet,
  type SiteRule,
  type Settings,
  VaultSchema,
  ProfileSchema,
  CardSchema,
  SnippetSchema,
  SiteRuleSchema,
  createEmptyVault,
} from '../core/schemas/vault';
import type { EncryptedPayload } from '../types/vault';
import { MigrationRunner } from './migrations';

export class EncryptionRequiredError extends Error {
  constructor(message = 'Cannot save payment card while vault encryption is disabled') {
    super(message);
    this.name = 'EncryptionRequiredError';
  }
}

export interface RecoveryReport {
  recovered: boolean;
  source: 'backup' | 'fresh_empty' | 'none';
  timestamp: number;
}

export interface LocalBackupSnapshot {
  id: string;
  timestamp: number;
  profileCount: number;
  fieldCount: number;
  vault: Omit<Vault, 'cards'> & { cards: [] };
  encryptedPayload: EncryptedPayload | null;
}

const STORAGE_KEYS = {
  PRIMARY: 'stashfill_vault_primary',
  BACKUP: 'stashfill_vault_backup',
  ENCRYPTED_VAULT: 'stashfill_encrypted_vault',
  BACKUP_HISTORY: 'stashfill_backup_history',
} as const;

export class StashRepository {
  private inMemoryCache: Vault | null = null;
  private loadPromise: Promise<Vault> | null = null;
  private opQueue: Promise<unknown> = Promise.resolve();
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastRecoveryReport: RecoveryReport = {
    recovered: false,
    source: 'none',
    timestamp: 0,
  };

  constructor(
    private storage: StorageAdapter,
    private debounceMs = 50,
  ) {}

  getLastRecoveryReport(): RecoveryReport {
    return { ...this.lastRecoveryReport };
  }

  /**
   * Loads the vault from storage.
   * If primary data is corrupted or invalid, automatically recovers from the
   * last-known-good backup copy. If that also fails, initializes a fresh valid vault.
   * Never logs user data values.
   */
  async loadVault(): Promise<Vault> {
    if (this.inMemoryCache) {
      return JSON.parse(JSON.stringify(this.inMemoryCache));
    }

    if (!this.loadPromise) {
      this.loadPromise = this.doLoadVault().finally(() => {
        this.loadPromise = null;
      });
    }

    return await this.loadPromise;
  }

  private async doLoadVault(): Promise<Vault> {
    let rawPrimary: unknown = null;
    try {
      rawPrimary = await this.storage.load(STORAGE_KEYS.PRIMARY);
    } catch {
      rawPrimary = null;
    }

    if (rawPrimary !== null && rawPrimary !== undefined) {
      try {
        if (typeof rawPrimary !== 'object') {
          throw new Error('Primary vault data corrupted: not an object');
        }
        const { vault } = MigrationRunner.run(rawPrimary);
        this.inMemoryCache = vault;
        return JSON.parse(JSON.stringify(vault));
      } catch {
        return await this.recoverFromCorruptedData();
      }
    }

    // Primary was empty or null -> check if backup exists
    let rawBackup: unknown = null;
    try {
      rawBackup = await this.storage.load(STORAGE_KEYS.BACKUP);
    } catch {
      rawBackup = null;
    }

    if (rawBackup !== null && rawBackup !== undefined) {
      try {
        if (typeof rawBackup !== 'object') {
          throw new Error('Backup vault data corrupted: not an object');
        }
        const { vault } = MigrationRunner.run(rawBackup);
        this.inMemoryCache = vault;
        await this.storage.save(STORAGE_KEYS.PRIMARY, vault);
        this.lastRecoveryReport = {
          recovered: true,
          source: 'backup',
          timestamp: Date.now(),
        };
        return JSON.parse(JSON.stringify(vault));
      } catch {
        // Backup also invalid
      }
    }

    // Initialize fresh empty vault
    const emptyVault = createEmptyVault();
    this.inMemoryCache = emptyVault;
    await this.storage.save(STORAGE_KEYS.PRIMARY, emptyVault);
    await this.storage.save(STORAGE_KEYS.BACKUP, emptyVault);

    return JSON.parse(JSON.stringify(emptyVault));
  }

  private async recoverFromCorruptedData(): Promise<Vault> {
    let rawBackup: unknown = null;
    try {
      rawBackup = await this.storage.load(STORAGE_KEYS.BACKUP);
    } catch {
      rawBackup = null;
    }

    if (rawBackup !== null && rawBackup !== undefined) {
      try {
        if (typeof rawBackup !== 'object') {
          throw new Error('Backup corrupted');
        }
        const { vault } = MigrationRunner.run(rawBackup);
        this.inMemoryCache = vault;
        await this.storage.save(STORAGE_KEYS.PRIMARY, vault);
        this.lastRecoveryReport = {
          recovered: true,
          source: 'backup',
          timestamp: Date.now(),
        };
        return JSON.parse(JSON.stringify(vault));
      } catch {
        // Backup also corrupted
      }
    }

    // Both primary and backup corrupted: reset to fresh empty vault
    const fresh = createEmptyVault();
    this.inMemoryCache = fresh;
    await this.storage.save(STORAGE_KEYS.PRIMARY, fresh);
    await this.storage.save(STORAGE_KEYS.BACKUP, fresh);

    this.lastRecoveryReport = {
      recovered: true,
      source: 'fresh_empty',
      timestamp: Date.now(),
    };
    return JSON.parse(JSON.stringify(fresh));
  }

  /**
   * Saves the vault using debounced atomic writes and updates the last-known-good backup.
   */
  async saveVault(vault: Vault): Promise<void> {
    const validated = VaultSchema.parse(vault);
    this.inMemoryCache = JSON.parse(JSON.stringify(validated));

    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }

    if (this.debounceMs <= 0) {
      await this.storage.save(STORAGE_KEYS.PRIMARY, validated);
      await this.storage.save(STORAGE_KEYS.BACKUP, validated);
      return;
    }

    return new Promise((resolve, reject) => {
      this.debounceTimeout = setTimeout(async () => {
        try {
          await this.storage.save(STORAGE_KEYS.PRIMARY, validated);
          await this.storage.save(STORAGE_KEYS.BACKUP, validated);
          resolve();
        } catch (err) {
          reject(err);
        }
      }, this.debounceMs);
    });
  }

  /**
   * Serializes mutations onto an internal queue so concurrent in-memory updates
   * are cleanly ordered and debounced.
   */
  private async queueMutation<T>(mutation: (vault: Vault) => Promise<T> | T): Promise<T> {
    const next = this.opQueue.then(async () => {
      const vault = await this.loadVault();
      const result = await mutation(vault);
      await this.saveVault(vault);
      return result;
    });

    this.opQueue = next.catch(() => {});
    return next;
  }

  /**
   * Immediately flush any pending debounced writes.
   */
  async flush(): Promise<void> {
    if (this.debounceTimeout && this.inMemoryCache) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
      await this.storage.save(STORAGE_KEYS.PRIMARY, this.inMemoryCache);
      await this.storage.save(STORAGE_KEYS.BACKUP, this.inMemoryCache);
    }
  }

  // --- Profiles CRUD ---

  async getProfiles(): Promise<Profile[]> {
    const vault = await this.loadVault();
    return vault.profiles;
  }

  async getProfile(id: string): Promise<Profile | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) ?? null;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    const validated = ProfileSchema.parse(profile);
    return this.queueMutation((vault) => {
      const idx = vault.profiles.findIndex((p) => p.id === validated.id);
      if (idx >= 0) {
        vault.profiles[idx] = validated;
      } else {
        vault.profiles.push(validated);
      }
      return validated;
    });
  }

  async deleteProfile(id: string): Promise<void> {
    await this.queueMutation((vault) => {
      vault.profiles = vault.profiles.filter((p) => p.id !== id);
    });
  }

  async recordFieldUsage(profileId: string, fieldId: string): Promise<Profile | null> {
    return this.queueMutation((vault) => {
      const profile = vault.profiles.find((p) => p.id === profileId);
      if (!profile) return null;
      const field = profile.fields.find((f) => f.id === fieldId);
      if (field) {
        field.useCount = (field.useCount || 0) + 1;
        field.lastUsedAt = Date.now();
      }
      return JSON.parse(JSON.stringify(profile)) as Profile;
    });
  }

  // --- Cards CRUD with Encryption Enforcement ---

  async getCards(): Promise<Card[]> {
    const vault = await this.loadVault();
    return vault.cards;
  }

  async getCard(id: string): Promise<Card | null> {
    const cards = await this.getCards();
    return cards.find((c) => c.id === id) ?? null;
  }

  /**
   * Saves a payment card.
   * Strictly enforces that encryption is active if requiresEncryptionForCards is true.
   */
  async saveCard(card: Card, isEncryptionActive = false): Promise<Card> {
    return this.queueMutation((vault) => {
      if (vault.settings.requiresEncryptionForCards && !isEncryptionActive) {
        throw new EncryptionRequiredError(
          'Refusing to save payment card: vault encryption is required but inactive',
        );
      }

      const validated = CardSchema.parse(card);
      const idx = vault.cards.findIndex((c) => c.id === validated.id);
      if (idx >= 0) {
        vault.cards[idx] = validated;
      } else {
        vault.cards.push(validated);
      }
      return validated;
    });
  }

  async deleteCard(id: string): Promise<void> {
    await this.queueMutation((vault) => {
      vault.cards = vault.cards.filter((c) => c.id !== id);
    });
  }

  // --- Snippets CRUD ---

  async getSnippets(): Promise<Snippet[]> {
    const vault = await this.loadVault();
    return vault.snippets;
  }

  async upsertSnippet(snippet: Snippet): Promise<Snippet> {
    const validated = SnippetSchema.parse(snippet);
    return this.queueMutation((vault) => {
      const idx = vault.snippets.findIndex((s) => s.id === validated.id);
      if (idx >= 0) {
        vault.snippets[idx] = validated;
      } else {
        vault.snippets.push(validated);
      }
      return validated;
    });
  }

  async deleteSnippet(id: string): Promise<void> {
    await this.queueMutation((vault) => {
      vault.snippets = vault.snippets.filter((s) => s.id !== id);
    });
  }

  // --- Site Rules CRUD ---

  async getSiteRules(): Promise<SiteRule[]> {
    const vault = await this.loadVault();
    return vault.siteRules;
  }

  async upsertSiteRule(rule: SiteRule): Promise<SiteRule> {
    const validated = SiteRuleSchema.parse(rule);
    return this.queueMutation((vault) => {
      const idx = vault.siteRules.findIndex((r) => r.id === validated.id);
      if (idx >= 0) {
        vault.siteRules[idx] = validated;
      } else {
        vault.siteRules.push(validated);
      }
      return validated;
    });
  }

  async deleteSiteRule(id: string): Promise<void> {
    await this.queueMutation((vault) => {
      vault.siteRules = vault.siteRules.filter((r) => r.id !== id);
    });
  }

  // --- Settings ---

  async getSettings(): Promise<Settings> {
    const vault = await this.loadVault();
    return vault.settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    return this.queueMutation((vault) => {
      vault.settings = { ...vault.settings, ...patch };
      return vault.settings;
    });
  }

  // --- Active Profile ---

  async getActiveProfileId(): Promise<string> {
    const vault = await this.loadVault();
    return vault.settings.defaultProfileId || vault.profiles[0]?.id || '';
  }

  async getActiveProfile(): Promise<Profile | null> {
    const vault = await this.loadVault();
    const activeId = await this.getActiveProfileId();
    return vault.profiles.find((p) => p.id === activeId) || vault.profiles[0] || null;
  }

  async setActiveProfileId(id: string): Promise<void> {
    await this.updateSettings({ defaultProfileId: id });
  }

  // --- Export & Import ---

  async exportData(includeVault = false): Promise<{
    version: number;
    exportedAt: number;
    cardExportNotice: string;
    vault: Vault;
    encryptedPayload?: EncryptedPayload | null;
  }> {
    const vault = await this.loadVault();
    const sanitizedVault: Vault = {
      ...JSON.parse(JSON.stringify(vault)),
      // Plain vault object in export never carries unencrypted cards
      cards: [],
    };
    const encryptedPayload = includeVault ? await this.getEncryptedVault() : null;
    await this.updateSettings({ lastBackupExportedAt: Date.now() });
    return {
      version: sanitizedVault.version,
      exportedAt: Date.now(),
      cardExportNotice:
        'Plain JSON and CSV exports always exclude payment cards. Cards travel only inside the encrypted payload.',
      vault: sanitizedVault,
      encryptedPayload,
    };
  }

  async importData(data: unknown): Promise<{ profileCount: number; hasVault: boolean }> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file');
    }

    // Create a local backup snapshot before overwriting
    await this.createLocalBackupSnapshot();

    const payload = data as Record<string, unknown>;
    let vaultToImport: Vault;
    if (payload.vault) {
      const { vault } = MigrationRunner.run(payload.vault);
      vaultToImport = vault;
    } else {
      const { vault } = MigrationRunner.run(payload);
      vaultToImport = vault;
    }

    // Strip any unencrypted cards from plain vault payload
    vaultToImport.cards = [];

    await this.saveVault(vaultToImport);
    await this.flush();

    let hasVault = false;
    if (payload.encryptedPayload) {
      await this.saveEncryptedVault(payload.encryptedPayload as EncryptedPayload);
      hasVault = true;
    }

    return {
      profileCount: vaultToImport.profiles.length,
      hasVault,
    };
  }

  // --- Rolling Automatic Local Backups (last N versions, cards only inside encrypted copy) ---

  async getLocalBackupHistory(): Promise<LocalBackupSnapshot[]> {
    const raw = await this.storage.load<LocalBackupSnapshot[]>(STORAGE_KEYS.BACKUP_HISTORY);
    if (!Array.isArray(raw)) return [];
    return raw;
  }

  async createLocalBackupSnapshot(): Promise<LocalBackupSnapshot> {
    const vault = await this.loadVault();
    const encryptedPayload = await this.getEncryptedVault();
    const history = await this.getLocalBackupHistory();
    const maxBackups = vault.settings.maxLocalBackups ?? 5;

    const sanitizedVault: Omit<Vault, 'cards'> & { cards: [] } = {
      ...JSON.parse(JSON.stringify(vault)),
      cards: [],
    };

    const fieldCount = sanitizedVault.profiles.reduce((sum, p) => sum + p.fields.length, 0);

    const snapshot: LocalBackupSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      profileCount: sanitizedVault.profiles.length,
      fieldCount,
      vault: sanitizedVault,
      encryptedPayload: encryptedPayload ? { ...encryptedPayload } : null,
    };

    const updatedHistory = [snapshot, ...history].slice(0, maxBackups);
    await this.storage.save(STORAGE_KEYS.BACKUP_HISTORY, updatedHistory);
    return snapshot;
  }

  async restoreLocalBackupSnapshot(snapshotId: string): Promise<boolean> {
    const history = await this.getLocalBackupHistory();
    const target = history.find((s) => s.id === snapshotId);
    if (!target) return false;

    const { vault } = MigrationRunner.run(target.vault);
    vault.cards = [];
    await this.saveVault(vault);
    await this.flush();

    if (target.encryptedPayload) {
      await this.saveEncryptedVault(target.encryptedPayload);
    }
    return true;
  }

  // --- Encrypted Vault Payload (Passphrase protected) ---

  async getEncryptedVault(): Promise<EncryptedPayload | null> {
    return await this.storage.load<EncryptedPayload>(STORAGE_KEYS.ENCRYPTED_VAULT);
  }

  async saveEncryptedVault(payload: EncryptedPayload): Promise<void> {
    await this.storage.save(STORAGE_KEYS.ENCRYPTED_VAULT, payload);
  }

  async clearEncryptedVault(): Promise<void> {
    await this.storage.save(STORAGE_KEYS.ENCRYPTED_VAULT, null);
  }
}
