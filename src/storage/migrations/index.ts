import {
  type Vault,
  VaultSchema,
  CURRENT_VAULT_VERSION,
  createEmptyVault,
} from '../../core/schemas/vault';

export interface Migration {
  fromVersion: number;
  toVersion: number;
  description: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Migration 1: Migrates legacy/unversioned store into v1 Vault format.
 */
export const migrationV1: Migration = {
  fromVersion: 0,
  toVersion: 1,
  description: 'Initialize v1 vault structure from legacy profiles format',
  migrate: (raw) => {
    const rawProfiles = Array.isArray(raw.profiles)
      ? raw.profiles
      : Array.isArray(raw)
        ? raw
        : [];

    const profiles = rawProfiles.map((p: any, idx: number) => {
      // Map flat legacy profile fields to Field array if needed
      const fields = Array.isArray(p.fields)
        ? p.fields
        : [
            p.fullName && {
              id: `f_mig_fn_${idx}`,
              key: 'full_name',
              label: 'Full Name',
              value: p.fullName,
              type: 'text',
              category: 'personal',
              tags: ['personal'],
              sensitive: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              useCount: 0,
              lastUsedAt: null,
            },
            p.email && {
              id: `f_mig_em_${idx}`,
              key: 'email',
              label: 'Email',
              value: p.email,
              type: 'email',
              category: 'contact',
              tags: ['contact'],
              sensitive: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              useCount: 0,
              lastUsedAt: null,
            },
            p.phone && {
              id: `f_mig_ph_${idx}`,
              key: 'phone',
              label: 'Phone',
              value: p.phone,
              type: 'tel',
              category: 'contact',
              tags: ['contact'],
              sensitive: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              useCount: 0,
              lastUsedAt: null,
            },
          ].filter(Boolean);

      return {
        id: p.id || `prof_${Date.now()}_${idx}`,
        name: p.name || 'Personal',
        icon: p.icon || 'user',
        fields,
      };
    });

    return {
      version: 1,
      profiles,
      snippets: Array.isArray(raw.snippets) ? raw.snippets : [],
      cards: Array.isArray(raw.cards) ? raw.cards : [],
      siteRules: [],
      settings: {
        language: raw.settings?.language || 'en',
        theme: raw.settings?.theme || 'system',
        vaultTimeoutMinutes: raw.settings?.vaultTimeoutMinutes ?? 15,
        confirmBeforePaymentFill: raw.settings?.confirmBeforePaymentFill ?? true,
        requiresEncryptionForCards: true,
      },
    };
  },
};

/**
 * Migration 2: Migrates v1 vault to v2 schema.
 * Adds siteRules, guarantees requiresEncryptionForCards, and normalizes field metrics.
 */
export const migrationV2: Migration = {
  fromVersion: 1,
  toVersion: 2,
  description: 'Add siteRules, usage metrics, and ensure card encryption flag',
  migrate: (v1Data) => {
    const profiles = Array.isArray(v1Data.profiles)
      ? v1Data.profiles.map((prof: any) => ({
          ...prof,
          fields: Array.isArray(prof.fields)
            ? prof.fields.map((f: any) => ({
                ...f,
                tags: Array.isArray(f.tags) ? f.tags : [f.category || 'general'],
                useCount: typeof f.useCount === 'number' ? f.useCount : 0,
                lastUsedAt: typeof f.lastUsedAt === 'number' ? f.lastUsedAt : null,
              }))
            : [],
        }))
      : [];

    return {
      ...v1Data,
      version: 2,
      profiles,
      snippets: Array.isArray(v1Data.snippets) ? v1Data.snippets : [],
      cards: Array.isArray(v1Data.cards) ? v1Data.cards : [],
      siteRules: Array.isArray(v1Data.siteRules) ? v1Data.siteRules : [],
      settings: {
        language: v1Data.settings?.language || 'en',
        theme: v1Data.settings?.theme || 'system',
        vaultTimeoutMinutes: v1Data.settings?.vaultTimeoutMinutes ?? 15,
        confirmBeforePaymentFill: v1Data.settings?.confirmBeforePaymentFill ?? true,
        requiresEncryptionForCards:
          typeof v1Data.settings?.requiresEncryptionForCards === 'boolean'
            ? v1Data.settings.requiresEncryptionForCards
            : true,
      },
    };
  },
};

export const MIGRATIONS: Migration[] = [migrationV1, migrationV2];

export class MigrationRunner {
  static run(rawData: unknown): { vault: Vault; appliedVersions: number[] } {
    if (!rawData || typeof rawData !== 'object') {
      return { vault: createEmptyVault(), appliedVersions: [] };
    }

    let current = { ...(rawData as Record<string, unknown>) };
    const appliedVersions: number[] = [];

    let currentVersion = typeof current.version === 'number' ? current.version : 0;

    while (currentVersion < CURRENT_VAULT_VERSION) {
      const nextMigration = MIGRATIONS.find((m) => m.fromVersion === currentVersion);
      if (!nextMigration) {
        break;
      }

      current = nextMigration.migrate(current);
      currentVersion = nextMigration.toVersion;
      appliedVersions.push(currentVersion);
    }

    const validated = VaultSchema.parse(current);
    return { vault: validated, appliedVersions };
  }
}
