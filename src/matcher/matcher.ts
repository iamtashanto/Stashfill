import type { Profile as LegacyProfile } from '../types/profile';
import type { Profile as VaultProfile } from '../core/schemas/vault';

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
  'cardholderName' | 'cardNumber' | 'expMonth' | 'expYear' | 'expiry' | 'cvv';

export interface FieldAttributes {
  type?: string;
  name?: string;
  id?: string;
  autocomplete?: string;
  placeholder?: string;
  ariaLabel?: string;
  labelText?: string;
}

interface HeuristicPattern {
  key: ProfileFieldKey;
  autocomplete: string[];
  exactMatch: RegExp;
  keywordMatch: RegExp;
}

const PROFILE_PATTERNS: HeuristicPattern[] = [
  // First Name (Must be before Full Name)
  {
    key: 'firstName',
    autocomplete: ['given-name', 'fname'],
    exactMatch: /(^|[-_])(fname|first[-_]?name|given[-_]?name|forename)($|[-_])/i,
    keywordMatch: /(first\s*name|given\s*name|forename|প্রথম\s*নাম)/i,
  },
  // Last Name (Must be before Full Name)
  {
    key: 'lastName',
    autocomplete: ['family-name', 'lname'],
    exactMatch: /(^|[-_])(lname|last[-_]?name|family[-_]?name|surname)($|[-_])/i,
    keywordMatch: /(last\s*name|family\s*name|surname|শেষ\s*নাম|বংশনাম|পদবী)/i,
  },
  // Full Name
  {
    key: 'fullName',
    autocomplete: ['name'],
    exactMatch: /(^|[-_])(fullname|full[-_]?name|your[-_]?name|name|contact[-_]?name)($|[-_])/i,
    keywordMatch:
      /(full\s*name|your\s*name|contact\s*name|complete\s*name|পূর্ণ\s*নাম|আপনার\s*নাম|(^|\s)নাম(\s|$))/i,
  },
  // Email
  {
    key: 'email',
    autocomplete: ['email'],
    exactMatch: /(^|[-_])(email|e[-_]?mail)($|[-_])/i,
    keywordMatch: /(e[-_]?mail|ইমেইল|ই-মেইল)/i,
  },
  // Phone
  {
    key: 'phone',
    autocomplete: ['tel', 'tel-national', 'tel-local', 'phone'],
    exactMatch: /(^|[-_])(phone|tel|telephone|mobile|cell|phone[-_]?number)($|[-_])/i,
    keywordMatch: /(phone|telephone|mobile|cell\s*phone|contact\s*no|ফোন|মোবাইল|মুঠোফোন)/i,
  },
  // Alternate Phone
  {
    key: 'altPhone',
    autocomplete: [],
    exactMatch:
      /(^|[-_])(alt[-_]?phone|secondary[-_]?phone|work[-_]?phone|home[-_]?phone)($|[-_])/i,
    keywordMatch: /(alt(ernate)?\s*phone|secondary\s*phone|work\s*phone|বিকল্প\s*ফোন)/i,
  },
  // Address 2 (Must be before Address 1)
  {
    key: 'address2',
    autocomplete: ['address-line2'],
    exactMatch: /(^|[-_])(address2|apt|suite|unit|apartment|address[-_]?line[-_]?2)($|[-_])/i,
    keywordMatch: /(address\s*line\s*2|apt|suite|unit|apartment|বিল্ডিং|অ্যাপার্টমেন্ট|ফ্ল্যাট)/i,
  },
  // Address 1
  {
    key: 'address1',
    autocomplete: ['street-address', 'address-line1'],
    exactMatch: /(^|[-_])(address|addr|address1|street|street[-_]?address)($|[-_])/i,
    keywordMatch:
      /(street\s*address|address\s*line\s*1|street|mailing\s*address|ঠিকানা|রাস্তার\s*ঠিকানা)/i,
  },
  // City
  {
    key: 'city',
    autocomplete: ['address-level2'],
    exactMatch: /(^|[-_])(city|town|suburb|locality)($|[-_])/i,
    keywordMatch: /(city|town|municipality|locality|শহর|উপজেলা)/i,
  },
  // State
  {
    key: 'state',
    autocomplete: ['address-level1'],
    exactMatch: /(^|[-_])(state|province|region|county|state[-_]?province)($|[-_])/i,
    keywordMatch: /(state|province|region|county|বিভাগ|রাজ্য|জেলা)/i,
  },
  // Postal / Zip Code
  {
    key: 'postalCode',
    autocomplete: ['postal-code'],
    exactMatch: /(^|[-_])(zip|zipcode|zip[-_]?code|postal|postal[-_]?code|postcode)($|[-_])/i,
    keywordMatch: /(zip|postal\s*code|postcode|zipcode|পোস্টাল\s*কোড|জিপ\s*কোড)/i,
  },
  // Country
  {
    key: 'country',
    autocomplete: ['country', 'country-name'],
    exactMatch: /(^|[-_])(country|country[-_]?code|nation)($|[-_])/i,
    keywordMatch: /(country|nation|দেশ)/i,
  },
  // Website
  {
    key: 'website',
    autocomplete: ['url'],
    exactMatch: /(^|[-_])(website|url|webpage|homepage|site)($|[-_])/i,
    keywordMatch: /(website|web\s*page|portfolio|url|ওয়েবসাইট)/i,
  },
  // Title / Prefix
  {
    key: 'title',
    autocomplete: ['honorific-prefix'],
    exactMatch: /(^|[-_])(title|prefix|honorific|salutation)($|[-_])/i,
    keywordMatch: /(title|prefix|salutation|পদবী|উপাধি)/i,
  },
  // Gender
  {
    key: 'gender',
    autocomplete: ['sex'],
    exactMatch: /(^|[-_])(gender|sex)($|[-_])/i,
    keywordMatch: /(gender|sex|লিঙ্গ)/i,
  },
];

