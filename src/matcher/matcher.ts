import type { Profile as LegacyProfile } from '../types/profile';
import type { Profile as VaultProfile } from '../core/schemas/vault';
import type { CanonicalKey } from '../core/canonical';
import enSynonyms from './synonyms/en.json' with { type: 'json' };
import bnSynonyms from './synonyms/bn.json' with { type: 'json' };

export type ProfileFieldKey =
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'altPhone'
  | 'address1'
  | 'address2'
  | 'city'
  | 'state'
  | 'postalCode'
  | 'country'
  | 'website'
  | 'title'
  | 'gender';

export type PaymentFieldKey =
  | 'cardholderName'
  | 'cardNumber'
  | 'cardNumberSplit1'
  | 'cardNumberSplit2'
  | 'cardNumberSplit3'
  | 'cardNumberSplit4'
  | 'expMonth'
  | 'expYear'
  | 'expiry'
  | 'expiryMMYY'
  | 'expiryMMYYYY'
  | 'cvv';

export interface FieldAttributes {
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  placeholder?: string;
  ariaLabel?: string;
  labelText?: string;
  nearbyText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  tabIndex?: number;
  maxLength?: number;
  isHoneypot?: boolean;
  styleDisplay?: string;
  styleVisibility?: string;
  styleOpacity?: string;
  isOffScreen?: boolean;
}

export interface RankedCandidate {
  key: CanonicalKey;
  score: number;
  reason: string;
}

export interface MatchResult {
  skipped: boolean;
  skipReason?: string;
  ambiguous: boolean;
  candidates: RankedCandidate[];
}

export interface CardFieldMatch {
  field: PaymentFieldKey;
  score: number;
  reason: string;
  splitIndex?: 0 | 1 | 2 | 3;
  expiryFormat?: 'MM/YY' | 'MM/YYYY';
}

interface SynonymEntry {
  autocomplete: string[];
  exact: string[];
  keywords: string[];
}

type SynonymDictionary = Record<CanonicalKey, SynonymEntry>;

const SYNONYM_DICTIONARIES: SynonymDictionary[] = [
  enSynonyms as SynonymDictionary,
  bnSynonyms as SynonymDictionary,
];

/**
 * Tokenizes camelCase, PascalCase, snake_case, kebab-case, and whitespace-separated identifiers.
 */
