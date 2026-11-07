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

const STORAGE_KEYS = {
  PRIMARY: 'stashfill_vault_primary',
  BACKUP: 'stashfill_vault_backup',
  ENCRYPTED_VAULT: 'stashfill_encrypted_vault',
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
    vault: Vault;
    encryptedPayload?: EncryptedPayload | null;
  }> {
    const vault = await this.loadVault();
    const encryptedPayload = includeVault ? await this.getEncryptedVault() : null;
    return {
      version: vault.version,
      exportedAt: Date.now(),
      vault,
      encryptedPayload,
    };
  }

  async importData(data: any): Promise<{ profileCount: number; hasVault: boolean }> {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid backup file');
    }

    let vaultToImport: Vault;
    if (data.vault) {
      const { vault } = MigrationRunner.run(data.vault);
      vaultToImport = vault;
    } else {
      const { vault } = MigrationRunner.run(data);
      vaultToImport = vault;
    }

    await this.saveVault(vaultToImport);
    await this.flush();

    let hasVault = false;
    if (data.encryptedPayload) {
      await this.saveEncryptedVault(data.encryptedPayload);
      hasVault = true;
    }

    return {
      profileCount: vaultToImport.profiles.length,
      hasVault,
    };
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
