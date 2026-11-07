import { en, type Translations } from './en';
import { bn } from './bn';

export type { Translations };
export type Language = 'en' | 'bn';

const translations: Record<Language, Translations> = {
  en,
  bn,
};

export function getTranslations(lang: Language = 'en'): Translations {
  return translations[lang] ?? translations.en;
}

/**
 * Replace {param} placeholders in translation string.
 */
export function formatString(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}
