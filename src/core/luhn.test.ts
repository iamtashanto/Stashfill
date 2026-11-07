import { describe, it, expect } from 'vitest';
import { validateLuhn, detectCardBrand, maskCardNumber } from './luhn';

describe('Luhn Check, Brand Detection & Card Masking', () => {
  describe('validateLuhn', () => {
    it('validates standard valid credit card numbers', () => {
      // Known valid test card numbers (standard test vectors)
      expect(validateLuhn('4532015112830366')).toBe(true); // Visa
      expect(validateLuhn('5425233430109903')).toBe(true); // Mastercard
      expect(validateLuhn('378282246310005')).toBe(true); // Amex
      expect(validateLuhn('6011111111111117')).toBe(true); // Discover
      expect(validateLuhn('3530111333300000')).toBe(true); // JCB
      expect(validateLuhn('30569309025904')).toBe(true); // Diners
    });

    it('rejects numbers that fail the Luhn checksum', () => {
      expect(validateLuhn('4532015112830367')).toBe(false);
      expect(validateLuhn('5425233430109904')).toBe(false);
      expect(validateLuhn('378282246310006')).toBe(false);
    });

    it('rejects empty, short, or invalid strings', () => {
      expect(validateLuhn('')).toBe(false);
      expect(validateLuhn('12345')).toBe(false);
      expect(validateLuhn('not-a-number')).toBe(false);
    });

    it('handles formatted numbers with spaces and dashes', () => {
      expect(validateLuhn('4532 0151 1283 0366')).toBe(true);
      expect(validateLuhn('4532-0151-1283-0366')).toBe(true);
    });
  });

  describe('detectCardBrand', () => {
    it('detects Visa from prefix 4', () => {
      expect(detectCardBrand('4532015112830366')).toBe('visa');
    });

    it('detects Mastercard from prefixes 51-55 and 22-27', () => {
      expect(detectCardBrand('5100000000000000')).toBe('mastercard');
      expect(detectCardBrand('5500000000000000')).toBe('mastercard');
      expect(detectCardBrand('2221000000000000')).toBe('mastercard');
    });

    it('detects Amex from prefixes 34 and 37', () => {
      expect(detectCardBrand('340000000000000')).toBe('amex');
      expect(detectCardBrand('378282246310005')).toBe('amex');
    });

    it('detects Discover from prefixes 6011, 65, 644-649, 622', () => {
      expect(detectCardBrand('6011000000000000')).toBe('discover');
      expect(detectCardBrand('6500000000000000')).toBe('discover');
      expect(detectCardBrand('6450000000000000')).toBe('discover');
    });

    it('detects JCB from prefix 35', () => {
      expect(detectCardBrand('3528000000000000')).toBe('jcb');
      expect(detectCardBrand('3589000000000000')).toBe('jcb');
    });

    it('detects Diners Club from prefixes 300-305, 36, 38', () => {
      expect(detectCardBrand('30100000000000')).toBe('diners');
      expect(detectCardBrand('36000000000000')).toBe('diners');
    });

    it('detects UnionPay from prefix 62', () => {
      expect(detectCardBrand('6200000000000000')).toBe('unionpay');
    });

    it('falls back to other for unknown prefixes', () => {
      expect(detectCardBrand('9999000000000000')).toBe('other');
    });
  });

  describe('maskCardNumber', () => {
    it('masks standard 16 digit cards leaving only last 4 digits', () => {
      expect(maskCardNumber('4532015112830366')).toBe('•••• •••• •••• 0366');
    });

    it('masks 15 digit Amex cards formatted properly', () => {
      expect(maskCardNumber('378282246310005')).toBe('•••• •••••• •0005');
    });

    it('returns placeholder for short strings', () => {
      expect(maskCardNumber('12')).toBe('••••');
    });
  });
});

