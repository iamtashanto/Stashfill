import { z } from 'zod';

export const SettingsSchema = z.object({
  language: z.enum(['en', 'bn']).default('en'),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  vaultTimeoutMinutes: z.number().int().min(0).max(120).default(15),
  confirmBeforePaymentFill: z.boolean().default(true),
  showNotifications: z.boolean().default(true),
  defaultProfileId: z.string().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'system',
  vaultTimeoutMinutes: 15,
  confirmBeforePaymentFill: true,
  showNotifications: true,
};