export function tokenizeIdentifier(raw: string): string[] {
  if (!raw) return [];
  const normalized = raw
    // Insert space between camelCase / PascalCase transitions (e.g. firstName -> first Name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_./[\]()]+/g, ' ')
    .toLowerCase()
    .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

const OTP_HONEYPOT_PATTERNS =
  /\b(otp|one[-_\s]?time|totp|2fa|mfa|verification[-_\s]?code|verify[-_\s]?code|auth[-_\s]?code|passcode|pin[-_\s]?code|security[-_\s]?pin|captcha|honeypot|bot[-_\s]?check|website[-_\s]?url[-_\s]?trap)\b|(ওটিপি|যাচাইকরণ\s*কোড|ভেরিফিকেশন\s*কোড)/i;

/**
 * Pure check for whether a field should be skipped (password, hidden, disabled, readonly,
 * honeypot traps, or OTP/verification code fields).
 */
export function shouldSkipField(attrs: FieldAttributes): { skip: boolean; reason?: string } {
  const type = (attrs.type || '').toLowerCase().trim();
  const ac = (attrs.autocomplete || '').toLowerCase().trim();

  if (type === 'password' || ac === 'current-password' || ac === 'new-password') {
    return { skip: true, reason: 'password field' };
  }
  if (type === 'hidden') {
    return { skip: true, reason: 'hidden input type' };
  }
  if (attrs.disabled) {
    return { skip: true, reason: 'disabled field' };
  }
  if (attrs.readOnly) {
    return { skip: true, reason: 'readonly field' };
  }
  if (
    attrs.isHoneypot ||
    attrs.styleDisplay === 'none' ||
    attrs.styleVisibility === 'hidden' ||
    attrs.styleOpacity === '0' ||
    attrs.isOffScreen
  ) {
    return { skip: true, reason: 'honeypot or hidden via CSS' };
  }

  const combinedMeta = `${attrs.name || ''} ${attrs.id || ''} ${attrs.labelText || ''} ${attrs.placeholder || ''} ${attrs.ariaLabel || ''}`;

  // Tabindex -1 trap without explicit user label or with honeypot naming
  if (
    attrs.tabIndex === -1 &&
    (!attrs.labelText?.trim() || /honeypot|trap|fax_only|url_confirm/i.test(combinedMeta))
  ) {
    return { skip: true, reason: 'tabindex -1 honeypot trap' };
  }

  // OTP / Verification code detection
  if (ac === 'one-time-code' || OTP_HONEYPOT_PATTERNS.test(combinedMeta)) {
    // Allow postal pin code ("pin code" / "pincode") when clearly postal
    if (!/\b(postal|zip|shipping|billing|address|পোস্টাল)\b/i.test(combinedMeta)) {
      return { skip: true, reason: 'OTP or verification code field' };
    }
  }

  // Payment card fields are skipped by the profile matcher (handled by separate card detector)
  if (isPaymentField(attrs)) {
    return { skip: true, reason: 'payment card field (separate path)' };
  }

  return { skip: false };
}

// Precompute compiled lookup structures for fast scanning (< 50ms for 200 inputs)
interface CompiledKeyRules {
  key: CanonicalKey;
  autocompletes: Set<string>;
  exactTokens: Set<string>;
  keywords: string[];
}

const ORDERED_CANONICAL_KEYS: CanonicalKey[] = [
  'first_name',
  'last_name',
  'full_name',
  'email',
  'mobile',
  'phone',
  'address_line2',
  'address_line1',
  'city',
  'state',
  'postal_code',
  'country',
  'company',
  'job_title',
  'linkedin',
  'github',
  'twitter',
  'website',
  'date_of_birth',
  'username',
  'bio',
];

const COMPILED_RULES: CompiledKeyRules[] = ORDERED_CANONICAL_KEYS.map((key) => {
  const autocompletes = new Set<string>();
  const exactTokens = new Set<string>();
  const keywords: string[] = [];

  for (const dict of SYNONYM_DICTIONARIES) {
    const entry = dict[key];
    if (!entry) continue;
    for (const ac of entry.autocomplete) autocompletes.add(ac.toLowerCase());
    for (const ex of entry.exact) {
      exactTokens.add(ex.toLowerCase());
      exactTokens.add(ex.toLowerCase().replace(/[-_]/g, ' '));
    }
    for (const kw of entry.keywords) keywords.push(kw.toLowerCase());
  }

  // Sort longer keywords first so specific phrases ("first name") score higher than generic ("name")
  keywords.sort((a, b) => b.length - a.length);

  return { key, autocompletes, exactTokens, keywords };
});

function matchesKeywordPhrase(haystack: string, keyword: string): boolean {
  if (!haystack || !keyword) return false;
  // For short ASCII keywords (<= 4 chars like "name", "city", "zip", "tel", "bio", "org", "dob"),
  // require word boundaries so "username" or "company_name" doesn't falsely match generic "name"
  if (/^[a-z0-9\s]+$/i.test(keyword) && keyword.length <= 5) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i');
    return re.test(haystack);
  }
  return haystack.includes(keyword);
}

/**
 * Pure function: Given field attributes (or an input element's extracted attributes),
 * returns ranked candidate canonical keys with a score from 0 to 1 and a readable reason.
 * Signals (strongest first):
 * 1. autocomplete attribute (0.98)
 * 2. input type (0.92)
 * 3. name and id (tokenized camelCase, snake_case, kebab-case) (0.88)
 * 4. associated label (for, wrapping label, aria-labelledby) (0.84)
 * 5. placeholder (0.76)
 * 6. aria-label (0.74)
 * 7. nearby text (0.65)
 *
 * If the top two candidates are within 0.05 of each other, marks `ambiguous: true`.
 */
