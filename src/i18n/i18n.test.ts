import { describe, it, expect } from 'vitest';
import { en } from './en';
import { bn } from './bn';
import { getTranslations, formatString } from './index';

describe('i18n', () => {
  it('returns english by default', () => {
    const t = getTranslations('en');
    expect(t.appName).toBe('Stashfill');
  });

  it('returns bangla translations properly', () => {
    const t = getTranslations('bn');
    expect(t.appName).toBe('স্ট্যাশফিল');
  });

  it('has identical keys in English and Bangla dictionaries', () => {
    function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const full = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          keys = keys.concat(getKeys(v as Record<string, unknown>, full));
        } else {
          keys.push(full);
        }
      }
      return keys;
    }

    const enKeys = getKeys(en as unknown as Record<string, unknown>).sort();
    const bnKeys = getKeys(bn as unknown as Record<string, unknown>).sort();

    expect(bnKeys).toEqual(enKeys);
  });

  it('formats placeholder parameters correctly', () => {
    const template = 'Filled {count} fields in {minutes} minutes!';
    const formatted = formatString(template, { count: 5, minutes: 2 });
    expect(formatted).toBe('Filled 5 fields in 2 minutes!');
  });
});

