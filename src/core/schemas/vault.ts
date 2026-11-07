import { z } from 'zod';
import { FieldKeySchema } from '../canonical';
import { validateLuhn } from '../luhn';

export const FieldTypeSchema = z.enum([
  'text',
  'multiline',
  'email',
  'tel',
  'url',
  'date',
  'select',
]);

export type FieldType = z.infer<typeof FieldTypeSchema>;

export const FieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  key: FieldKeySchema,
  value: z.string(),
  type: FieldTypeSchema.default('text'),
  category: z.string().default('general'),
  tags: z.array(z.string()).default([]),
  sensitive: z.boolean().default(false),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
  useCount: z.number().int().nonnegative().default(0),
  lastUsedAt: z.number().nullable().default(null),
});

export type Field = z.infer<typeof FieldSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  icon: z.string().default('user'),
  fields: z.array(FieldSchema).default([]),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const SnippetSchema = z.object({
  id: z.string(),
  trigger: z.string().min(1),
  content: z.string(),
  folder: z.string().default('general'),
});

export type Snippet = z.infer<typeof SnippetSchema>;

export const CardBrandSchema = z.enum([
  'visa',
  'mastercard',
  'amex',
  'discover',
  'jcb',
  'diners',
  'unionpay',
  'other',
]);

export const CardSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  cardholder: z.string().default(''),
  number: z
    .string()
    .min(12)
    .max(19)
    .refine((num) => validateLuhn(num), {
      message: 'Invalid card number: Luhn check failed',
    }),
  expMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Month must be 01-12'),
  expYear: z.string().regex(/^(\d{2}|\d{4})$/, 'Year must be YY or YYYY'),
  brand: CardBrandSchema,
  cvv: z.string().optional(),
  billingProfileId: z.string().nullable().optional(),
  sensitive: z.literal(true).default(true),
  createdAt: z.number().default(() => Date.now()),
});

export type Card = z.infer<typeof CardSchema>;

export const SiteRuleSchema = z.object({
  id: z.string(),
  host: z.string().min(1),
  profileId: z.string().nullable().optional(),
  disabledFields: z.array(z.string()).default([]),
  autoFillRule: z.enum(['ask', 'always', 'never']).default('ask'),
});

export type SiteRule = z.infer<typeof SiteRuleSchema>;

export const SettingsSchema = z.object({
  language: z.enum(['en', 'bn']).default('en'),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  vaultTimeoutMinutes: z.number().int().min(0).max(120).default(15),
  confirmBeforePaymentFill: z.boolean().default(true),
  requiresEncryptionForCards: z.boolean().default(true),
  showNotifications: z.boolean().default(true),
  defaultProfileId: z.string().optional(),
  onboardingCompleted: z.boolean().optional(),
  customCategories: z.array(z.string()).optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  theme: 'system',
  vaultTimeoutMinutes: 15,
  confirmBeforePaymentFill: true,
  requiresEncryptionForCards: true,
  showNotifications: true,
};

export const CURRENT_VAULT_VERSION = 2;

export const VaultSchema = z.object({
  version: z.number().int().min(1).default(CURRENT_VAULT_VERSION),
  profiles: z.array(ProfileSchema).default([]),
  snippets: z.array(SnippetSchema).default([]),
  cards: z.array(CardSchema).default([]),
  siteRules: z.array(SiteRuleSchema).default([]),
  settings: SettingsSchema.default(DEFAULT_SETTINGS),
});

export type Vault = z.infer<typeof VaultSchema>;

export function createEmptyVault(): Vault {
  return {
    version: CURRENT_VAULT_VERSION,
    profiles: [],
    snippets: [],
    cards: [],
    siteRules: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
