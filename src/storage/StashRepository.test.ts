import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { StashRepository, EncryptionRequiredError } from './StashRepository';
import { StorageQuotaExceededError } from './StorageAdapter';
import { createPersonalTemplate } from '../core/templates';
import type { Card } from '../core/schemas/vault';

describe('StashRepository & Storage Engine', () => {
  let storage: MemoryStorageAdapter;
  let repo: StashRepository;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    repo = new StashRepository(storage, 10); // 10ms debounce for fast tests
  });

  describe('Basic Vault Initialization & CRUD', () => {
    it('initializes a fresh empty vault when storage is empty', async () => {
      const vault = await repo.loadVault();
      expect(vault.version).toBe(2);
      expect(vault.profiles).toEqual([]);
      expect(vault.settings.requiresEncryptionForCards).toBe(true);
    });

    it('performs CRUD on Profiles', async () => {
      const profile = createPersonalTemplate('My Work Profile');
      await repo.upsertProfile(profile);

      const loaded = await repo.getProfile(profile.id);
      expect(loaded?.name).toBe('My Work Profile');

      profile.name = 'Updated Work Profile';
      await repo.upsertProfile(profile);

      const reloaded = await repo.getProfile(profile.id);
      expect(reloaded?.name).toBe('Updated Work Profile');

      await repo.deleteProfile(profile.id);
      expect(await repo.getProfile(profile.id)).toBeNull();
    });

    it('performs CRUD on Snippets', async () => {
      const snippet = {
        id: 'snip_1',
        trigger: ':email',
        content: 'test@example.com',
        folder: 'contact',
      };
      await repo.upsertSnippet(snippet);

      const snippets = await repo.getSnippets();
      expect(snippets).toHaveLength(1);
      expect(snippets[0]?.trigger).toBe(':email');

      await repo.deleteSnippet('snip_1');
      expect(await repo.getSnippets()).toHaveLength(0);
    });

    it('performs CRUD on SiteRules', async () => {
      const rule = {
        id: 'rule_1',
        host: 'github.com',
        profileId: 'prof_1',
        disabledFields: [],
        autoFillRule: 'always' as const,
      };
      await repo.upsertSiteRule(rule);

      const rules = await repo.getSiteRules();
      expect(rules).toHaveLength(1);
      expect(rules[0]?.host).toBe('github.com');

      await repo.deleteSiteRule('rule_1');
      expect(await repo.getSiteRules()).toHaveLength(0);
    });
  });

  describe('Card Encryption Enforcement (requiresEncryptionForCards)', () => {
    const validCard: Card = {
      id: 'card_secure_1',
      label: 'Main Visa',
      cardholder: 'Ada Lovelace',
      number: '4532015112830366', // Valid Luhn
      expMonth: '12',
      expYear: '28',
      brand: 'visa',
      sensitive: true,
      createdAt: Date.now(),
    };

    it('refuses to save card when requiresEncryptionForCards is true and encryption is inactive', async () => {
      const settings = await repo.getSettings();
      expect(settings.requiresEncryptionForCards).toBe(true);

      // Must throw EncryptionRequiredError
      await expect(repo.saveCard(validCard, false)).rejects.toThrow(EncryptionRequiredError);
      expect(await repo.getCards()).toHaveLength(0);
    });

    it('saves card successfully when encryption is active', async () => {
      const saved = await repo.saveCard(validCard, true);
      expect(saved.id).toBe('card_secure_1');

      const cards = await repo.getCards();
      expect(cards).toHaveLength(1);
      expect(cards[0]?.label).toBe('Main Visa');
    });

    it('allows saving card without encryption only if requiresEncryptionForCards is toggled off', async () => {
      await repo.updateSettings({ requiresEncryptionForCards: false });
      const saved = await repo.saveCard(validCard, false);
      expect(saved.label).toBe('Main Visa');
    });
  });

  describe('Debounced Atomic Writes & Last-Known-Good Backup', () => {
    it('debounces rapid write requests into atomic save', async () => {
      const p1 = createPersonalTemplate('P1');
      const p2 = createPersonalTemplate('P2');
      const p3 = createPersonalTemplate('P3');

      // Rapidly save
      repo.upsertProfile(p1);
      repo.upsertProfile(p2);
      await repo.upsertProfile(p3);

      const vault = await repo.loadVault();
      expect(vault.profiles.map((p) => p.name)).toEqual(['P1', 'P2', 'P3']);
    });
  });

  describe('Automatic Recovery from Corrupted Data', () => {
    it('recovers from corrupted primary data using last-known-good backup', async () => {
      // 1. Establish valid vault state
      const prof = createPersonalTemplate('Safe Profile');
      await repo.upsertProfile(prof);

      // 2. Corrupt the primary key in storage
      storage.setRawDirect('stashfill_vault_primary', {
        version: 2,
        profiles: 'THIS_IS_CORRUPTED_NOT_AN_ARRAY',
      });

      // Clear repository in-memory cache to force reading from storage
      const freshRepo = new StashRepository(storage, 10);
      const recovered = await freshRepo.loadVault();

      expect(recovered.profiles).toHaveLength(1);
      expect(recovered.profiles[0]?.name).toBe('Safe Profile');

      const report = freshRepo.getLastRecoveryReport();
      expect(report.recovered).toBe(true);
      expect(report.source).toBe('backup');
    });

    it('recovers to a fresh empty vault when both primary and backup are corrupted', async () => {
      storage.setRawDirect('stashfill_vault_primary', 'CORRUPT_PRIMARY');
      storage.setRawDirect('stashfill_vault_backup', 'CORRUPT_BACKUP');

      const freshRepo = new StashRepository(storage, 10);
      const recovered = await freshRepo.loadVault();

      expect(recovered.version).toBe(2);
      expect(recovered.profiles).toEqual([]);

      const report = freshRepo.getLastRecoveryReport();
      expect(report.recovered).toBe(true);
      expect(report.source).toBe('fresh_empty');
    });
  });

  describe('Storage Quota Handling', () => {
    it('catches and throws StorageQuotaExceededError when quota is exceeded', async () => {
      storage.setMaxByteSize(100); // artificially small quota

      const largeProfile = createPersonalTemplate('Large Profile');
      await expect(repo.upsertProfile(largeProfile)).rejects.toThrow(StorageQuotaExceededError);
    });
  });
});
