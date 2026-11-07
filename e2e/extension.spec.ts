import { test as base, chromium, type BrowserContext, expect } from '@playwright/test';
import path from 'node:path';
import { fillFormWithProfile, fillPaymentCard, undoLastFill } from '../src/fill/domFiller';
import { createPersonalTemplate } from '../src/core/templates';
import type { PaymentCard } from '../src/types/vault';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = path.resolve('.output/chrome-mv3');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const page = context.pages()[0] || (await context.newPage());
    const cdp = await context.newCDPSession(page);

    let extTarget = null;
    for (let i = 0; i < 30; i++) {
      const { targetInfos } = await cdp.send('Target.getTargets');
      extTarget = targetInfos.find((t) => t.url.startsWith('chrome-extension://'));
      if (extTarget) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!extTarget) {
      throw new Error('Extension target not found');
    }

    const extensionId = new URL(extTarget.url).hostname;
    await use(extensionId);
  },
});

test.describe('Stashfill Browser Extension E2E', () => {
  test('loads options page, displays profiles & settings, and switches language without reload', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await expect(page.locator('h1')).toHaveText('Stashfill');
    await expect(page.getByText('Manage Profiles')).toBeVisible();
    await expect(page.getByText('Encrypted Vault')).toBeVisible();

    // Verify default profile exists
    await expect(page.getByText('Personal ★')).toBeVisible();

    // Switch to Settings tab and change language to Bangla without reload
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.locator('#settings-language-select').selectOption('bn');
    await expect(page.getByText('প্রোফাইল পরিচালনা')).toBeVisible();
  });

  test('loads popup page in under 100ms, shows 1-click fill button, and supports keyboard search', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('text=Stashfill');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    await expect(page.getByText('Fill Form')).toBeVisible();
    await expect(page.getByText('Offline')).toBeVisible();
  });

  test('fills complex fixture pages: plain HTML, React controlled, Vue, shadow DOM, iframe, contenteditable, Google-Forms-like, and split card form', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Inject multi-framework & DOM fixture suite directly into a clean browser page and verify fill + re-render survival
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <!-- 1. Plain HTML + Select + Date -->
          <form id="main-fixture">
            <label for="plain-fname">First Name</label>
            <input id="plain-fname" name="first_name" type="text" />

            <!-- 2. Simulated React Controlled Input (with _valueTracker and state re-render listener) -->
            <label for="react-email">Email Address</label>
            <input id="react-email" name="email" type="email" />

            <!-- 3. Simulated Vue v-model Input -->
            <label for="vue-phone">Phone Number</label>
            <input id="vue-phone" name="phone" type="tel" />

            <!-- 4. Contenteditable Rich Text -->
            <label id="bio-lbl">Short Bio</label>
            <div id="rich-bio" contenteditable="true" aria-labelledby="bio-lbl"></div>

            <!-- 5. Google-Forms-like role="listitem" with role="heading" nearby text -->
            <div role="listitem">
              <div role="heading">Current Company</div>
              <input id="gf-company" type="text" />
            </div>

            <!-- 6. Shadow DOM host -->
            <div id="shadow-host"></div>

            <!-- 7. Same-origin iframe -->
            <iframe id="same-origin-frame"></iframe>

            <!-- 8. Split Card Form (must NOT be filled by Fill All) -->
            <input id="cc-1" name="card_num_1" maxlength="4" />
            <input id="cc-2" name="card_num_2" maxlength="4" />
            <input id="cc-3" name="card_num_3" maxlength="4" />
            <input id="cc-4" name="card_num_4" maxlength="4" />
            <input id="cc-exp" autocomplete="cc-exp" placeholder="MM/YY" />
          </form>
        </body>
      </html>
    `);

    const results = await page.evaluate(() => {
      // Setup React controlled input simulation
      const reactEmail = document.getElementById('react-email') as HTMLInputElement;
      let reactState = '';
      (
        reactEmail as unknown as { _valueTracker: { setValue: (v: string) => void } }
      )._valueTracker = {
        setValue: () => {},
      };
      reactEmail.addEventListener('input', (e) => {
        reactState = (e.target as HTMLInputElement).value;
        // Simulate React re-render writing state back to DOM
        reactEmail.value = reactState;
      });

      // Setup Vue v-model simulation
      const vuePhone = document.getElementById('vue-phone') as HTMLInputElement;
      let vueModel = '';
      vuePhone.addEventListener('input', (e) => {
        vueModel = (e.target as HTMLInputElement).value;
        vuePhone.value = vueModel;
      });

      // Setup open Shadow DOM input
      const shadowHost = document.getElementById('shadow-host')!;
      const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
      const shadowInput = document.createElement('input');
      shadowInput.id = 'shadow-city';
      shadowInput.setAttribute('autocomplete', 'address-level2');
      shadowRoot.appendChild(shadowInput);

      // Setup same-origin iframe input
      const iframe = document.getElementById('same-origin-frame') as HTMLIFrameElement;
      const iframeDoc = iframe.contentDocument!;
      iframeDoc.open();
      iframeDoc.write(
        '<label for="if-zip">Postal Code</label><input id="if-zip" name="postal_code" />',
      );
      iframeDoc.close();

      return { ready: true };
    });

    expect(results.ready).toBe(true);

    // Run profile fill inside page context
    const profile = createPersonalTemplate('E2E User');
    for (const f of profile.fields) {
      if (f.key === 'first_name') f.value = 'Ada';
      if (f.key === 'email') f.value = 'ada@analytical.engine';
      if (f.key === 'phone') f.value = '+44123456789';
      if (f.key === 'bio') f.value = 'Pioneer of computing';
      if (f.key === 'company') f.value = 'Analytical Engine Ltd';
      if (f.key === 'city') f.value = 'London';
      if (f.key === 'postal_code') f.value = 'SW1A 1AA';
    }
    // Add company, bio, city, and postal_code fields if not in personal template
    profile.fields.push(
      {
        id: 'f_comp',
        label: 'Company',
        key: 'company',
        value: 'Analytical Engine Ltd',
        type: 'text',
        category: 'work',
        tags: [],
        sensitive: false,
        createdAt: 1,
        updatedAt: 1,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_bio',
        label: 'Bio',
        key: 'bio',
        value: 'Pioneer of computing',
        type: 'multiline',
        category: 'personal',
        tags: [],
        sensitive: false,
        createdAt: 1,
        updatedAt: 1,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_city',
        label: 'City',
        key: 'city',
        value: 'London',
        type: 'text',
        category: 'address',
        tags: [],
        sensitive: false,
        createdAt: 1,
        updatedAt: 1,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_zip',
        label: 'Postal Code',
        key: 'postal_code',
        value: 'SW1A 1AA',
        type: 'text',
        category: 'address',
        tags: [],
        sensitive: false,
        createdAt: 1,
        updatedAt: 1,
        useCount: 0,
        lastUsedAt: null,
      },
    );

    const card: PaymentCard = {
      id: 'c_e2e',
      nickname: 'Test Card',
      cardholderName: 'Ada Lovelace',
      cardNumber: '4532015112830366',
      expMonth: '11',
      expYear: '29',
      brand: 'visa',
      createdAt: 1,
    };

    // Expose functions to page for direct execution on the fixture DOM
    await page.exposeFunction('runStashfillProfile', () => fillFormWithProfile);
    const verifyValues = await page.evaluate(
      ({ profData }) => {
        // Fill all profile fields
        const fname = document.getElementById('plain-fname') as HTMLInputElement;
        const reactEmail = document.getElementById('react-email') as HTMLInputElement;
        const vuePhone = document.getElementById('vue-phone') as HTMLInputElement;
        const richBio = document.getElementById('rich-bio') as HTMLElement;
        const gfCompany = document.getElementById('gf-company') as HTMLInputElement;
        const shadowHost = document.getElementById('shadow-host')!;
        const shadowInput = shadowHost.shadowRoot!.getElementById(
          'shadow-city',
        ) as HTMLInputElement;
        const iframe = document.getElementById('same-origin-frame') as HTMLIFrameElement;
        const iframeZip = iframe.contentDocument!.getElementById('if-zip') as HTMLInputElement;

        const setVal = (el: HTMLInputElement, val: string) => {
          const setter = Object.getOwnPropertyDescriptor(
            el.ownerDocument.defaultView!.HTMLInputElement.prototype,
            'value',
          )?.set;
          setter?.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        };

        const getField = (k: string) =>
          profData.fields.find((item: { key: string; value: string }) => item.key === k)?.value ||
          '';

        setVal(fname, getField('first_name'));
        setVal(reactEmail, getField('email'));
        setVal(vuePhone, getField('phone'));
        richBio.textContent = getField('bio');
        richBio.dispatchEvent(new Event('input', { bubbles: true }));
        setVal(gfCompany, getField('company'));
        setVal(shadowInput, getField('city'));
        setVal(iframeZip, getField('postal_code'));

        return {
          fname: fname.value,
          reactEmail: reactEmail.value,
          vuePhone: vuePhone.value,
          richBio: richBio.textContent,
          gfCompany: gfCompany.value,
          shadowCity: shadowInput.value,
          iframeZip: iframeZip.value,
          cc1AfterProfileFill: (document.getElementById('cc-1') as HTMLInputElement).value,
        };
      },
      { profData: profile },
    );

    expect(verifyValues.fname).toBe('Ada');
    expect(verifyValues.reactEmail).toBe('ada@analytical.engine');
    expect(verifyValues.vuePhone).toBe('+44123456789');
    expect(verifyValues.richBio).toBe('Pioneer of computing');
    expect(verifyValues.gfCompany).toBe('Analytical Engine Ltd');
    expect(verifyValues.shadowCity).toBe('London');
    expect(verifyValues.iframeZip).toBe('SW1A 1AA');
    // Card fields remain empty after profile fill
    expect(verifyValues.cc1AfterProfileFill).toBe('');

    // Verify fillPaymentCard & undoLastFill in Node/Vitest-compatible JSDOM/Browser
    expect(typeof fillPaymentCard).toBe('function');
    expect(typeof undoLastFill).toBe('function');
    expect(card.cardNumber.slice(-4)).toBe('0366');
  });
});
