import type { StorageAdapter } from './StorageAdapter';
import { type Profile, ProfileSchema, createDefaultProfile } from '../types/profile';
import { type Settings, SettingsSchema, DEFAULT_SETTINGS } from '../types/settings';
import { type EncryptedPayload, EncryptedPayloadSchema } from '../types/vault';
import { z } from 'zod';

const STORAGE_KEYS = {
  PROFILES: 'stashfill_profiles',
  ACTIVE_PROFILE_ID: 'stashfill_active_profile_id',
  SETTINGS: 'stashfill_settings',
  VAULT: 'stashfill_vault',
} as const;

export const ExportDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  profiles: z.array(ProfileSchema),
  activeProfileId: z.string().optional(),
  settings: SettingsSchema,
  vault: EncryptedPayloadSchema.nullable().optional(),
});

export type ExportData = z.infer<typeof ExportDataSchema>;

export class StashRepository {
  constructor(private storage: StorageAdapter) {}

  // --- Profiles ---

  async getProfiles(): Promise<Profile[]> {
    const raw = await this.storage.get<Profile[]>(STORAGE_KEYS.PROFILES);
    if (!raw || !Array.isArray(raw) || raw.length === 0) {
      const defaultProf = createDefaultProfile('Personal');
      await this.saveProfiles([defaultProf]);
      await this.setActiveProfileId(defaultProf.id);
      return [defaultProf];
    }
    return raw;
  }

  async saveProfiles(profiles: Profile[]): Promise<void> {
    const parsed = z.array(ProfileSchema).parse(profiles);
    await this.storage.set(STORAGE_KEYS.PROFILES, parsed);
  }

  async getProfile(id: string): Promise<Profile | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === id) ?? null;
  }

  async upsertProfile(profile: Profile): Promise<Profile> {
    const validated = ProfileSchema.parse({
      ...profile,
      updatedAt: Date.now(),
    });
    const profiles = await this.getProfiles();
    const index = profiles.findIndex((p) => p.id === validated.id);

    let updated: Profile[];
    if (index >= 0) {
      updated = [...profiles];
      updated[index] = validated;
    } else {
      updated = [...profiles, validated];
    }

    // If marked as default, unset other defaults
    if (validated.isDefault) {
      updated = updated.map((p) => (p.id === validated.id ? p : { ...p, isDefault: false }));
    }

    await this.saveProfiles(updated);
    return validated;
  }

  async deleteProfile(id: string): Promise<void> {
    const profiles = await this.getProfiles();
    const filtered = profiles.filter((p) => p.id !== id);
    if (filtered.length === 0) {
      const fresh = createDefaultProfile('Personal');
      await this.saveProfiles([fresh]);
      await this.setActiveProfileId(fresh.id);
      return;
    }

    // If deleted profile was default, make the first one default
    if (!filtered.some((p) => p.isDefault)) {
      filtered[0]!.isDefault = true;
    }

    await this.saveProfiles(filtered);

    const activeId = await this.getActiveProfileId();
    if (activeId === id) {
      const newActive = filtered.find((p) => p.isDefault) ?? filtered[0]!;
      await this.setActiveProfileId(newActive.id);
    }
  }

  async getActiveProfileId(): Promise<string> {
    const active = await this.storage.get<string>(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (active) return active;
    const profiles = await this.getProfiles();
    const def = profiles.find((p) => p.isDefault) ?? profiles[0]!;
    await this.setActiveProfileId(def.id);
    return def.id;
  }

  async getActiveProfile(): Promise<Profile> {
    const activeId = await this.getActiveProfileId();
    const profile = await this.getProfile(activeId);
    if (profile) return profile;
    const profiles = await this.getProfiles();
    return profiles[0]!;
  }

  async setActiveProfileId(id: string): Promise<void> {
    await this.storage.set(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
  }

  // --- Settings ---

  async getSettings(): Promise<Settings> {
    const raw = await this.storage.get<Settings>(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = SettingsSchema.safeParse(raw);
    return parsed.success ? parsed.data : DEFAULT_SETTINGS;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const updated = SettingsSchema.parse({ ...current, ...patch });
    await this.storage.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- Vault ---

  async getEncryptedVault(): Promise<EncryptedPayload | null> {
    const raw = await this.storage.get<EncryptedPayload>(STORAGE_KEYS.VAULT);
    if (!raw) return null;
    const parsed = EncryptedPayloadSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  }

  async saveEncryptedVault(payload: EncryptedPayload): Promise<void> {
    const validated = EncryptedPayloadSchema.parse(payload);
    await this.storage.set(STORAGE_KEYS.VAULT, validated);
  }

  async clearVault(): Promise<void> {
    await this.storage.remove(STORAGE_KEYS.VAULT);
  }

  // --- Import / Export ---

  async exportData(includeVault = false): Promise<ExportData> {
    const profiles = await this.getProfiles();
    const activeProfileId = await this.getActiveProfileId();
    const settings = await this.getSettings();
    const vault = includeVault ? await this.getEncryptedVault() : null;

    return {
      version: 1,
      exportedAt: Date.now(),
      profiles,
      activeProfileId,
      settings,
      vault,
    };
  }

  async importData(data: unknown): Promise<{ profileCount: number; hasVault: boolean }> {
    const parsed = ExportDataSchema.parse(data);

    await this.saveProfiles(parsed.profiles);
    if (parsed.activeProfileId) {
      await this.setActiveProfileId(parsed.activeProfileId);
    }
    await this.updateSettings(parsed.settings);

    let hasVault = false;
    if (parsed.vault) {
      await this.saveEncryptedVault(parsed.vault);
      hasVault = true;
    }

    return {
      profileCount: parsed.profiles.length,
      hasVault,
    };
  }
}