export function rankFieldCandidates(attrs: FieldAttributes): MatchResult {
  const skipCheck = shouldSkipField(attrs);
  if (skipCheck.skip) {
    return {
      skipped: true,
      skipReason: skipCheck.reason,
      ambiguous: false,
      candidates: [],
    };
  }

  const candidateMap = new Map<CanonicalKey, RankedCandidate>();

  const addCandidate = (key: CanonicalKey, score: number, reason: string) => {
    const existing = candidateMap.get(key);
    if (!existing || score > existing.score) {
      candidateMap.set(key, {
        key,
        score: Math.min(1, Number(score.toFixed(2))),
        reason,
      });
    }
  };

  const acRaw = (attrs.autocomplete || '').toLowerCase().trim();
  const type = (attrs.type || '').toLowerCase().trim();
  const nameRaw = (attrs.name || '').trim();
  const idRaw = (attrs.id || '').trim();
  const labelText = (attrs.labelText || '').toLowerCase().trim();
  const placeholder = (attrs.placeholder || '').toLowerCase().trim();
  const ariaLabel = (attrs.ariaLabel || '').toLowerCase().trim();
  const nearbyText = (attrs.nearbyText || '').toLowerCase().trim();

  // 1. Autocomplete attribute (strongest signal: 0.98)
  if (acRaw && acRaw !== 'on' && acRaw !== 'off') {
    const acTokens = acRaw.split(/\s+/);
    for (const rule of COMPILED_RULES) {
      const matchedToken = acTokens.find((t) => rule.autocompletes.has(t));
      if (matchedToken) {
        addCandidate(rule.key, 0.98, `autocomplete="${matchedToken}"`);
      }
    }
  }

  // 2. Input type (score: 0.92, or refined by label/name if mobile vs phone)
  if (type === 'email') {
    addCandidate('email', 0.92, 'input[type="email"]');
  } else if (type === 'tel') {
    addCandidate('phone', 0.9, 'input[type="tel"]');
  } else if (type === 'url') {
    addCandidate('website', 0.86, 'input[type="url"]');
  } else if (type === 'date') {
    if (/\b(birth|dob|bday|জন্ম)\b/i.test(`${nameRaw} ${idRaw} ${labelText} ${placeholder}`)) {
      addCandidate('date_of_birth', 0.92, 'input[type="date"] with birth label');
    }
  }

  // 3. Name and ID (tokenized camelCase, snake_case, kebab-case) (score: 0.88 - 0.91)
  const nameTokens = tokenizeIdentifier(nameRaw);
  const idTokens = tokenizeIdentifier(idRaw);
  const nameJoined = nameTokens.join(' ');
  const idJoined = idTokens.join(' ');
  const nameLower = nameRaw.toLowerCase();
  const idLower = idRaw.toLowerCase();

  for (const rule of COMPILED_RULES) {
    if (
      (nameLower && rule.exactTokens.has(nameLower)) ||
      (nameJoined && rule.exactTokens.has(nameJoined))
    ) {
      addCandidate(rule.key, 0.91, `name="${nameRaw}" exact match`);
      continue;
    }
    if (
      (idLower && rule.exactTokens.has(idLower)) ||
      (idJoined && rule.exactTokens.has(idJoined))
    ) {
      addCandidate(rule.key, 0.9, `id="${idRaw}" exact match`);
      continue;
    }

    // Check multi-token or single-token matches in tokenized name/id
    for (const kw of rule.keywords) {
      if (nameJoined && matchesKeywordPhrase(nameJoined, kw)) {
        // Avoid matching generic "name" when tokens are specific to another key (e.g. "first name", "company name", "user name")
        if (
          rule.key === 'full_name' &&
          kw === 'name' &&
          /\b(first|last|given|family|sur|user|company|org|business|card|holder|file|domain|host)\b/.test(
            nameJoined,
          )
        ) {
          continue;
        }
        addCandidate(rule.key, 0.88, `name="${nameRaw}" matches "${kw}"`);
        break;
      }
      if (idJoined && matchesKeywordPhrase(idJoined, kw)) {
        if (
          rule.key === 'full_name' &&
          kw === 'name' &&
          /\b(first|last|given|family|sur|user|company|org|business|card|holder|file|domain|host)\b/.test(
            idJoined,
          )
        ) {
          continue;
        }
        addCandidate(rule.key, 0.87, `id="${idRaw}" matches "${kw}"`);
        break;
      }
    }
  }

  // 4. Associated label (for, wrapping label, aria-labelledby) (score: 0.84 - 0.86)
  if (labelText) {
    for (const rule of COMPILED_RULES) {
      for (const kw of rule.keywords) {
        if (matchesKeywordPhrase(labelText, kw)) {
          if (
            rule.key === 'full_name' &&
            (kw === 'name' || kw === 'নাম') &&
            /first|last|given|family|surname|user|company|organization|employer|প্রথম|শেষ|বংশ|প্রতিষ্ঠান|কোম্পানি|ইউজার/i.test(
              labelText,
            )
          ) {
            continue;
          }
          const specificityBonus = kw.length > 6 ? 0.02 : 0;
          addCandidate(rule.key, 0.84 + specificityBonus, `label matches "${kw}"`);
          break;
        }
      }
    }
  }

  // 5. Placeholder (score: 0.76 - 0.78)
  if (placeholder) {
    for (const rule of COMPILED_RULES) {
      for (const kw of rule.keywords) {
        if (matchesKeywordPhrase(placeholder, kw)) {
          if (
            rule.key === 'full_name' &&
            (kw === 'name' || kw === 'নাম') &&
            /first|last|given|family|surname|user|company|প্রথম|শেষ|প্রতিষ্ঠান|ইউজার/i.test(
              placeholder,
            )
          ) {
            continue;
          }
          addCandidate(rule.key, 0.76 + (kw.length > 6 ? 0.02 : 0), `placeholder matches "${kw}"`);
          break;
        }
      }
    }
  }

  // 6. aria-label (score: 0.74 - 0.76)
  if (ariaLabel) {
    for (const rule of COMPILED_RULES) {
      for (const kw of rule.keywords) {
        if (matchesKeywordPhrase(ariaLabel, kw)) {
          if (
            rule.key === 'full_name' &&
            (kw === 'name' || kw === 'নাম') &&
            /first|last|given|family|surname|user|company|প্রথম|শেষ|প্রতিষ্ঠান|ইউজার/i.test(
              ariaLabel,
            )
          ) {
            continue;
          }
          addCandidate(rule.key, 0.74 + (kw.length > 6 ? 0.02 : 0), `aria-label matches "${kw}"`);
          break;
        }
      }
    }
  }

  // 7. Nearby text (score: 0.65 - 0.67)
  if (nearbyText) {
    for (const rule of COMPILED_RULES) {
      for (const kw of rule.keywords) {
        if (matchesKeywordPhrase(nearbyText, kw)) {
          if (
            rule.key === 'full_name' &&
            (kw === 'name' || kw === 'নাম') &&
            /first|last|given|family|surname|user|company|প্রথম|শেষ|প্রতিষ্ঠান|ইউজার/i.test(
              nearbyText,
            )
          ) {
            continue;
          }
          addCandidate(rule.key, 0.65 + (kw.length > 6 ? 0.02 : 0), `nearby text matches "${kw}"`);
          break;
        }
      }
    }
  }

  const candidates = Array.from(candidateMap.values()).sort((a, b) => b.score - a.score);

  // Ambiguity check: if top 2 candidates are within 0.05 score of each other
  const first = candidates[0];
  const second = candidates[1];
  const ambiguous = Boolean(first && second && Math.abs(first.score - second.score) <= 0.05);

  return {
    skipped: false,
    ambiguous,
    candidates,
  };
}

