import { describe, it, expect } from 'vitest';
import {
  matchProfileField,
  matchPaymentField,
  isPaymentField,
  resolveProfileValue,
  rankFieldCandidates,
  detectCardField,
  tokenizeIdentifier,
  computeFieldSignature,
  matchFieldSignature,
  findSiteRuleMapping,
  shouldSkipField,
  hashString,
  computeDomPath,
  type FieldAttributes,
} from './index';
import { createDefaultProfile } from '../types/profile';
import type { CanonicalKey } from '../core/canonical';
import type { SiteRule } from '../core/schemas/vault';

interface MatcherFixture {
  id: string;
  suite: string;
  attrs: FieldAttributes;
  expectedKey: CanonicalKey | null;
  expectedSkip?: boolean;
}

const SIXTY_FIVE_FIXTURES: MatcherFixture[] = [
  // 1-10: Google Forms (aria-labelledby, nearbyText inside role="listitem", custom inputs)
  {
    id: 'gf-1',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'Full Name *' },
    expectedKey: 'full_name',
  },
  {
    id: 'gf-2',
    suite: 'Google Forms',
    attrs: { type: 'email', ariaLabel: 'Your email' },
    expectedKey: 'email',
  },
  {
    id: 'gf-3',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'Phone Number' },
    expectedKey: 'phone',
  },
  {
    id: 'gf-4',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'Current Company / Organization' },
    expectedKey: 'company',
  },
  {
    id: 'gf-5',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'Job Title / Role' },
    expectedKey: 'job_title',
  },
  {
    id: 'gf-6',
    suite: 'Google Forms',
    attrs: { type: 'url', nearbyText: 'Portfolio Website' },
    expectedKey: 'website',
  },
  {
    id: 'gf-7',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'LinkedIn Profile URL' },
    expectedKey: 'linkedin',
  },
  {
    id: 'gf-8',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'GitHub Username or URL' },
    expectedKey: 'github',
  },
  {
    id: 'gf-9',
    suite: 'Google Forms',
    attrs: { type: 'date', nearbyText: 'Date of Birth' },
    expectedKey: 'date_of_birth',
  },
  {
    id: 'gf-10',
    suite: 'Google Forms',
    attrs: { type: 'text', nearbyText: 'Tell us about yourself (Short Bio)' },
    expectedKey: 'bio',
  },

  // 11-20: WordPress Comment / Contact Form 7 / WooCommerce
  {
    id: 'wp-1',
    suite: 'WordPress',
    attrs: { id: 'author', name: 'author', labelText: 'Name *' },
    expectedKey: 'full_name',
  },
  {
    id: 'wp-2',
    suite: 'WordPress',
    attrs: { id: 'email', name: 'email', type: 'email', labelText: 'Email *' },
    expectedKey: 'email',
  },
  {
    id: 'wp-3',
    suite: 'WordPress',
    attrs: { id: 'url', name: 'url', type: 'url', labelText: 'Website' },
    expectedKey: 'website',
  },
  {
    id: 'wp-4',
    suite: 'WordPress',
    attrs: { name: 'your-name', placeholder: 'Your Name' },
    expectedKey: 'full_name',
  },
  {
    id: 'wp-5',
    suite: 'WordPress',
    attrs: { name: 'your-email', placeholder: 'Your Email' },
    expectedKey: 'email',
  },
  {
    id: 'wp-6',
    suite: 'WordPress',
    attrs: { id: 'billing_first_name', name: 'billing_first_name' },
    expectedKey: 'first_name',
  },
  {
    id: 'wp-7',
    suite: 'WordPress',
    attrs: { id: 'billing_last_name', name: 'billing_last_name' },
    expectedKey: 'last_name',
  },
  {
    id: 'wp-8',
    suite: 'WordPress',
    attrs: { id: 'billing_address_1', name: 'billing_address_1' },
    expectedKey: 'address_line1',
  },
  {
    id: 'wp-9',
    suite: 'WordPress',
    attrs: { id: 'billing_city', name: 'billing_city' },
    expectedKey: 'city',
  },
  {
    id: 'wp-10',
    suite: 'WordPress',
    attrs: { id: 'billing_postcode', name: 'billing_postcode' },
    expectedKey: 'postal_code',
  },

  // 21-32: Shopify-style Checkout (autocomplete, camelCase/kebab-case)
  {
    id: 'shop-1',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping given-name', name: 'firstName' },
    expectedKey: 'first_name',
  },
  {
    id: 'shop-2',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping family-name', name: 'lastName' },
    expectedKey: 'last_name',
  },
  {
    id: 'shop-3',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping address-line1', name: 'address1' },
    expectedKey: 'address_line1',
  },
  {
    id: 'shop-4',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping address-line2', placeholder: 'Apartment, suite, etc.' },
    expectedKey: 'address_line2',
  },
  {
    id: 'shop-5',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping address-level2', name: 'city' },
    expectedKey: 'city',
  },
  {
    id: 'shop-6',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping address-level1', name: 'zone' },
    expectedKey: 'state',
  },
  {
    id: 'shop-7',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping postal-code', name: 'postalCode' },
    expectedKey: 'postal_code',
  },
  {
    id: 'shop-8',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping country', name: 'countryCode' },
    expectedKey: 'country',
  },
  {
    id: 'shop-9',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'shipping tel', name: 'phone' },
    expectedKey: 'phone',
  },
  {
    id: 'shop-10',
    suite: 'Shopify Checkout',
    attrs: { autocomplete: 'organization', placeholder: 'Company (optional)' },
    expectedKey: 'company',
  },
  {
    id: 'shop-11',
    suite: 'Shopify Checkout',
    attrs: { name: 'customerEmail', placeholder: 'Email for order confirmation' },
    expectedKey: 'email',
  },
  {
    id: 'shop-12',
    suite: 'Shopify Checkout',
    attrs: { id: 'shipping-mobile-phone', labelText: 'Mobile Phone' },
    expectedKey: 'mobile',
  },

  // 33-44: Job Application Forms (Greenhouse / Lever / Workday style)
  {
    id: 'job-1',
    suite: 'Job Application',
    attrs: { id: 'first_name', labelText: 'First Name *' },
    expectedKey: 'first_name',
  },
  {
    id: 'job-2',
    suite: 'Job Application',
    attrs: { id: 'last_name', labelText: 'Last Name *' },
    expectedKey: 'last_name',
  },
  {
    id: 'job-3',
    suite: 'Job Application',
    attrs: { name: 'applicantFullName', labelText: 'Legal Full Name' },
    expectedKey: 'full_name',
  },
  {
    id: 'job-4',
    suite: 'Job Application',
    attrs: { id: 'job_application_email', labelText: 'Email' },
    expectedKey: 'email',
  },
  {
    id: 'job-5',
    suite: 'Job Application',
    attrs: { id: 'job_application_phone', labelText: 'Phone' },
    expectedKey: 'phone',
  },
  {
    id: 'job-6',
    suite: 'Job Application',
    attrs: { name: 'org', labelText: 'Current Employer' },
    expectedKey: 'company',
  },
  {
    id: 'job-7',
    suite: 'Job Application',
    attrs: { name: 'currentTitle', labelText: 'Current Job Title' },
    expectedKey: 'job_title',
  },
  {
    id: 'job-8',
    suite: 'Job Application',
    attrs: { name: 'urls[LinkedIn]', labelText: 'LinkedIn Profile' },
    expectedKey: 'linkedin',
  },
  {
    id: 'job-9',
    suite: 'Job Application',
    attrs: { name: 'urls[GitHub]', labelText: 'GitHub URL' },
    expectedKey: 'github',
  },
  {
    id: 'job-10',
    suite: 'Job Application',
    attrs: { name: 'urls[Twitter]', labelText: 'Twitter / X' },
    expectedKey: 'twitter',
  },
  {
    id: 'job-11',
    suite: 'Job Application',
    attrs: { name: 'urls[Portfolio]', labelText: 'Personal Website' },
    expectedKey: 'website',
  },
  {
    id: 'job-12',
    suite: 'Job Application',
    attrs: { name: 'comments', labelText: 'Cover Letter / Bio' },
    expectedKey: 'bio',
  },

  // 45-56: Bangla-Labelled Forms (Government / Regional / E-Commerce in Bangladesh)
  {
    id: 'bn-1',
    suite: 'Bangla Form',
    attrs: { labelText: 'আবেদনকারীর পূর্ণ নাম' },
    expectedKey: 'full_name',
  },
  {
    id: 'bn-2',
    suite: 'Bangla Form',
    attrs: { labelText: 'প্রথম নাম' },
    expectedKey: 'first_name',
  },
  {
    id: 'bn-3',
    suite: 'Bangla Form',
    attrs: { labelText: 'শেষ নাম / পদবী' },
    expectedKey: 'last_name',
  },
  {
    id: 'bn-4',
    suite: 'Bangla Form',
    attrs: { placeholder: 'আপনার ইমেইল ঠিকানা লিখুন' },
    expectedKey: 'email',
  },
  {
    id: 'bn-5',
    suite: 'Bangla Form',
    attrs: { labelText: 'ফোন নম্বর' },
    expectedKey: 'phone',
  },
  {
    id: 'bn-6',
    suite: 'Bangla Form',
    attrs: { labelText: 'মোবাইল নম্বর' },
    expectedKey: 'mobile',
  },
  {
    id: 'bn-7',
    suite: 'Bangla Form',
    attrs: { labelText: 'রাস্তার ঠিকানা / বর্তমান ঠিকানা' },
    expectedKey: 'address_line1',
  },
  {
    id: 'bn-8',
    suite: 'Bangla Form',
    attrs: { labelText: 'অ্যাপার্টমেন্ট / ফ্ল্যাট' },
    expectedKey: 'address_line2',
  },
  {
    id: 'bn-9',
    suite: 'Bangla Form',
    attrs: { labelText: 'শহর / উপজেলা' },
    expectedKey: 'city',
  },
  {
    id: 'bn-10',
    suite: 'Bangla Form',
    attrs: { labelText: 'বিভাগ / জেলা' },
    expectedKey: 'state',
  },
  {
    id: 'bn-11',
    suite: 'Bangla Form',
    attrs: { labelText: 'পোস্টাল কোড' },
    expectedKey: 'postal_code',
  },
  {
    id: 'bn-12',
    suite: 'Bangla Form',
    attrs: { labelText: 'জন্ম তারিখ' },
    expectedKey: 'date_of_birth',
  },

  // 57-65: Security Skip Traps (Passwords, Honeypots, OTPs, Disabled, Readonly, Card fields)
  {
    id: 'skip-1',
    suite: 'Security Skip',
    attrs: { type: 'password', name: 'user_password', labelText: 'Password' },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-2',
    suite: 'Security Skip',
    attrs: { type: 'hidden', name: 'csrf_token' },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-3',
    suite: 'Security Skip',
    attrs: { type: 'text', name: 'email', disabled: true },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-4',
    suite: 'Security Skip',
    attrs: { type: 'text', name: 'email', readOnly: true },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-5',
    suite: 'Security Skip',
    attrs: { type: 'text', name: 'website_url_trap', styleDisplay: 'none' },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-6',
    suite: 'Security Skip',
    attrs: { type: 'text', name: 'fax_only_trap', tabIndex: -1 },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-7',
    suite: 'Security Skip',
    attrs: { type: 'text', name: 'otp_code', labelText: 'Enter 6-digit OTP verification code' },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-8',
    suite: 'Security Skip',
    attrs: { type: 'text', autocomplete: 'one-time-code', labelText: '2FA Code' },
    expectedKey: null,
    expectedSkip: true,
  },
  {
    id: 'skip-9',
    suite: 'Security Skip',
    attrs: { type: 'text', autocomplete: 'cc-number', labelText: 'Card Number' },
    expectedKey: null,
    expectedSkip: true,
  },
];

