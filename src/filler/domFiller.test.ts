import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractFieldAttributes,
  collectFillableElements,
  fillElement,
  fillFormWithProfile,
  fillPaymentCard,
} from './domFiller';
import { createDefaultProfile } from '../types/profile';
import type { PaymentCard } from '../types/vault';

describe('DOM Filler Engine', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts field attributes from various label structures', () => {
    // 1. Label with for attribute
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
    // Enclosing label
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

  it('fills standard inputs and dispatches input and change events', () => {
    document.body.innerHTML = `<input type="text" id="name-input" />`;
    const input = document.getElementById('name-input') as HTMLInputElement;

    let inputFired = false;
    let changeFired = false;
    input.addEventListener('input', () => {
      inputFired = true;
    });
    input.addEventListener('change', () => {
      changeFired = true;
    });

    const success = fillElement(input, 'Ada Lovelace');
    expect(success).toBe(true);
    expect(input.value).toBe('Ada Lovelace');
    expect(inputFired).toBe(true);
    expect(changeFired).toBe(true);
  });

  it('updates React _valueTracker when filling controlled inputs', () => {
    document.body.innerHTML = `<input type="text" id="react-input" />`;
    const input = document.getElementById('react-input') as HTMLInputElement;

    let trackerVal = '';
    (input as unknown as { _valueTracker: { setValue: (v: string) => void } })._valueTracker = {
      setValue: (v: string) => {
        trackerVal = v;
      },
    };

    fillElement(input, 'Grace Hopper');
    expect(input.value).toBe('Grace Hopper');
    expect(trackerVal).toBe('Grace Hopper');
  });

  it('fills select dropdowns by matching option text or value', () => {
    document.body.innerHTML = `
      <select id="country-select">
        <option value="">Select country...</option>
        <option value="US">United States</option>
        <option value="BD">Bangladesh</option>
        <option value="CA">Canada</option>
      </select>
    `;
    const select = document.getElementById('country-select') as HTMLSelectElement;

    let changeFired = false;
    select.addEventListener('change', () => {
      changeFired = true;
    });

    // Fill by text
    const s1 = fillElement(select, 'Bangladesh');
    expect(s1).toBe(true);
    expect(select.value).toBe('BD');
    expect(changeFired).toBe(true);

    // Fill by value
    const s2 = fillElement(select, 'CA');
    expect(s2).toBe(true);
    expect(select.value).toBe('CA');
  });

  it('fills checkboxes and radio buttons', () => {
    document.body.innerHTML = `
      <input type="checkbox" id="terms" value="accepted" />
      <input type="radio" name="gender" id="g-male" value="male" />
      <input type="radio" name="gender" id="g-female" value="female" />
    `;
    const checkbox = document.getElementById('terms') as HTMLInputElement;
    const radioFemale = document.getElementById('g-female') as HTMLInputElement;

    fillElement(checkbox, 'true');
    expect(checkbox.checked).toBe(true);

    fillElement(radioFemale, 'female');
    expect(radioFemale.checked).toBe(true);
  });

  it('fills contenteditable elements', () => {
    document.body.innerHTML = `<div id="editor" contenteditable="true"></div>`;
    const editor = document.getElementById('editor') as HTMLElement;

    const success = fillElement(editor, 'Some formatted rich text snippet');
    expect(success).toBe(true);
    expect(editor.textContent).toBe('Some formatted rich text snippet');
  });

  it('traverses and fills elements inside Shadow DOM', () => {
    // Create host element with Shadow Root
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    const innerInput = document.createElement('input');
    innerInput.setAttribute('autocomplete', 'email');
    shadow.appendChild(innerInput);

    const fillables = collectFillableElements(document);
    expect(fillables).toContain(innerInput);

    const prof = createDefaultProfile();
    prof.email = 'shadow@example.com';

    const res = fillFormWithProfile(document, prof);
    expect(res.filledCount).toBe(1);
    expect(innerInput.value).toBe('shadow@example.com');
  });

  it('fills an entire form matching profile fields while ignoring payment card fields', () => {
    document.body.innerHTML = `
      <form id="checkout-form">
        <label for="fname">First Name</label>
        <input type="text" id="fname" />

        <label for="lname">Last Name</label>
        <input type="text" id="lname" />

        <label for="email">Email</label>
        <input type="email" id="email" />

        <label for="phone">Phone</label>
        <input type="tel" id="phone" />

        <label for="addr">Street Address</label>
        <input type="text" id="addr" />

        <label for="city">City</label>
        <input type="text" id="city" />

        <label for="zip">Postal Code</label>
        <input type="text" id="zip" />

        <!-- Password and Credit Card fields MUST be ignored during profile fill -->
        <label for="pwd">Password</label>
        <input type="password" id="pwd" />

        <label for="cc-num">Credit Card Number</label>
        <input type="text" id="cc-num" autocomplete="cc-number" />
      </form>
    `;

    const profile = createDefaultProfile();
    profile.firstName = 'Alan';
    profile.lastName = 'Turing';
    profile.email = 'alan@bletchley.org';
    profile.phone = '+44 1234 567890';
    profile.address1 = 'Sherborne School';
    profile.city = 'Dorset';
    profile.postalCode = 'DT9 3AP';

    const res = fillFormWithProfile(document, profile);
    expect(res.filledCount).toBe(7);

    expect((document.getElementById('fname') as HTMLInputElement).value).toBe('Alan');
    expect((document.getElementById('lname') as HTMLInputElement).value).toBe('Turing');
    expect((document.getElementById('email') as HTMLInputElement).value).toBe('alan@bletchley.org');
    expect((document.getElementById('phone') as HTMLInputElement).value).toBe('+44 1234 567890');
    expect((document.getElementById('addr') as HTMLInputElement).value).toBe('Sherborne School');
    expect((document.getElementById('city') as HTMLInputElement).value).toBe('Dorset');
    expect((document.getElementById('zip') as HTMLInputElement).value).toBe('DT9 3AP');

    // Security check: password and credit card MUST remain completely untouched
    expect((document.getElementById('pwd') as HTMLInputElement).value).toBe('');
    expect((document.getElementById('cc-num') as HTMLInputElement).value).toBe('');
  });

  it('explicitly fills payment card fields only when requested', () => {
    document.body.innerHTML = `
      <form id="payment-form">
        <label for="cc-name">Name on Card</label>
        <input type="text" id="cc-name" autocomplete="cc-name" />

        <label for="cc-num">Card Number</label>
        <input type="text" id="cc-num" autocomplete="cc-number" />

        <label for="cc-exp">Expiration Date</label>
        <input type="text" id="cc-exp" autocomplete="cc-exp" />

        <label for="cc-cvv">Security Code</label>
        <input type="text" id="cc-cvv" autocomplete="cc-csc" />
      </form>
    `;

    const card: PaymentCard = {
      id: 'card_123',
      nickname: 'Secure Visa',
      cardholderName: 'Alan Turing',
      cardNumber: '4242424242424242',
      expMonth: '11',
      expYear: '28',
      cvv: '789',
      brand: 'visa',
      createdAt: Date.now(),
    };

    const res = fillPaymentCard(document, card);
    expect(res.filledCount).toBe(4);

    expect((document.getElementById('cc-name') as HTMLInputElement).value).toBe('Alan Turing');
    expect((document.getElementById('cc-num') as HTMLInputElement).value).toBe('4242424242424242');
    expect((document.getElementById('cc-exp') as HTMLInputElement).value).toBe('11/28');
    expect((document.getElementById('cc-cvv') as HTMLInputElement).value).toBe('789');
  });
});