// --- Payment Card Detection (Separate Path) ---

const PAYMENT_PATTERNS: {
  key: PaymentFieldKey;
  autocomplete: string[];
  exactMatch: RegExp;
  keywordMatch: RegExp;
}[] = [
  {
    key: 'cardNumber',
    autocomplete: ['cc-number'],
    exactMatch:
      /^(cc[-_]?num|card[-_]?num|cc[-_]?number|card[-_]?number|creditcard|pan|card_pan)$/i,
    keywordMatch: /(card\s*number|credit\s*card\s*number|debit\s*card\s*number|কার্ড\s*নম্বর)/i,
  },
  {
    key: 'cardholderName',
    autocomplete: ['cc-name', 'cc-given-name', 'cc-family-name'],
    exactMatch:
      /^(cc[-_]?name|card[-_]?name|cardholder|cardholder[-_]?name|name[-_]?on[-_]?card)$/i,
    keywordMatch: /(name\s*on\s*card|cardholder\s*name|card\s*holder|কার্ডধারীর\s*নাম)/i,
  },
  {
    key: 'expMonth',
    autocomplete: ['cc-exp-month'],
    exactMatch: /^(exp[-_]?month|cc[-_]?month|expiry[-_]?month|card[-_]?exp[-_]?month|mm)$/i,
    keywordMatch: /(exp(iry|iration)?\s*month|কার্ডের\s*মাস)/i,
  },
  {
    key: 'expYear',
    autocomplete: ['cc-exp-year'],
    exactMatch: /^(exp[-_]?year|cc[-_]?year|expiry[-_]?year|card[-_]?exp[-_]?year|yy|yyyy)$/i,
    keywordMatch: /(exp(iry|iration)?\s*year|কার্ডের\s*বছর)/i,
  },
  {
    key: 'expiry',
    autocomplete: ['cc-exp'],
    exactMatch: /^(exp|ccexp|cc[-_]?exp|exp[-_]?date|expiry|expiration|expiry[-_]?date)$/i,
    keywordMatch: /(exp(iration|iry)?\s*date|valid\s*thru|mm\s*\/\s*yy|মেয়াদোত্তীর্ণ)/i,
  },
  {
    key: 'cvv',
    autocomplete: ['cc-csc'],
    exactMatch: /^(cvv|cvc|csc|cvv2|cvc2|security[-_]?code|card[-_]?code|card[-_]?cvc)$/i,
    keywordMatch: /(cvv|cvc|csc|security\s*code|card\s*verification|সিভিভি)/i,
  },
];

