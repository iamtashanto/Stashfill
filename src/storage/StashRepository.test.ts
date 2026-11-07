import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from './MemoryStorageAdapter';
import { StashRepository } from './StashRepository';
import { createDefaultProfile } from '../types/profile';
import type { EncryptedPayload } from '../types/vault';

describe('StashRepository', () => {
  let storage: MemoryStorageAdapter;
  let repo: StashRepository;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    repo = new StashRepository(storage);
  });

  it('creates and returns a default profile when storage is empty', async () => {
    const profiles = await repo.getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.name).toBe('Personal');
    expect(profiles[0]?.isDefault).toBe(true);

    const activeId = await repo.getActiveProfileId();
    expect(activeId).toBe(profiles[0]?.id);
  });

  it('adds and updates profiles with proper default profile toggling', async () => {
    const p1 = await repo.getActiveProfile();
    p1.fullName = 'Jane Doe';
    await repo.upsertProfile(p1);

    const p2 = createDefaultProfile('Work');
    p2.isDefault = true;
    p2.fullName = 'Jane Work';
    await repo.upsertProfile(p2);

    const profiles = await repo.getProfiles();
    expect(profiles).toHaveLength(2);

    const updatedP1 = profiles.find((p) => p.id === p1.id);
    const updatedP2 = profiles.find((p) => p.id === p2.id);

    expect(updatedP1?.isDefault).toBe(false);
    expect(updatedP2?.isDefault).toBe(true);
  });

  it('deletes a profile and ensures at least one default profile remains', async () => {
    const p1 = await repo.getActiveProfile();
    const p2 = createDefaultProfile('Work');
    await repo.upsertProfile(p2);

    await repo.deleteProfile(p1.id);

    const profiles = await repo.getProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.id).toBe(p2.id);
    expect(profiles[0]?.isDefault).toBe(true);

    // Deleting the last remaining profile creates a fresh one
    await repo.deleteProfile(p2.id);
    const refreshed = await repo.getProfiles();
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0]?.name).toBe('Personal');
  });

  it('manages settings properly', async () => {
    const defaults = await repo.getSettings();
    expect(defaults.language).toBe('en');
    expect(defaults.theme).toBe('system');
    expect(defaults.vaultTimeoutMinutes).toBe(15);

    const updated = await repo.updateSettings({
      language: 'bn',
      theme: 'dark',
      vaultTimeoutMinutes: 30,
    });
    expect(updated.language).toBe('bn');
    expect(updated.theme).toBe('dark');
    expect(updated.vaultTimeoutMinutes).toBe(30);

    const reloaded = await repo.getSettings();
    expect(reloaded.language).toBe('bn');
  });

  it('manages encrypted vault payloads', async () => {
    expect(await repo.getEncryptedVault()).toBeNull();

    const mockVault: EncryptedPayload = {
      version: 1,
      ciphertext: 'QUJDREVGR0g=',
      iv: 'MTIzNDU2Nzg5MDEy',
      salt: 'c2FsdHNhbHRzYWx0MTIzNA==',
      iterations: 250000,
    };

    await repo.saveEncryptedVault(mockVault);
    const loaded = await repo.getEncryptedVault();
    expect(loaded).toEqual(mockVault);

    await repo.clearVault();
    expect(await repo.getEncryptedVault()).toBeNull();
  });

  it('exports and imports stash data correctly', async () => {
    const p = await repo.getActiveProfile();
    p.fullName = 'Alice In Wonderland';
    p.email = 'alice@example.com';
    await repo.upsertProfile(p);

    const exported = await repo.exportData();
    expect(exported.version).toBe(1);
    expect(exported.profiles).toHaveLength(1);
    expect(exported.profiles[0]?.fullName).toBe('Alice In Wonderland');
    expect(exported.vault).toBeNull();

    // Import into fresh storage
    const freshStorage = new MemoryStorageAdapter();
    const freshRepo = new StashRepository(freshStorage);

    const res = await freshRepo.importData(exported);
    expect(res.profileCount).toBe(1);
    expect(res.hasVault).toBe(false);

    const importedProfiles = await freshRepo.getProfiles();
    expect(importedProfiles[0]?.fullName).toBe('Alice In Wonderland');
    expect(importedProfiles[0]?.email).toBe('alice@example.com');
  });
});