const PAYMENT_PATTERNS: {
  key: PaymentFieldKey;
  autocomplete: string[];
  exactMatch: RegExp;
  keywordMatch: RegExp;
}[] = [
  {
    key: 'cardNumber',
    autocomplete: ['cc-number'],
    exactMatch: /^(cc[-_]?num|card[-_]?num|cc[-_]?number|card[-_]?number|creditcard)$/i,
    keywordMatch: /(card\s*number|credit\s*card\s*number|কার্ড\s*নম্বর)/i,
  },
  {
    key: 'cardholderName',
    autocomplete: ['cc-name'],
    exactMatch: /^(cc[-_]?name|card[-_]?name|cardholder|cardholder[-_]?name)$/i,
    keywordMatch: /(name\s*on\s*card|cardholder\s*name|কার্ডধারীর\s*নাম)/i,
  },
  {
    key: 'expMonth',
    autocomplete: ['cc-exp-month'],
    exactMatch: /^(exp[-_]?month|cc[-_]?month|expiry[-_]?month)$/i,
    keywordMatch: /(exp(iry)?\s*month|মাস)/i,
  },
  {
    key: 'expYear',
    autocomplete: ['cc-exp-year'],
    exactMatch: /^(exp[-_]?year|cc[-_]?year|expiry[-_]?year)$/i,
    keywordMatch: /(exp(iry)?\s*year|বছর)/i,
  },
  {
    key: 'expiry',
    autocomplete: ['cc-exp'],
    exactMatch: /^(exp|ccexp|exp[-_]?date|expiry|expiration)$/i,
    keywordMatch: /(exp(iration|iry)?\s*date|valid\s*thru|মেয়াদোত্তীর্ণ)/i,
  },
  {
    key: 'cvv',
    autocomplete: ['cc-csc'],
    exactMatch: /^(cvv|cvc|csc|security[-_]?code|card[-_]?code)$/i,
    keywordMatch: /(cvv|cvc|csc|security\s*code|verification\s*code|সিভিভি)/i,
  },
];

/**
 * Identify which profile field corresponds to an input field.
 * Payment fields are deliberately excluded from this to ensure payment data
 * is NEVER filled without explicit user consent.
 */