const SPLIT_CARD_PATTERNS: { index: 0 | 1 | 2 | 3; key: PaymentFieldKey; regex: RegExp }[] = [
  {
    index: 0,
    key: 'cardNumberSplit1',
    regex: /(?:cc|card)[-_]?(?:num|number|part|segment|box)?[-_]?1\b|\bpan[-_]?1\b/i,
  },
  {
    index: 1,
    key: 'cardNumberSplit2',
    regex: /(?:cc|card)[-_]?(?:num|number|part|segment|box)?[-_]?2\b|\bpan[-_]?2\b/i,
  },
  {
    index: 2,
    key: 'cardNumberSplit3',
    regex: /(?:cc|card)[-_]?(?:num|number|part|segment|box)?[-_]?3\b|\bpan[-_]?3\b/i,
  },
  {
    index: 3,
    key: 'cardNumberSplit4',
    regex: /(?:cc|card)[-_]?(?:num|number|part|segment|box)?[-_]?4\b|\bpan[-_]?4\b/i,
  },
];

/**
 * Detailed payment card detector supporting:
 * - autocomplete: cc-name, cc-number, cc-exp, cc-exp-month, cc-exp-year, cc-csc
 * - split card number inputs (4 boxes)
 * - single expiry field formats MM/YY vs MM/YYYY
 * - month/year selects
 */
