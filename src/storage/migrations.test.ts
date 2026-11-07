import { describe, it, expect } from 'vitest';
import { migrationV1, migrationV2, MigrationRunner } from './migrations';
import { VaultSchema, CURRENT_VAULT_VERSION } from '../core/schemas/vault';

describe('Schema Migrations', () => {
  it('applies Migration 1 (0 -> 1) from legacy flat format', () => {
    const legacyRaw = {
      profiles: [
        {
          id: 'p_old_1',
          name: 'Old Personal',
          fullName: 'Jane Legacy',
          email: 'jane@legacy.test',
          phone: '+1 555-0199',
        },
      ],
      settings: {
        language: 'en',
        theme: 'dark',
      },
    };

    const v1 = migrationV1.migrate(legacyRaw);
    expect(v1.version).toBe(1);
    expect(Array.isArray(v1.profiles)).toBe(true);

    const firstProf = (v1.profiles as any[])[0];
    expect(firstProf.id).toBe('p_old_1');
    expect(firstProf.name).toBe('Old Personal');
    expect(firstProf.fields).toHaveLength(3);
    expect(firstProf.fields[0].key).toBe('full_name');
    expect(firstProf.fields[0].value).toBe('Jane Legacy');
    expect(firstProf.fields[1].key).toBe('email');
    expect(firstProf.fields[2].key).toBe('phone');
  });

  it('applies Migration 2 (1 -> 2) adding siteRules, card encryption flag, and metrics', () => {
    const v1Data = {
      version: 1,
      profiles: [
        {
          id: 'prof_v1',
          name: 'V1 Profile',
          icon: 'user',
          fields: [
            {
              id: 'f_1',
              label: 'Job Title',
              key: 'job_title',
              value: 'Engineer',
              type: 'text',
              category: 'work',
            },
          ],
        },
      ],
      snippets: [],
      cards: [],
      settings: {
        language: 'en',
        theme: 'system',
        vaultTimeoutMinutes: 15,
        confirmBeforePaymentFill: true,
      },
    };

    const v2 = migrationV2.migrate(v1Data);
    expect(v2.version).toBe(2);
    expect((v2.settings as any).requiresEncryptionForCards).toBe(true);
    expect(v2.siteRules as any[]).toEqual([]);

    const field = (v2.profiles as any[])[0].fields[0];
    expect(field.useCount).toBe(0);
    expect(field.lastUsedAt).toBeNull();
    expect(field.tags).toEqual(['work']);

    // Validates directly with v2 VaultSchema
    expect(() => VaultSchema.parse(v2)).not.toThrow();
  });

  it('runs entire migration pipeline via MigrationRunner from version 0 to current', () => {
    const rawLegacy = {
      profiles: [
        {
          id: 'p_zero',
          name: 'Legacy 0',
          fullName: 'Ada Lovelace',
        },
      ],
    };

    const result = MigrationRunner.run(rawLegacy);
    expect(result.appliedVersions).toEqual([1, 2]);
    expect(result.vault.version).toBe(CURRENT_VAULT_VERSION);
    expect(result.vault.profiles).toHaveLength(1);
    expect(result.vault.profiles[0]?.name).toBe('Legacy 0');
    expect(result.vault.settings.requiresEncryptionForCards).toBe(true);
  });
});