export function matchProfileField(attrs: FieldAttributes): ProfileFieldKey | null {
  // If field is a password or payment field, return null
  if (attrs.type === 'password' || isPaymentField(attrs)) {
    return null;
  }

  // 1. Direct type match for email and tel and url
  if (attrs.type === 'email') return 'email';
  if (attrs.type === 'tel') return 'phone';
  if (attrs.type === 'url') return 'website';

  const ac = (attrs.autocomplete ?? '').toLowerCase().trim();
  const id = (attrs.id ?? '').toLowerCase().trim();
  const name = (attrs.name ?? '').toLowerCase().trim();
  const placeholder = (attrs.placeholder ?? '').toLowerCase().trim();
  const ariaLabel = (attrs.ariaLabel ?? '').toLowerCase().trim();
  const labelText = (attrs.labelText ?? '').toLowerCase().trim();

  // 2. Autocomplete token match
  if (ac && ac !== 'on' && ac !== 'off') {
    const acTokens = ac.split(/\s+/);
    for (const pattern of PROFILE_PATTERNS) {
      if (pattern.autocomplete.some((token) => acTokens.includes(token))) {
        return pattern.key;
      }
    }
  }

  // 3. Exact identifier match (id or name)
  for (const pattern of PROFILE_PATTERNS) {
    if (pattern.exactMatch.test(id) || pattern.exactMatch.test(name)) {
      return pattern.key;
    }
  }

  // 4. Keyword heuristic on label text, placeholder, aria-label
  const combinedText = `${labelText} ${placeholder} ${ariaLabel} ${id} ${name}`;
  for (const pattern of PROFILE_PATTERNS) {
    if (pattern.keywordMatch.test(combinedText)) {
      return pattern.key;
    }
  }

  return null;
}

/**
 * Identify if an element is specifically a payment card field.
 */
export function matchPaymentField(attrs: FieldAttributes): PaymentFieldKey | null {
  const ac = (attrs.autocomplete ?? '').toLowerCase().trim();
  const id = (attrs.id ?? '').toLowerCase().trim();
  const name = (attrs.name ?? '').toLowerCase().trim();
  const placeholder = (attrs.placeholder ?? '').toLowerCase().trim();
  const ariaLabel = (attrs.ariaLabel ?? '').toLowerCase().trim();
  const labelText = (attrs.labelText ?? '').toLowerCase().trim();

  // Autocomplete
  if (ac) {
    const acTokens = ac.split(/\s+/);
    for (const p of PAYMENT_PATTERNS) {
      if (p.autocomplete.some((token) => acTokens.includes(token))) {
        return p.key;
      }
    }
  }

  // Exact ID/Name
  for (const p of PAYMENT_PATTERNS) {
    if (p.exactMatch.test(id) || p.exactMatch.test(name)) {
      return p.key;
    }
  }

  // Keyword heuristic
  const combined = `${labelText} ${placeholder} ${ariaLabel} ${id} ${name}`;
  for (const p of PAYMENT_PATTERNS) {
    if (p.keywordMatch.test(combined)) {
      return p.key;
    }
  }

  return null;
}

export function isPaymentField(attrs: FieldAttributes): boolean {
  return matchPaymentField(attrs) !== null;
}

const CANONICAL_MAPPING: Record<ProfileFieldKey, string[]> = {
  fullName: ['full_name'],
  firstName: ['first_name'],
  lastName: ['last_name'],
  email: ['email'],
  phone: ['phone', 'mobile'],
  altPhone: ['mobile', 'phone'],
  address1: ['address_line1'],
  address2: ['address_line2'],
  city: ['city'],
  state: ['state'],
  postalCode: ['postal_code'],
  country: ['country'],
  website: ['website'],
  title: ['job_title'],
  gender: ['gender'],
};

/**
 * Resolves the profile value for a given field key.
 * Supports both canonical Part B Profile schema (with fields array)
 * and legacy profile shape.
 */
export function resolveProfileValue(
  profile: VaultProfile | LegacyProfile | Record<string, unknown>,
  key: ProfileFieldKey,
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

    if (key === 'fullName') {
      const fn = fields.find((f) => f.key === 'first_name')?.value || '';
      const ln = fields.find((f) => f.key === 'last_name')?.value || '';
      if (fn || ln) return `${fn} ${ln}`.trim();
    }
    if (key === 'firstName') {
      const full = fields.find((f) => f.key === 'full_name')?.value || '';
      if (full) return full.split(/\s+/)[0] || '';
    }
    if (key === 'lastName') {
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
      if (fullName) return fullName;
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      return '';
    case 'firstName':
      if (firstName) return firstName;
      if (fullName) return fullName.split(/\s+/)[0] ?? '';
      return '';
    case 'lastName':
      if (lastName) return lastName;
      if (fullName) {
        const parts = fullName.split(/\s+/);
        return parts.length > 1 ? parts.slice(1).join(' ') : '';
      }
      return '';
    default:
      return typeof legacy[key] === 'string' ? (legacy[key] as string) : '';
  }
}