export function detectCardField(attrs: FieldAttributes): CardFieldMatch | null {
  const ac = (attrs.autocomplete ?? '').toLowerCase().trim();
  const id = (attrs.id ?? '').toLowerCase().trim();
  const name = (attrs.name ?? '').toLowerCase().trim();
  const placeholder = (attrs.placeholder ?? '').toLowerCase().trim();
  const ariaLabel = (attrs.ariaLabel ?? '').toLowerCase().trim();
  const labelText = (attrs.labelText ?? '').toLowerCase().trim();
  const combinedIdName = `${id} ${name}`;
  const combinedAll = `${labelText} ${placeholder} ${ariaLabel} ${id} ${name}`;

  // 1. Check split card number inputs (4 boxes, e.g., card_num_1..4 or maxLength=4 with card label)
  for (const split of SPLIT_CARD_PATTERNS) {
    if (split.regex.test(combinedIdName) || split.regex.test(ariaLabel)) {
      return {
        field: split.key,
        score: 0.95,
        reason: `split card number box ${split.index + 1}`,
        splitIndex: split.index,
      };
    }
  }

  const detectExpiryFormat = (): 'MM/YY' | 'MM/YYYY' => {
    if (/mm\s*\/\s*yyyy|mmyyyy/i.test(combinedAll) || attrs.maxLength === 7) {
      return 'MM/YYYY';
    }
    return 'MM/YY';
  };

  // 2. Autocomplete
  if (ac) {
    const acTokens = ac.split(/\s+/);
    for (const p of PAYMENT_PATTERNS) {
      if (p.autocomplete.some((token) => acTokens.includes(token))) {
        if (p.key === 'expiry') {
          const fmt = detectExpiryFormat();
          return {
            field: 'expiry',
            score: 0.99,
            reason: `autocomplete="${ac}" (${fmt})`,
            expiryFormat: fmt,
          };
        }
        return { field: p.key, score: 0.99, reason: `autocomplete="${ac}"` };
      }
    }
  }

  // 3. Exact ID/Name
  for (const p of PAYMENT_PATTERNS) {
    if (p.exactMatch.test(id) || p.exactMatch.test(name)) {
      if (p.key === 'expiry') {
        const fmt = detectExpiryFormat();
        return {
          field: 'expiry',
          score: 0.92,
          reason: `id/name exact match (${fmt})`,
          expiryFormat: fmt,
        };
      }
      return { field: p.key, score: 0.92, reason: 'id/name exact match' };
    }
  }

  // 4. Keyword heuristic
  for (const p of PAYMENT_PATTERNS) {
    if (p.keywordMatch.test(combinedAll)) {
      if (p.key === 'expiry') {
        const fmt = detectExpiryFormat();
        return {
          field: 'expiry',
          score: 0.85,
          reason: `keyword match (${fmt})`,
          expiryFormat: fmt,
        };
      }
      return { field: p.key, score: 0.85, reason: 'keyword match' };
    }
  }

  return null;
}

export function matchPaymentField(attrs: FieldAttributes): PaymentFieldKey | null {
  const detected = detectCardField(attrs);
  return detected ? detected.field : null;
}

export function isPaymentField(attrs: FieldAttributes): boolean {
  return detectCardField(attrs) !== null;
}

const CANONICAL_TO_LEGACY_KEY: Record<CanonicalKey, ProfileFieldKey> = {
  full_name: 'fullName',
  first_name: 'firstName',
  last_name: 'lastName',
  email: 'email',
  phone: 'phone',
  mobile: 'altPhone',
  address_line1: 'address1',
  address_line2: 'address2',
  city: 'city',
  state: 'state',
  postal_code: 'postalCode',
  country: 'country',
  website: 'website',
  job_title: 'title',
  company: 'title',
  linkedin: 'website',
  github: 'website',
  twitter: 'website',
  date_of_birth: 'title',
  username: 'fullName',
  bio: 'title',
};

/**
 * Legacy helper returning a ProfileFieldKey for backward compatibility with existing callers.
 */
export function matchProfileField(attrs: FieldAttributes): ProfileFieldKey | null {
  const result = rankFieldCandidates(attrs);
  if (result.skipped || result.candidates.length === 0) return null;
  const top = result.candidates[0]!;
  // Compatibility mapping: if input is mobile/cell in legacy tests expecting 'phone', map mobile -> phone unless explicitly alt/secondary
  if (
    top.key === 'mobile' &&
    !/\b(alt|alternate|secondary|work|home|বিকল্প)\b/i.test(
      `${attrs.name || ''} ${attrs.id || ''} ${attrs.labelText || ''} ${attrs.placeholder || ''}`,
    )
  ) {
    return 'phone';
  }
  return CANONICAL_TO_LEGACY_KEY[top.key] ?? null;
}

