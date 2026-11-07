import { describe, it, expect } from 'vitest';
import {
  matchProfileField,
  matchPaymentField,
  isPaymentField,
  resolveProfileValue,
} from './matcher';
import { createDefaultProfile } from '../types/profile';

describe('Field Recognition Heuristic Matcher', () => {
  it('matches fields via HTML5 autocomplete attribute', () => {
    expect(matchProfileField({ autocomplete: 'name' })).toBe('fullName');
    expect(matchProfileField({ autocomplete: 'given-name' })).toBe('firstName');
    expect(matchProfileField({ autocomplete: 'family-name' })).toBe('lastName');
    expect(matchProfileField({ autocomplete: 'email' })).toBe('email');
    expect(matchProfileField({ autocomplete: 'tel' })).toBe('phone');
    expect(matchProfileField({ autocomplete: 'street-address' })).toBe('address1');
    expect(matchProfileField({ autocomplete: 'address-line2' })).toBe('address2');
    expect(matchProfileField({ autocomplete: 'address-level2' })).toBe('city');
    expect(matchProfileField({ autocomplete: 'address-level1' })).toBe('state');
    expect(matchProfileField({ autocomplete: 'postal-code' })).toBe('postalCode');
    expect(matchProfileField({ autocomplete: 'country' })).toBe('country');
  });

  it('matches fields via standard input types', () => {
    expect(matchProfileField({ type: 'email' })).toBe('email');
    expect(matchProfileField({ type: 'tel' })).toBe('phone');
    expect(matchProfileField({ type: 'url' })).toBe('website');
  });

  it('matches fields via name or id patterns', () => {
    expect(matchProfileField({ id: 'user_first_name' })).toBe('firstName');
    expect(matchProfileField({ name: 'billing_address_1' })).toBe('address1');
    expect(matchProfileField({ id: 'zip_code' })).toBe('postalCode');
    expect(matchProfileField({ name: 'company_phone' })).toBe('phone');
  });

  it('matches fields via English label / placeholder text', () => {
    expect(matchProfileField({ placeholder: 'Enter your full name' })).toBe('fullName');
    expect(matchProfileField({ labelText: 'Street Address or P.O. Box' })).toBe('address1');
    expect(matchProfileField({ ariaLabel: 'Your primary telephone number' })).toBe('phone');
    expect(matchProfileField({ labelText: 'City / Municipality' })).toBe('city');
  });

  it('matches fields via Bangla label and placeholder text', () => {
    expect(matchProfileField({ labelText: 'আপনার পূর্ণ নাম লিখুন' })).toBe('fullName');
    expect(matchProfileField({ labelText: 'প্রথম নাম' })).toBe('firstName');
    expect(matchProfileField({ labelText: 'শেষ নাম' })).toBe('lastName');
    expect(matchProfileField({ placeholder: 'আপনার ইমেইল ঠিকানা' })).toBe('email');
    expect(matchProfileField({ labelText: 'মুঠোফোন / মোবাইল নম্বর' })).toBe('phone');
    expect(matchProfileField({ labelText: 'রাস্তার ঠিকানা' })).toBe('address1');
    expect(matchProfileField({ labelText: 'শহর' })).toBe('city');
    expect(matchProfileField({ labelText: 'পোস্টাল কোড' })).toBe('postalCode');
    expect(matchProfileField({ labelText: 'দেশ' })).toBe('country');
  });

  it('never matches passwords for autofill', () => {
    expect(matchProfileField({ type: 'password', name: 'password' })).toBeNull();
    expect(matchProfileField({ type: 'password', autocomplete: 'current-password' })).toBeNull();
  });

  it('never matches payment card fields in profile auto-matcher', () => {
    // Payment card fields must be strictly protected from passive auto-match
    expect(matchProfileField({ autocomplete: 'cc-number' })).toBeNull();
    expect(matchProfileField({ id: 'card_number', labelText: 'Credit Card Number' })).toBeNull();
    expect(matchProfileField({ autocomplete: 'cc-csc' })).toBeNull();
  });

  it('detects payment card fields accurately in dedicated payment matcher', () => {
    expect(matchPaymentField({ autocomplete: 'cc-number' })).toBe('cardNumber');
    expect(matchPaymentField({ id: 'card_number' })).toBe('cardNumber');
    expect(matchPaymentField({ autocomplete: 'cc-name' })).toBe('cardholderName');
    expect(matchPaymentField({ autocomplete: 'cc-csc' })).toBe('cvv');
    expect(matchPaymentField({ labelText: 'CVV / Security Code' })).toBe('cvv');
    expect(matchPaymentField({ autocomplete: 'cc-exp' })).toBe('expiry');
    expect(matchPaymentField({ autocomplete: 'cc-exp-month' })).toBe('expMonth');
    expect(matchPaymentField({ autocomplete: 'cc-exp-year' })).toBe('expYear');
    expect(isPaymentField({ id: 'cc_cvv' })).toBe(true);
  });

  it('resolves derived profile values properly', () => {
    const prof = createDefaultProfile('Test');
    prof.fullName = 'Jane Elizabeth Doe';
    expect(resolveProfileValue(prof, 'firstName')).toBe('Jane');
    expect(resolveProfileValue(prof, 'lastName')).toBe('Elizabeth Doe');

    const prof2 = createDefaultProfile('Test 2');
    prof2.firstName = 'John';
    prof2.lastName = 'Smith';
    expect(resolveProfileValue(prof2, 'fullName')).toBe('John Smith');
  });
});
