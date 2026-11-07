export type CardBrand =
  | 'visa'
  | 'mastercard'
  | 'amex'
  | 'discover'
  | 'jcb'
  | 'diners'
  | 'unionpay'
  | 'other';

/**
 * Validates a card number using the Luhn checksum formula (Mod 10).
 */
export function validateLuhn(cardNumber: string): boolean {
  const clean = cardNumber.replace(/\D/g, '');
  if (!clean || clean.length < 12 || clean.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Detects card brand from standard IIN/BIN number prefixes.
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  const clean = cardNumber.replace(/\D/g, '');

  if (/^4/.test(clean)) {
    return 'visa';
  }
  if (/^(5[1-5]|2[2-7])/.test(clean)) {
    return 'mastercard';
  }
  if (/^3[47]/.test(clean)) {
    return 'amex';
  }
  if (/^(6011|65|64[4-9]|622)/.test(clean)) {
    return 'discover';
  }
  if (/^35(2[89]|[3-8][0-9])/.test(clean)) {
    return 'jcb';
  }
  if (/^(30[0-5]|36|38)/.test(clean)) {
    return 'diners';
  }
  if (/^62/.test(clean)) {
    return 'unionpay';
  }

  return 'other';
}

/**
 * Masks a card number to expose only the last 4 digits for secure UI display.
 * E.g., "4111222233334444" -> "•••• •••• •••• 4444"
 */
export function maskCardNumber(cardNumber: string): string {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) {
    return '••••';
  }
  const last4 = clean.slice(-4);
  if (clean.length === 15) {
    // Amex 4-6-5 layout
    return `•••• •••••• •${last4}`;
  }
  return `•••• •••• •••• ${last4}`;
}
