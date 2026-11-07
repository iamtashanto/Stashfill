import { z } from 'zod';

export const CANONICAL_KEYS = [
  'first_name',
  'last_name',
  'full_name',
  'email',
  'phone',
  'mobile',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
  'company',
  'job_title',
  'website',
  'linkedin',
  'github',
  'twitter',
  'date_of_birth',
  'username',
  'bio',
] as const;

export type CanonicalKey = (typeof CANONICAL_KEYS)[number];

export const CanonicalKeySchema = z.enum(CANONICAL_KEYS);

/**
 * Validates either a canonical key or an extensible custom key.
 */
export const FieldKeySchema = z.string().refine(
  (val) => {
    return CANONICAL_KEYS.includes(val as CanonicalKey) || val.startsWith('custom') || val.length > 0;
  },
  { message: 'Invalid field key' },
);

export type FieldKey = CanonicalKey | string;
