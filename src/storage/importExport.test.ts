import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportPlainJson,
  exportCsv,
  exportEncryptedBackup,
  decryptEncryptedBackup,
  previewImport,
  applyImportWithStrategy,
  PLAIN_EXPORT_CARD_NOTICE,
} from './importExport';
import { createEmptyVault, type Vault } from '../core/schemas/vault';
import { createPersonalTemplate } from '../core/templates';
import { StashRepository } from './StashRepository';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { VaultManager } from '../vault/vaultManager';

describe('Import, Export, and Automatic Local Backups', () => {
  let sampleVault: Vault;

  beforeEach(() => {
    sampleVault = createEmptyVault();
    const prof = createPersonalTemplate('Personal');
    prof.fields = [
      {
        id: 'f1',
        label: 'Full Name',
        key: 'full_name',
        value: 'Ada Lovelace',
        type: 'text',
        category: 'personal',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 2,
        lastUsedAt: 2000,
      },
      {
        id: 'f2',
        label: 'Email',
        key: 'email',
        value: 'ada@lovelace.org',
        type: 'email',
        category: 'contact',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 5,
        lastUsedAt: 3000,
      },
    ];
    sampleVault.profiles = [prof];
    // Simulate a card inside vault object to verify plain exports always strip it
    sampleVault.cards = [
      {
        id: 'card_secret',
        label: 'Secret Visa',
        cardholder: 'Ada Lovelace',
        number: '4532015112830366',
        expMonth: '09',
        expYear: '29',
        brand: 'visa',
        sensitive: true,
        createdAt: 1000,
      },
    ];
  });

  it('guarantees plain JSON and CSV exports contain zero card data and include exclusion notices', () => {
    const plainJson = exportPlainJson(sampleVault);
    expect(plainJson.vault.cards).toEqual([]);
    expect(plainJson.cardExportNotice).toBe(PLAIN_EXPORT_CARD_NOTICE);
    const serializedJson = JSON.stringify(plainJson);
    expect(serializedJson).not.toContain('4532015112830366');
    expect(serializedJson).not.toContain('Secret Visa');

    const csvText = exportCsv(sampleVault);
    expect(csvText).toContain(PLAIN_EXPORT_CARD_NOTICE);
    expect(csvText).toContain('label,value,key,category,profile,sensitive');
    expect(csvText).toContain('Full Name,Ada Lovelace,full_name,personal,Personal,false');
    expect(csvText).not.toContain('4532015112830366');
    expect(csvText).not.toContain('Secret Visa');
  });

  it('completes encrypted export and decrypt round-trip including encrypted vault cards', async () => {
    const storage = new MemoryStorageAdapter();
    const repo = new StashRepository(storage, 0);
    const vm = new VaultManager(repo);

    await vm.initializeVault('VaultMasterPass!99');
    await vm.saveCard({
      id: 'c_enc_1',
      nickname: 'Encrypted Visa',
      cardholderName: 'Ada Lovelace',
      cardNumber: '4532015112830366',
      expMonth: '12',
      expYear: '28',
      brand: 'visa',
      createdAt: 12345,
    });

    const encryptedVaultPayload = await repo.getEncryptedVault();
    const exportEnvelope = await exportEncryptedBackup(
      sampleVault,
      encryptedVaultPayload,
      'ExportEnvelopePass!88',
    );

    expect(exportEnvelope.format).toBe('stashfill-encrypted-backup');
    expect(exportEnvelope.includesCards).toBe(true);
    expect(exportEnvelope.envelope.iterations).toBeGreaterThanOrEqual(600_000);

    const rawExportStr = JSON.stringify(exportEnvelope);
    expect(rawExportStr).not.toContain('4532015112830366');
    expect(rawExportStr).not.toContain('ada@lovelace.org');

    const preview = previewImport(rawExportStr, 'json', []);
    expect(preview.valid).toBe(true);
    expect(preview.format).toBe('encrypted');
    expect(preview.hasEncryptedVault).toBe(true);

    const restored = await decryptEncryptedBackup(rawExportStr, 'ExportEnvelopePass!88');
    expect(restored.vault.profiles[0]?.fields[0]?.value).toBe('Ada Lovelace');
    expect(restored.encryptedPayload).not.toBeNull();
  });

  it('supports JSON, CSV, and key-value TXT dry-run previews and merge strategies (skip, replace, keepBoth)', () => {
    const existingProfiles = sampleVault.profiles;

    // 1. CSV import with 1 duplicate ('Email') and 1 new field ('Phone') and 1 invalid row
    const csvInput = [
      'label,value,key,category,profile,sensitive',
      'Email,new-ada@lovelace.org,email,contact,Personal,false',
      'Phone,+1-555-0100,phone,contact,Personal,false',
      ',missing-label-invalid-row',
    ].join('\n');

    const csvPreview = previewImport(csvInput, 'csv', existingProfiles);
    expect(csvPreview.valid).toBe(true);
    expect(csvPreview.newCount).toBe(1);
    expect(csvPreview.duplicateCount).toBe(1);
    expect(csvPreview.invalidCount).toBe(1);

    // Strategy A: 'skip' -> keeps original Email ('ada@lovelace.org') and adds Phone
    const skipped = applyImportWithStrategy(csvPreview, existingProfiles, 'skip');
    expect(skipped[0]?.fields).toHaveLength(3);
    expect(skipped[0]?.fields.find((f) => f.label === 'Email')?.value).toBe('ada@lovelace.org');
    expect(skipped[0]?.fields.find((f) => f.label === 'Phone')?.value).toBe('+1-555-0100');

    // Strategy B: 'replace' -> overwrites Email with 'new-ada@lovelace.org' and adds Phone
    const replaced = applyImportWithStrategy(csvPreview, existingProfiles, 'replace');
    expect(replaced[0]?.fields).toHaveLength(3);
    expect(replaced[0]?.fields.find((f) => f.label === 'Email')?.value).toBe(
      'new-ada@lovelace.org',
    );

    // Strategy C: 'keepBoth' -> keeps original Email, adds 'Email (Imported)', and adds Phone
    const keptBoth = applyImportWithStrategy(csvPreview, existingProfiles, 'keepBoth');
    expect(keptBoth[0]?.fields).toHaveLength(4);
    expect(keptBoth[0]?.fields.some((f) => f.label === 'Email (Imported)')).toBe(true);

    // 2. Key-Value TXT import
    const txtInput = `
      # Comment line
      GitHub = https://github.com/ada
      Email: duplicate@lovelace.org
      invalid_line_without_delimiter
    `;
    const txtPreview = previewImport(txtInput, 'txt', existingProfiles);
    expect(txtPreview.valid).toBe(true);
    expect(txtPreview.newCount).toBe(1);
    expect(txtPreview.duplicateCount).toBe(1);
    expect(txtPreview.invalidCount).toBe(1);
  });

  it('rejects malformed or malicious import files atomically without partial state changes', () => {
    const existingProfiles = JSON.parse(JSON.stringify(sampleVault.profiles));

    // 1. Prototype pollution JSON payload
    const protoPollution = '{"__proto__": {"polluted": true}, "profiles": []}';
    const protoPreview = previewImport(protoPollution, 'json', existingProfiles);
    expect(protoPreview.valid).toBe(false);
    expect(protoPreview.error).toMatch(/malicious|prototype/i);
    expect(() => applyImportWithStrategy(protoPreview, existingProfiles, 'skip')).toThrow();

    // 2. Binary / null-byte file
    const binaryFile = 'label,value\nName\u0000,Alice';
    const binPreview = previewImport(binaryFile, 'csv', existingProfiles);
    expect(binPreview.valid).toBe(false);

    // 3. Malformed CSV with unclosed quotes
    const badCsv = 'label,value\n"Unclosed quote,Alice';
    const badCsvPreview = previewImport(badCsv, 'csv', existingProfiles);
    expect(badCsvPreview.valid).toBe(false);

    // 4. Invalid Zod schema in JSON
    const badJson = JSON.stringify({
      profiles: [{ id: 123, name: '', fields: [{ bad: true }] }],
    });
    const badJsonPreview = previewImport(badJson, 'json', existingProfiles);
    expect(badJsonPreview.valid).toBe(false);
  });

  it('maintains rolling automatic local backups (last N versions, cards only inside encrypted payload) and restores cleanly', async () => {
    const storage = new MemoryStorageAdapter();
    const repo = new StashRepository(storage, 0);
    await repo.updateSettings({ maxLocalBackups: 3 });

    for (let i = 1; i <= 4; i++) {
      const p = createPersonalTemplate(`Profile V${i}`);
      await repo.saveVault({
        ...createEmptyVault(),
        settings: await repo.getSettings(),
        profiles: [p],
      });
      await repo.createLocalBackupSnapshot();
    }

    const history = await repo.getLocalBackupHistory();
    // Max 3 snapshots retained
    expect(history).toHaveLength(3);
    expect(history[0]?.vault.profiles[0]?.name).toBe('Profile V4');
    expect(history[2]?.vault.profiles[0]?.name).toBe('Profile V2');
    // Plain snapshot vault never contains cards
    expect(history[0]?.vault.cards).toEqual([]);

    // Restore V2 snapshot
    const restoredOk = await repo.restoreLocalBackupSnapshot(history[2]!.id);
    expect(restoredOk).toBe(true);
    const profilesAfterRestore = await repo.getProfiles();
    expect(profilesAfterRestore[0]?.name).toBe('Profile V2');
  });
});

