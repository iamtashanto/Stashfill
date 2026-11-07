import { z } from 'zod';

export const PaymentCardSchema = z.object({
  id: z.string(),
  nickname: z.string().min(1),
  cardholderName: z.string(),
  cardNumber: z.string().min(12).max(19),
  expMonth: z.string().regex(/^(0[1-9]|1[0-2])$/),
  expYear: z.string().regex(/^\d{2}(\d{2})?$/),
  cvv: z.string().min(3).max(4),
  brand: z.enum(['visa', 'mastercard', 'amex', 'discover', 'other']).default('other'),
  createdAt: z.number(),
});

export type PaymentCard = z.infer<typeof PaymentCardSchema>;

export interface EncryptedPayload {
  version: 1;
  ciphertext: string; // Base64
  iv: string; // Base64 (12 bytes for AES-GCM)
  salt: string; // Base64 (16 bytes for PBKDF2)
  iterations: number; // e.g. 250,000
}

export const EncryptedPayloadSchema = z.object({
  version: z.literal(1),
  ciphertext: z.string(),
  iv: z.string(),
  salt: z.string(),
  iterations: z.number().int().min(10000),
});

export const VaultContentSchema = z.object({
  cards: z.array(PaymentCardSchema).default([]),
  notes: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        createdAt: z.number(),
      }),
    )
    .default([]),
});

export type VaultContent = z.infer<typeof VaultContentSchema>;

/**
 * Mask card number for UI display (e.g., •••• •••• •••• 1234).
 * Never exposes the full card number except when explicitly requested by user.
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) return '••••';
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

export function detectCardBrand(
  cardNumber: string,
): 'visa' | 'mastercard' | 'amex' | 'discover' | 'other' {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^6(011|5)/.test(clean)) return 'discover';
  return 'other';
}
