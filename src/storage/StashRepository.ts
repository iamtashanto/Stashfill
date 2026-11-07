import type { StorageAdapter } from './StorageAdapter';
import {
  type Vault,
  type Profile,
  type Field,
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
} as const;

export class StashRepository {
  private inMemoryCache: Vault | null = null;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingSavePromise: Promise<void> | null = null;
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

    let rawPrimary: unknown = null;
    try {
      rawPrimary = await this.storage.load(STORAGE_KEYS.PRIMARY);
    } catch {
      rawPrimary = null;
    }

    if (rawPrimary) {
      try {
        const { vault } = MigrationRunner.run(rawPrimary);
        this.inMemoryCache = vault;
        return JSON.parse(JSON.stringify(vault));
      } catch {
        // Primary corrupted or schema mismatch -> attempt recovery from backup
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

    if (rawBackup) {
      try {
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

    if (rawBackup) {
      try {
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
          // 1. Write to primary
          await this.storage.save(STORAGE_KEYS.PRIMARY, validated);
          // 2. Update last-known-good backup copy
          await this.storage.save(STORAGE_KEYS.BACKUP, validated);
          resolve();
        } catch (err) {
          reject(err);
        }
      }, this.debounceMs);
    });
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
    const vault = await this.loadVault();

    const idx = vault.profiles.findIndex((p) => p.id === validated.id);
    if (idx >= 0) {
      vault.profiles[idx] = validated;
    } else {
      vault.profiles.push(validated);
    }

    await this.saveVault(vault);
    await this.flush();
    return validated;
  }

  async deleteProfile(id: string): Promise<void> {
    const vault = await this.loadVault();
    vault.profiles = vault.profiles.filter((p) => p.id !== id);
    await this.saveVault(vault);
    await this.flush();
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
    const vault = await this.loadVault();

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

    await this.saveVault(vault);
    await this.flush();
    return validated;
  }

  async deleteCard(id: string): Promise<void> {
    const vault = await this.loadVault();
    vault.cards = vault.cards.filter((c) => c.id !== id);
    await this.saveVault(vault);
    await this.flush();
  }

  // --- Snippets CRUD ---

  async getSnippets(): Promise<Snippet[]> {
    const vault = await this.loadVault();
    return vault.snippets;
  }

  async upsertSnippet(snippet: Snippet): Promise<Snippet> {
    const validated = SnippetSchema.parse(snippet);
    const vault = await this.loadVault();

    const idx = vault.snippets.findIndex((s) => s.id === validated.id);
    if (idx >= 0) {
      vault.snippets[idx] = validated;
    } else {
      vault.snippets.push(validated);
    }

    await this.saveVault(vault);
    await this.flush();
    return validated;
  }

  async deleteSnippet(id: string): Promise<void> {
    const vault = await this.loadVault();
    vault.snippets = vault.snippets.filter((s) => s.id !== id);
    await this.saveVault(vault);
    await this.flush();
  }

  // --- Site Rules CRUD ---

  async getSiteRules(): Promise<SiteRule[]> {
    const vault = await this.loadVault();
    return vault.siteRules;
  }

  async upsertSiteRule(rule: SiteRule): Promise<SiteRule> {
    const validated = SiteRuleSchema.parse(rule);
    const vault = await this.loadVault();

    const idx = vault.siteRules.findIndex((r) => r.id === validated.id);
    if (idx >= 0) {
      vault.siteRules[idx] = validated;
    } else {
      vault.siteRules.push(validated);
    }

    await this.saveVault(vault);
    await this.flush();
    return validated;
  }

  async deleteSiteRule(id: string): Promise<void> {
    const vault = await this.loadVault();
    vault.siteRules = vault.siteRules.filter((r) => r.id !== id);
    await this.saveVault(vault);
    await this.flush();
  }

  // --- Settings ---

  async getSettings(): Promise<Settings> {
    const vault = await this.loadVault();
    return vault.settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const vault = await this.loadVault();
    vault.settings = { ...vault.settings, ...patch };
    await this.saveVault(vault);
    await this.flush();
    return vault.settings;
  }
}
