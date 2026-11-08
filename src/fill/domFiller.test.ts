import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractFieldAttributes,
  collectFillableElements,
  fillElement,
  fillFormWithProfile,
  fillPaymentCard,
  undoLastFill,
  expandSnippetVariables,
  findMatchingSnippetTrigger,
  isElementHiddenOrHoneypot,
  isFillable,
  isElementNonEmpty,
  normalizeDateValue,
  setNativeInputValue,
  highlightFilledElement,
  hasCrossOriginPaymentIframe,
  copyCardNumberWithAutoClear,
} from './index';
import { buildContextMenuDescriptors } from '../background/contextMenu';
import { createDefaultProfile } from '../types/profile';
import { createPersonalTemplate } from '../core/templates';
import { DEFAULT_SETTINGS, type SiteRule } from '../core/schemas/vault';
import type { PaymentCard } from '../types/vault';

describe('DOM Filler Engine, Card Rules, Snippets, and Context Menu Triggers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts field attributes from various label structures including nearby text', () => {
    document.body.innerHTML = `
      <label for="user-email">Email Address</label>
      <input type="text" id="user-email" name="email_field" placeholder="you@domain.com" autocomplete="email" />
    `;
    const input = document.getElementById('user-email') as HTMLInputElement;
    const attrs = extractFieldAttributes(input);

    expect(attrs.id).toBe('user-email');
    expect(attrs.name).toBe('email_field');
    expect(attrs.placeholder).toBe('you@domain.com');
    expect(attrs.autocomplete).toBe('email');
    expect(attrs.labelText).toBe('Email Address');
  });

  it('extracts label from enclosing parent label and aria-labelledby', () => {
    document.body.innerHTML = `
      <label>
        Mobile Phone
        <input type="tel" id="user-tel" />
      </label>
      <span id="custom-lbl">Postal Index</span>
      <input type="text" id="zip" aria-labelledby="custom-lbl" />
    `;

    const tel = document.getElementById('user-tel') as HTMLInputElement;
    const zip = document.getElementById('zip') as HTMLInputElement;

    expect(extractFieldAttributes(tel).labelText).toContain('Mobile Phone');
    expect(extractFieldAttributes(zip).labelText).toBe('Postal Index');
  });

  it('fills standard inputs and dispatches input, change, and blur events', () => {
    document.body.innerHTML = `<input type="text" id="name-input" />`;
    const input = document.getElementById('name-input') as HTMLInputElement;

    let inputFired = false;
    let changeFired = false;
    let blurFired = false;
    input.addEventListener('input', () => {
      inputFired = true;
    });
    input.addEventListener('change', () => {
      changeFired = true;
    });
    input.addEventListener('blur', () => {
      blurFired = true;
    });

    const success = fillElement(input, 'Ada Lovelace');
    expect(success).toBe(true);
    expect(input.value).toBe('Ada Lovelace');
    expect(inputFired).toBe(true);
    expect(changeFired).toBe(true);
    expect(blurFired).toBe(true);
  });

  it('updates React _valueTracker when filling controlled inputs', () => {
    document.body.innerHTML = `<input type="text" id="react-input" />`;
    const input = document.getElementById('react-input') as HTMLInputElement;

    let trackerCalled = false;
    (input as unknown as { _valueTracker: { setValue: (v: string) => void } })._valueTracker = {
      setValue: () => {
        trackerCalled = true;
      },
    };

    fillElement(input, 'Grace Hopper');
    expect(input.value).toBe('Grace Hopper');
    expect(trackerCalled).toBe(true);
  });

  it('fills select dropdowns by option text, value, or country name/ISO code', () => {
    document.body.innerHTML = `
      <select id="country-select">
        <option value="">Select country...</option>
        <option value="US">United States</option>
        <option value="BD">Bangladesh</option>
        <option value="GB">United Kingdom</option>
      </select>
    `;
    const select = document.getElementById('country-select') as HTMLSelectElement;

    // Match by full country name
    expect(fillElement(select, 'Bangladesh')).toBe(true);
    expect(select.value).toBe('BD');

    // Match by alias ("UK" -> "GB")
    expect(fillElement(select, 'UK')).toBe(true);
    expect(select.value).toBe('GB');

    // Match by ISO code ("US")
    expect(fillElement(select, 'US')).toBe(true);
    expect(select.value).toBe('US');
  });

  it('fills date inputs by converting DD/MM/YYYY or MM/DD/YYYY to YYYY-MM-DD', () => {
    document.body.innerHTML = `<input type="date" id="dob" />`;
    const dateInput = document.getElementById('dob') as HTMLInputElement;

    fillElement(dateInput, '25/12/1995');
    expect(dateInput.value).toBe('1995-12-25');
  });

  it('supports Fill Empty Only mode and Undo Last Fill', () => {
    document.body.innerHTML = `
      <form>
        <input type="text" id="fname" name="first_name" value="ExistingName" />
        <input type="email" id="email" name="email" value="" />
      </form>
    `;
    const fname = document.getElementById('fname') as HTMLInputElement;
    const email = document.getElementById('email') as HTMLInputElement;

    const profile = createDefaultProfile();
    profile.firstName = 'NewName';
    profile.email = 'new@example.com';

    // Mode: emptyOnly -> must NOT overwrite fname
    const res = fillFormWithProfile(document, profile, { mode: 'emptyOnly' });
    expect(res.filledCount).toBe(1);
    expect(fname.value).toBe('ExistingName');
    expect(email.value).toBe('new@example.com');

    // Undo last fill -> restores email to ''
    const restoredCount = undoLastFill();
    expect(restoredCount).toBe(1);
    expect(email.value).toBe('');
  });

  it('prioritizes SiteRule fieldMappings over the automatic heuristic matcher', () => {
    document.body.innerHTML = `
      <form>
        <label for="ambiguous_box">Your Email</label>
        <input type="text" id="ambiguous_box" name="custom_override" />
      </form>
    `;

    const profile = createPersonalTemplate('Work');
    const companyField = profile.fields.find((f) => f.key === 'email')!;
    companyField.value = 'mapped-override@company.org';

    const rule: SiteRule = {
      id: 'rule_1',
      host: 'example.com',
      autoFillRule: 'ask',
      disabledFields: [],
      fieldMappings: [
        {
          id: 'm1',
          signature: { name: 'custom_override' },
          targetKind: 'fieldKey',
          targetKey: 'email',
        },
      ],
    };

    const res = fillFormWithProfile(document, profile, { siteRule: rule });
    expect(res.filledCount).toBe(1);
    expect((document.getElementById('ambiguous_box') as HTMLInputElement).value).toBe(
      'mapped-override@company.org',
    );
  });

  it('traverses and fills elements inside Shadow DOM and same-origin iframes while skipping hidden honeypots', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const innerInput = document.createElement('input');
    innerInput.setAttribute('autocomplete', 'email');
    shadow.appendChild(innerInput);

    // Hidden honeypot input
    const honeypot = document.createElement('input');
    honeypot.setAttribute('name', 'first_name');
    honeypot.style.display = 'none';
    document.body.appendChild(honeypot);

    const fillables = collectFillableElements(document);
    expect(fillables).toContain(innerInput);
    expect(fillables).not.toContain(honeypot);

    const prof = createDefaultProfile();
    prof.email = 'shadow@example.com';
    prof.firstName = 'ShouldNotFillHoneypot';

    const res = fillFormWithProfile(document, prof);
    expect(res.filledCount).toBe(1);
    expect(innerInput.value).toBe('shadow@example.com');
    expect(honeypot.value).toBe('');
  });

  it('strictly enforces Card Fill Rules: never filled by Fill All, blocked on HTTP, blocked without confirmation, supports split 4-box & expiry formats, and omits CVV if not stored', () => {
    document.body.innerHTML = `
      <form id="payment-form">
        <input type="text" id="cc-name" autocomplete="cc-name" />
        <input type="text" id="cc-1" name="card_num_1" maxlength="4" />
        <input type="text" id="cc-2" name="card_num_2" maxlength="4" />
        <input type="text" id="cc-3" name="card_num_3" maxlength="4" />
        <input type="text" id="cc-4" name="card_num_4" maxlength="4" />
        <input type="text" id="cc-exp" autocomplete="cc-exp" placeholder="MM/YYYY" />
        <input type="text" id="cc-cvv" autocomplete="cc-csc" />
      </form>
    `;

    const cardWithoutCvv: PaymentCard = {
      id: 'card_123',
      nickname: 'Secure Visa',
      cardholderName: 'Alan Turing',
      cardNumber: '4532015112830366',
      expMonth: '09',
      expYear: '28',
      brand: 'visa',
      createdAt: Date.now(),
    };

    // 1. Blocked on insecure HTTP and non-HTTPS schemes
    const httpRes = fillPaymentCard(document, cardWithoutCvv, {
      protocol: 'http:',
      confirmed: true,
    });
    expect(httpRes.filledCount).toBe(0);
    expect(httpRes.blockedReason).toBe('insecure_http');
    expect((document.getElementById('cc-1') as HTMLInputElement).value).toBe('');

    const fileRes = fillPaymentCard(document, cardWithoutCvv, {
      protocol: 'file:',
      confirmed: true,
    });
    expect(fileRes.filledCount).toBe(0);
    expect(fileRes.blockedReason).toBe('insecure_http');

    // 2. Blocked when confirmed is false or omitted
    const unconfirmedRes = fillPaymentCard(document, cardWithoutCvv, {
      protocol: 'https:',
      confirmed: false,
    });
    expect(unconfirmedRes.filledCount).toBe(0);
    expect(unconfirmedRes.blockedReason).toBe('unconfirmed');

    const omittedConfirmRes = fillPaymentCard(document, cardWithoutCvv, {
      protocol: 'https:',
    });
    expect(omittedConfirmRes.filledCount).toBe(0);
    expect(omittedConfirmRes.blockedReason).toBe('unconfirmed');

    // 3. Allowed on HTTPS with confirmation: fills 4 split boxes + MM/YYYY expiry + cardholder, leaves CVV empty
    const httpsRes = fillPaymentCard(document, cardWithoutCvv, {
      protocol: 'https:',
      confirmed: true,
    });
    expect(httpsRes.filledCount).toBe(6);
    expect((document.getElementById('cc-name') as HTMLInputElement).value).toBe('Alan Turing');
    expect((document.getElementById('cc-1') as HTMLInputElement).value).toBe('4532');
    expect((document.getElementById('cc-2') as HTMLInputElement).value).toBe('0151');
    expect((document.getElementById('cc-3') as HTMLInputElement).value).toBe('1283');
    expect((document.getElementById('cc-4') as HTMLInputElement).value).toBe('0366');
    expect((document.getElementById('cc-exp') as HTMLInputElement).value).toBe('09/2028');
    expect((document.getElementById('cc-cvv') as HTMLInputElement).value).toBe('');
  });

  it('expands text snippet variables ({{date}}, {{time}}, {{datetime}}, {{cursor}}) and detects triggers', () => {
    const fixedDate = new Date('2026-11-07T09:30:00.000Z');
    const expanded = expandSnippetVariables('Signed on {{date}} at {{cursor}}end', fixedDate);
    expect(expanded.text).toBe('Signed on 2026-11-07 at end');
    expect(expanded.cursorOffset).toBe('Signed on 2026-11-07 at '.length);

    const snippets = [{ id: 's1', trigger: ';email', content: 'ada@lovelace.org', folder: 'work' }];
    const match = findMatchingSnippetTrigger('Contact me at ;email', snippets, ';');
    expect(match?.snippet.id).toBe('s1');
    expect(match?.matchedTrigger).toBe(';email');
  });

  it('builds context menu items respecting 12-field limit, sensitive preview suppression, vault lock state, and HTTPS card rules', () => {
    const prof = createPersonalTemplate('Personal');
    prof.fields = Array.from({ length: 15 }, (_, i) => ({
      id: `f_${i}`,
      label: `Field ${i + 1}`,
      key: `custom_${i}`,
      value: `SecretVal_${i + 1}`,
      type: 'text' as const,
      category: 'personal',
      tags: [],
      sensitive: i === 0, // First field is sensitive
      createdAt: 1000,
      updatedAt: 1000,
      useCount: 20 - i,
      lastUsedAt: 1000,
    }));

    const sampleCard: PaymentCard = {
      id: 'c1',
      nickname: 'Main Visa',
      cardholderName: 'Ada',
      cardNumber: '4532015112830366',
      expMonth: '08',
      expYear: '29',
      brand: 'visa',
      createdAt: 1000,
    };

    // 1. Locked vault -> shows Unlock Stashfill, no card entries
    const lockedMenu = buildContextMenuDescriptors({
      profiles: [prof],
      settings: { ...DEFAULT_SETTINGS, showMenuValuePreviews: true },
      vaultInitialized: true,
      vaultUnlocked: false,
      cards: [sampleCard],
      isHttpsPage: true,
    });
    expect(lockedMenu.some((m) => m.id === 'stashfill-unlock-vault')).toBe(true);
    expect(lockedMenu.some((m) => m.id.startsWith('stashfill-card:'))).toBe(false);

    // Sensitive field (f_0) NEVER shows value preview even when showMenuValuePreviews is true
    const f0Item = lockedMenu.find(
      (m) => m.id === 'stashfill-field:prof_personal:f_0' || m.id.endsWith(':f_0'),
    );
    expect(f0Item?.title).toBe('Field 1');
    // Non-sensitive field (f_1) shows preview when enabled
    const f1Item = lockedMenu.find((m) => m.id.endsWith(':f_1'));
    expect(f1Item?.title).toContain('SecretVal_2');

    // Only 12 fields listed + More... fallback
    const fieldItems = lockedMenu.filter((m) => m.id.startsWith('stashfill-field:'));
    expect(fieldItems.length).toBe(12);
    expect(lockedMenu.some((m) => m.id.startsWith('stashfill-more-profile:'))).toBe(true);

    // 2. Unlocked vault on HTTP page -> no card entries
    const httpMenu = buildContextMenuDescriptors({
      profiles: [prof],
      settings: DEFAULT_SETTINGS,
      vaultInitialized: true,
      vaultUnlocked: true,
      cards: [sampleCard],
      isHttpsPage: false,
    });
    expect(httpMenu.some((m) => m.id.startsWith('stashfill-card:'))).toBe(false);

    // 3. Unlocked vault on HTTPS page -> shows Fill card entry with brand and last 4 digits
    const httpsMenu = buildContextMenuDescriptors({
      profiles: [prof],
      settings: DEFAULT_SETTINGS,
      vaultInitialized: true,
      vaultUnlocked: true,
      cards: [sampleCard],
      isHttpsPage: true,
    });
    const cardEntry = httpsMenu.find((m) => m.id === 'stashfill-card:c1');
    expect(cardEntry).toBeDefined();
    expect(cardEntry?.title).toBe('Fill card: VISA •••• 0366');

    // 4. Multiple profiles -> default profile directly listed, other profiles as submenus
    const workProf: Profile = {
      id: 'prof_work',
      name: 'Work',
      fields: [
        {
          id: 'f_w1',
          label: 'Work Email',
          key: 'work_email',
          value: 'ada@work.com',
          type: 'email',
          category: 'work',
          tags: [],
          sensitive: false,
          createdAt: 1000,
          updatedAt: 1000,
          useCount: 10,
          lastUsedAt: 1000,
        },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    };
    const multiProfileMenu = buildContextMenuDescriptors({
      profiles: [prof, workProf],
      settings: DEFAULT_SETTINGS,
      vaultInitialized: true,
      vaultUnlocked: true,
      cards: [],
      isHttpsPage: true,
      activeProfileId: prof.id,
    });

    // Default profile fields are direct children of stashfill-root
    const defaultFields = multiProfileMenu.filter(
      (m) => m.parentId === 'stashfill-root' && m.id.startsWith(`stashfill-field:${prof.id}:`),
    );
    expect(defaultFields.length).toBeGreaterThan(0);

    // Work profile has its own submenu under stashfill-root
    const workSubmenu = multiProfileMenu.find((m) => m.id === 'stashfill-profile-sub:prof_work');
    expect(workSubmenu).toBeDefined();
    expect(workSubmenu?.title).toBe('Work');
    expect(workSubmenu?.parentId).toBe('stashfill-root');

    // Inside Work submenu: fill form action, work email field, and switch profile action
    const workFill = multiProfileMenu.find((m) => m.id === 'stashfill-fill-profile:prof_work');
    expect(workFill?.parentId).toBe('stashfill-profile-sub:prof_work');
    expect(workFill?.title).toBe('Fill this form (Work)');

    const workEmailField = multiProfileMenu.find((m) => m.id === 'stashfill-field:prof_work:f_w1');
    expect(workEmailField?.parentId).toBe('stashfill-profile-sub:prof_work');
    expect(workEmailField?.title).toBe('Work Email');

    const workSwitch = multiProfileMenu.find((m) => m.id === 'stashfill-switch-profile:prof_work');
    expect(workSwitch?.parentId).toBe('stashfill-profile-sub:prof_work');
    expect(workSwitch?.title).toBe('Switch active to Work');
  });

  it('directly tests helper functions: isElementHiddenOrHoneypot, isFillable, isElementNonEmpty, normalizeDateValue, setNativeInputValue, highlightFilledElement, hasCrossOriginPaymentIframe, copyCardNumberWithAutoClear', async () => {
    document.body.innerHTML = `
      <input type="text" id="visible_input" value="" />
      <input type="text" id="non_empty_input" value="hello" />
      <input type="hidden" id="hidden_input" />
      <div style="display:none"><input type="text" id="display_none_input" /></div>
    `;

    const visible = document.getElementById('visible_input') as HTMLInputElement;
    const nonEmpty = document.getElementById('non_empty_input') as HTMLInputElement;
    const hidden = document.getElementById('hidden_input') as HTMLInputElement;
    const displayNone = document.getElementById('display_none_input') as HTMLInputElement;

    expect(isElementHiddenOrHoneypot(visible)).toBe(false);
    expect(isElementHiddenOrHoneypot(hidden)).toBe(true);
    expect(isElementHiddenOrHoneypot(displayNone)).toBe(true);

    expect(isFillable(visible)).toBe(true);
    expect(isFillable(hidden)).toBe(false);

    expect(isElementNonEmpty(visible)).toBe(false);
    expect(isElementNonEmpty(nonEmpty)).toBe(true);

    expect(normalizeDateValue('1990-05-15')).toBe('1990-05-15');
    expect(normalizeDateValue('15/05/1990')).toBe('1990-05-15');
    expect(normalizeDateValue('05/15/1990')).toBe('1990-05-15');

    setNativeInputValue(visible, 'direct-val');
    expect(visible.value).toBe('direct-val');

    highlightFilledElement(visible);
    expect(visible.style.outline).toContain('10b981');

    const mockRoot = {
      querySelectorAll: () => [
        {
          getAttribute: (k: string) => (k === 'src' ? 'https://js.stripe.com/v3' : ''),
          contentDocument: null,
        },
      ],
    } as unknown as Element;
    expect(hasCrossOriginPaymentIframe(mockRoot)).toBe(true);

    // Test copyCardNumberWithAutoClear mock
    let clipboardText = '';
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async (t: string) => {
          clipboardText = t;
        },
      },
      configurable: true,
      writable: true,
    });
    await copyCardNumberWithAutoClear('4111222233334444', 1);
    expect(clipboardText).toBe('4111222233334444');
  });
});