const CANONICAL_MAPPING: Record<string, string[]> = {
  fullName: ['full_name'],
  full_name: ['full_name'],
  firstName: ['first_name'],
  first_name: ['first_name'],
  lastName: ['last_name'],
  last_name: ['last_name'],
  email: ['email'],
  phone: ['phone', 'mobile'],
  altPhone: ['mobile', 'phone'],
  mobile: ['mobile', 'phone'],
  address1: ['address_line1'],
  address_line1: ['address_line1'],
  address2: ['address_line2'],
  address_line2: ['address_line2'],
  city: ['city'],
  state: ['state'],
  postalCode: ['postal_code'],
  postal_code: ['postal_code'],
  country: ['country'],
  website: ['website'],
  title: ['job_title'],
  job_title: ['job_title'],
  company: ['company'],
  linkedin: ['linkedin'],
  github: ['github'],
  twitter: ['twitter'],
  date_of_birth: ['date_of_birth'],
  username: ['username'],
  bio: ['bio'],
  gender: ['gender'],
};

/**
 * Resolves the profile value for a given canonical key or legacy ProfileFieldKey.
 */
export function resolveProfileValue(
  profile: VaultProfile | LegacyProfile | Record<string, unknown>,
  key: ProfileFieldKey | CanonicalKey,
): string {
  if (!profile) return '';

  if ('fields' in profile && Array.isArray(profile.fields)) {
    const fields = profile.fields as { key?: string; id?: string; value?: string }[];
    const keysToCheck = CANONICAL_MAPPING[key] || [key];
    for (const k of keysToCheck) {
      const match = fields.find((f) => f.key === k);
      if (match && match.value) return match.value;
    }
    const directMatch = fields.find((f) => f.key === key || f.id === key);
    if (directMatch && directMatch.value) return directMatch.value;

    if (key === 'fullName' || key === 'full_name') {
      const fn = fields.find((f) => f.key === 'first_name')?.value || '';
      const ln = fields.find((f) => f.key === 'last_name')?.value || '';
      if (fn || ln) return `${fn} ${ln}`.trim();
    }
    if (key === 'firstName' || key === 'first_name') {
      const full = fields.find((f) => f.key === 'full_name')?.value || '';
      if (full) return full.split(/\s+/)[0] || '';
    }
    if (key === 'lastName' || key === 'last_name') {
      const full = fields.find((f) => f.key === 'full_name')?.value || '';
      if (full) {
        const parts = full.split(/\s+/);
        return parts.length > 1 ? parts.slice(1).join(' ') : '';
      }
    }
    return '';
  }

  const legacy = profile as Record<string, unknown>;
  const fullName = typeof legacy.fullName === 'string' ? legacy.fullName : '';
  const firstName = typeof legacy.firstName === 'string' ? legacy.firstName : '';
  const lastName = typeof legacy.lastName === 'string' ? legacy.lastName : '';

  switch (key) {
    case 'fullName':
    case 'full_name':
      if (fullName) return fullName;
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return '';
    case 'firstName':
    case 'first_name':
      if (firstName) return firstName;
      if (fullName) return fullName.split(/\s+/)[0] ?? '';
      return '';
    case 'lastName':
    case 'last_name':
      if (lastName) return lastName;
      if (fullName) {
        const parts = fullName.split(/\s+/);
        return parts.length > 1 ? parts.slice(1).join(' ') : '';
      }
      return '';
    case 'address_line1':
      return typeof legacy.address1 === 'string' ? legacy.address1 : '';
    case 'address_line2':
      return typeof legacy.address2 === 'string' ? legacy.address2 : '';
    case 'postal_code':
      return typeof legacy.postalCode === 'string' ? legacy.postalCode : '';
    default:
      return typeof legacy[key] === 'string' ? (legacy[key] as string) : '';
  }
}
