import { describe, it, expect } from 'vitest';
import {
  FieldSchema,
  ProfileSchema,
  SnippetSchema,
  CardSchema,
  SiteRuleSchema,
  SettingsSchema,
  VaultSchema,
} from './schemas/vault';

describe('Data Model Zod Schemas', () => {
  it('validates a complete Field schema', () => {
    const validField = {
      id: 'f_1',
      label: 'Personal Email',
      key: 'email',
      value: 'alex@example.com',
      type: 'email',
      category: 'contact',
      tags: ['primary', 'contact'],
      sensitive: false,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
      useCount: 3,
      lastUsedAt: 1700000050000,
    };

    const parsed = FieldSchema.parse(validField);
    expect(parsed.label).toBe('Personal Email');
    expect(parsed.useCount).toBe(3);
  });

  it('provides default values for Field attributes', () => {
    const minimalField = {
      id: 'f_2',
      label: 'First Name',
      key: 'first_name',
      value: 'Alex',
    };

    const parsed = FieldSchema.parse(minimalField);
    expect(parsed.type).toBe('text');
    expect(parsed.category).toBe('general');
    expect(parsed.sensitive).toBe(false);
    expect(parsed.useCount).toBe(0);
    expect(parsed.lastUsedAt).toBeNull();
  });

  it('validates a complete Profile schema', () => {
    const validProfile = {
      id: 'prof_1',
      name: 'Developer Profile',
      icon: 'terminal',
      fields: [
        {
          id: 'f_1',
          label: 'GitHub',
          key: 'github',
          value: 'https://github.com/developer',
        },
      ],
    };

    const parsed = ProfileSchema.parse(validProfile);
    expect(parsed.name).toBe('Developer Profile');
    expect(parsed.fields).toHaveLength(1);
  });

  it('validates Snippet schema', () => {
    const snippet = {
      id: 'snip_1',
      trigger: ':intro',
      content: 'Hello, my name is Alex!',
      folder: 'introductions',
    };

    const parsed = SnippetSchema.parse(snippet);
    expect(parsed.trigger).toBe(':intro');
  });

  it('validates Card schema with Luhn validation', () => {
    const validCard = {
      id: 'card_1',
      label: 'Corporate Visa',
      cardholder: 'Alex Morgan',
      number: '4532015112830366', // Valid Luhn
      expMonth: '08',
      expYear: '29',
      brand: 'visa',
      cvv: '123',
    };

    const parsed = CardSchema.parse(validCard);
    expect(parsed.brand).toBe('visa');
    expect(parsed.sensitive).toBe(true);
  });

  it('rejects Card schema when Luhn check fails', () => {
    const invalidCard = {
      id: 'card_invalid',
      label: 'Bad Card',
      cardholder: 'Alex Morgan',
      number: '4532015112830367', // Invalid Luhn
      expMonth: '08',
      expYear: '29',
      brand: 'visa',
    };

    expect(() => CardSchema.parse(invalidCard)).toThrow(/Luhn check failed/);
  });

  it('validates SiteRule schema', () => {
    const rule = {
      id: 'rule_1',
      host: 'example.com',
      profileId: 'prof_1',
      disabledFields: ['email'],
      autoFillRule: 'always',
    };

    const parsed = SiteRuleSchema.parse(rule);
    expect(parsed.host).toBe('example.com');
  });

  it('validates Settings schema with requiresEncryptionForCards flag', () => {
    const settings = {
      language: 'bn',
      theme: 'dark',
      vaultTimeoutMinutes: 30,
      confirmBeforePaymentFill: true,
      requiresEncryptionForCards: true,
    };

    const parsed = SettingsSchema.parse(settings);
    expect(parsed.requiresEncryptionForCards).toBe(true);
    expect(parsed.language).toBe('bn');
  });

  it('validates entire Vault schema', () => {
    const vault = {
      version: 2,
      profiles: [],
      snippets: [],
      cards: [],
      siteRules: [],
      settings: {
        language: 'en',
        theme: 'system',
        vaultTimeoutMinutes: 15,
        confirmBeforePaymentFill: true,
        requiresEncryptionForCards: true,
      },
    };

    const parsed = VaultSchema.parse(vault);
    expect(parsed.version).toBe(2);
    expect(parsed.settings.requiresEncryptionForCards).toBe(true);
  });
});