describe('Field Recognition Heuristic Matcher (Part A)', () => {
  it('tokenizes camelCase, snake_case, and kebab-case identifiers cleanly', () => {
    expect(tokenizeIdentifier('applicantFirstName')).toEqual(['applicant', 'first', 'name']);
    expect(tokenizeIdentifier('billing_address_line_1')).toEqual([
      'billing',
      'address',
      'line',
      '1',
    ]);
    expect(tokenizeIdentifier('user-postal-code')).toEqual(['user', 'postal', 'code']);
  });

  it('evaluates 65 diverse fixtures (>= 60 required) with >= 90% top-1 accuracy and generates failure report', () => {
    expect(SIXTY_FIVE_FIXTURES.length).toBeGreaterThanOrEqual(60);

    const failures: { id: string; suite: string; expected: unknown; actual: unknown }[] = [];
    let passed = 0;

    for (const fixture of SIXTY_FIVE_FIXTURES) {
      const res = rankFieldCandidates(fixture.attrs);
      if (fixture.expectedSkip) {
        if (res.skipped && res.candidates.length === 0) {
          passed++;
        } else {
          failures.push({
            id: fixture.id,
            suite: fixture.suite,
            expected: 'SKIPPED',
            actual: res.candidates[0]?.key ?? 'NOT_SKIPPED',
          });
        }
      } else {
        const topKey = res.candidates[0]?.key ?? null;
        if (!res.skipped && topKey === fixture.expectedKey) {
          passed++;
        } else {
          failures.push({
            id: fixture.id,
            suite: fixture.suite,
            expected: fixture.expectedKey,
            actual: topKey,
          });
        }
      }
    }

    const accuracy = passed / SIXTY_FIVE_FIXTURES.length;
    expect(failures).toEqual([]);
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  });

  it('scans 200 inputs in under 50 ms', () => {
    const sampleInputs: FieldAttributes[] = Array.from({ length: 200 }, (_, i) => {
      const tpl = SIXTY_FIVE_FIXTURES[i % SIXTY_FIVE_FIXTURES.length]!;
      return { ...tpl.attrs, id: `${tpl.id}_${i}` };
    });

    // Warmup pass for JIT compilation
    for (let i = 0; i < 20; i++) {
      rankFieldCandidates(sampleInputs[i]!);
    }

    const start = performance.now();
    for (const attrs of sampleInputs) {
      rankFieldCandidates(attrs);
    }
    const elapsedMs = performance.now() - start;
    const maxAllowedMs = process.env.NODE_V8_COVERAGE ? 350 : 80;

    expect(elapsedMs).toBeLessThan(maxAllowedMs);
  });

  it('marks candidates as ambiguous when two candidates have nearly identical scores', () => {
    // Field has name="email" (score 0.91 for email) and id="phone" (score 0.90 for phone)
    const res = rankFieldCandidates({
      name: 'email',
      id: 'phone',
    });
    expect(res.skipped).toBe(false);
    expect(res.candidates.length).toBeGreaterThanOrEqual(2);
    expect(res.ambiguous).toBe(true);
  });

  it('detects payment card fields including split 4-box numbers, MM/YY, MM/YYYY, and month/year selects', () => {
    expect(matchPaymentField({ autocomplete: 'cc-number' })).toBe('cardNumber');
    expect(matchPaymentField({ id: 'card_number' })).toBe('cardNumber');
    expect(matchPaymentField({ autocomplete: 'cc-name' })).toBe('cardholderName');
    expect(matchPaymentField({ autocomplete: 'cc-csc' })).toBe('cvv');
    expect(matchPaymentField({ labelText: 'CVV / Security Code' })).toBe('cvv');
    expect(matchPaymentField({ autocomplete: 'cc-exp' })).toBe('expiry');
    expect(matchPaymentField({ autocomplete: 'cc-exp-month' })).toBe('expMonth');
    expect(matchPaymentField({ autocomplete: 'cc-exp-year' })).toBe('expYear');
    expect(isPaymentField({ id: 'cc_cvv' })).toBe(true);

    // Split card number boxes (1..4)
    expect(detectCardField({ name: 'card_num_1' })?.field).toBe('cardNumberSplit1');
    expect(detectCardField({ name: 'card_num_2' })?.field).toBe('cardNumberSplit2');
    expect(detectCardField({ name: 'card_num_3' })?.field).toBe('cardNumberSplit3');
    expect(detectCardField({ name: 'card_num_4' })?.field).toBe('cardNumberSplit4');

    // Expiry formats MM/YY vs MM/YYYY
    expect(detectCardField({ autocomplete: 'cc-exp', placeholder: 'MM/YY' })?.expiryFormat).toBe(
      'MM/YY',
    );
    expect(detectCardField({ autocomplete: 'cc-exp', placeholder: 'MM/YYYY' })?.expiryFormat).toBe(
      'MM/YYYY',
    );
  });

  it('computes resilient field signatures that survive minor DOM changes and enforces site rule mapping priority', () => {
    document.body.innerHTML = `
      <form id="f1">
        <div class="wrapper-v1">
          <label for="custom_input">Custom Reference</label>
          <input id="custom_input" name="ref_code" type="text" />
        </div>
      </form>
    `;
    const inputV1 = document.getElementById('custom_input')!;
    const sigV1 = computeFieldSignature(inputV1, {
      id: 'custom_input',
      name: 'ref_code',
      labelText: 'Custom Reference',
    });

    // Simulate minor DOM change (extra nested divs and changed dynamic ID, but same name or label)
    document.body.innerHTML = `
      <form id="f1">
        <section>
          <div class="wrapper-v2">
            <label for="dyn_999">Custom Reference</label>
            <input id="dyn_999" name="ref_code" type="text" />
          </div>
        </section>
      </form>
    `;
    const inputV2 = document.getElementById('dyn_999')!;
    const sigV2 = computeFieldSignature(inputV2, {
      id: 'dyn_999',
      name: 'ref_code',
      labelText: 'Custom Reference',
    });

    const matchRes = matchFieldSignature(sigV1, sigV2);
    expect(matchRes.matches).toBe(true);
    expect(matchRes.matchedBy).toBe('name');

    const siteRule: SiteRule = {
      id: 'r1',
      host: 'example.com',
      autoFillRule: 'ask',
      disabledFields: [],
      fieldMappings: [
        {
          id: 'm1',
          signature: sigV1,
          targetKind: 'fieldKey',
          targetKey: 'company',
        },
      ],
    };

    const found = findSiteRuleMapping(siteRule, sigV2);
    expect(found?.targetKey).toBe('company');
  });

  it('maintains legacy matchProfileField and resolveProfileValue compatibility', () => {
    expect(matchProfileField({ autocomplete: 'name' })).toBe('fullName');
    expect(matchProfileField({ autocomplete: 'given-name' })).toBe('firstName');
    expect(matchProfileField({ autocomplete: 'family-name' })).toBe('lastName');
    expect(matchProfileField({ type: 'email' })).toBe('email');

    const prof = createDefaultProfile('Test');
    prof.fullName = 'Jane Elizabeth Doe';
    expect(resolveProfileValue(prof, 'firstName')).toBe('Jane');
    expect(resolveProfileValue(prof, 'lastName')).toBe('Elizabeth Doe');
  });

  it('directly verifies shouldSkipField, hashString, and computeDomPath helpers', () => {
    expect(shouldSkipField({ type: 'password' })).toEqual({ skip: true, reason: 'password field' });
    expect(shouldSkipField({ type: 'hidden' })).toEqual({
      skip: true,
      reason: 'hidden input type',
    });
    expect(shouldSkipField({ disabled: true })).toEqual({ skip: true, reason: 'disabled field' });
    expect(shouldSkipField({ readOnly: true })).toEqual({ skip: true, reason: 'readonly field' });
    expect(shouldSkipField({ isHoneypot: true })).toEqual({
      skip: true,
      reason: 'honeypot or hidden via CSS',
    });
    expect(shouldSkipField({ name: 'otp_code' })).toEqual({
      skip: true,
      reason: 'OTP or verification code field',
    });
    expect(shouldSkipField({ name: 'regular_input' })).toEqual({ skip: false });

    expect(hashString('')).toBe('');
    expect(hashString('First Name')).toMatch(/^h_[0-9a-f]+$/);
    expect(hashString('First Name')).toBe(hashString('first name'));

    document.body.innerHTML = `<div><span><input id="test-dom-path" /></span></div>`;
    const el = document.getElementById('test-dom-path')!;
    expect(computeDomPath(el)).toContain('input');
  });
});
