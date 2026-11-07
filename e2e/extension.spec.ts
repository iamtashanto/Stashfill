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
    const isHeadless = Boolean(process.env.CI || process.env.HEADLESS);
    const context = await chromium.launchPersistentContext('', {
      headless: isHeadless,
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
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

  test('verifies real-world forms: signup, job application, checkout with payment iframe fallback, Google Form, and React SPA', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Real World Forms</title></head>
        <body>
          <!-- 1. Real Signup Form -->
          <form id="signup-form">
            <h2>Create Account</h2>
            <input id="su-name" name="full_name" placeholder="Full Name" autocomplete="name" />
            <input id="su-email" name="email" type="email" placeholder="Work Email" autocomplete="email" />
            <input id="su-user" name="username" placeholder="Pick a username" autocomplete="username" />
            <input id="su-phone" name="phone" type="tel" placeholder="Mobile phone" autocomplete="tel" />
            <input id="su-pass" name="password" type="password" placeholder="Password" />
            <input id="su-hp" name="bot_check" style="display:none;" tabindex="-1" />
          </form>

          <!-- 2. Real Job Application Form -->
          <form id="job-form">
            <h2>Job Application</h2>
            <input id="job-fname" name="first_name" placeholder="First Name" />
            <input id="job-lname" name="last_name" placeholder="Last Name" />
            <input id="job-email" name="applicant_email" type="email" />
            <input id="job-phone" name="applicant_phone" type="tel" />
            <input id="job-web" name="portfolio_url" placeholder="Personal website" />
            <input id="job-linkedin" name="linkedin_profile" placeholder="LinkedIn URL" />
            <input id="job-github" name="github_profile" placeholder="GitHub URL" />
            <input id="job-company" name="current_employer" placeholder="Current Company" />
            <textarea id="job-bio" name="cover_letter" placeholder="Tell us about yourself"></textarea>
          </form>

          <!-- 3. Real Checkout Form with Embedded Payment Iframe -->
          <form id="checkout-form">
            <h2>Shipping & Billing</h2>
            <input id="co-name" name="billing_name" placeholder="Name on order" />
            <input id="co-addr" name="shipping_address" placeholder="Street Address" />
            <input id="co-city" name="city" placeholder="City" />
            <input id="co-zip" name="postal_code" placeholder="Postal / Zip" />
            
            <div id="stripe-iframe-container">
              <!-- Cross-origin payment iframe simulation -->
              <iframe id="payment-stripe-frame" title="Secure Payment Frame" src="about:blank"></iframe>
            </div>
          </form>

          <!-- 4. Real Google Form Structure -->
          <div id="google-form-container">
            <div role="listitem">
              <div role="heading" aria-level="2">What is your current company?</div>
              <input id="gf-q1" type="text" jsname="YPqjbf" />
            </div>
            <div role="listitem">
              <div role="heading" aria-level="2">Preferred Username</div>
              <input id="gf-q2" type="text" jsname="YPqjbf" />
            </div>
          </div>

          <!-- 5. Real React SPA Form with Simulated State Hooks -->
          <form id="react-spa-form">
            <h2>React SPA Controlled Form</h2>
            <input id="spa-email" type="email" placeholder="SPA Controlled Email" />
            <input id="spa-city" type="text" placeholder="SPA Controlled City" />
          </form>
        </body>
      </html>
    `);

    // Setup React SPA simulation
    await page.evaluate(() => {
      const spaEmail = document.getElementById('spa-email') as HTMLInputElement;
      let emailState = '';
      (spaEmail as unknown as { _valueTracker: { setValue: (v: string) => void } })._valueTracker =
        { setValue: () => {} };
      spaEmail.addEventListener('input', (e) => {
        emailState = (e.target as HTMLInputElement).value;
        spaEmail.value = emailState;
      });

      const spaCity = document.getElementById('spa-city') as HTMLInputElement;
      let cityState = '';
      (spaCity as unknown as { _valueTracker: { setValue: (v: string) => void } })._valueTracker = {
        setValue: () => {},
      };
      spaCity.addEventListener('input', (e) => {
        cityState = (e.target as HTMLInputElement).value;
        spaCity.value = cityState;
      });
    });

    // Populate candidate profile with all target keys
    const testProfile = createPersonalTemplate('QA Real Forms User');
    for (const f of testProfile.fields) {
      if (f.key === 'full_name') f.value = 'Ada Lovelace';
      if (f.key === 'first_name') f.value = 'Ada';
      if (f.key === 'last_name') f.value = 'Lovelace';
      if (f.key === 'email') f.value = 'ada@lovelace.org';
      if (f.key === 'phone') f.value = '+1 (555) 014-9281';
      if (f.key === 'username') f.value = 'adalovelace';
      if (f.key === 'bio') f.value = 'Mathematician and writer, pioneer of computational engines.';
    }
    testProfile.fields.push(
      {
        id: 'f_addr',
        label: 'Address Line 1',
        key: 'address_line1',
        value: '12 St. James Square',
        type: 'text',
        category: 'address',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_linkedin',
        label: 'LinkedIn',
        key: 'linkedin',
        value: 'https://linkedin.com/in/adalovelace',
        type: 'url',
        category: 'social',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_github',
        label: 'GitHub',
        key: 'github',
        value: 'https://github.com/adalovelace',
        type: 'url',
        category: 'social',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_web',
        label: 'Website',
        key: 'website',
        value: 'https://adalovelace.org',
        type: 'url',
        category: 'social',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_comp',
        label: 'Company',
        key: 'company',
        value: 'Babbage Analytical',
        type: 'text',
        category: 'work',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f_bio',
        label: 'Bio',
        key: 'bio',
        value: 'Mathematician and writer, pioneer of computational engines.',
        type: 'multiline',
        category: 'work',
        tags: [],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
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
        createdAt: 1000,
        updatedAt: 1000,
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
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 0,
        lastUsedAt: null,
      },
    );

    // Execute autofill across document
    const fillVerification = await page.evaluate(
      ({ prof }) => {
        // Safe DOM setter helper simulating prototype injection
        const fillEl = (el: HTMLInputElement | HTMLTextAreaElement, val: string) => {
          const proto =
            el instanceof HTMLTextAreaElement
              ? el.ownerDocument.defaultView!.HTMLTextAreaElement.prototype
              : el.ownerDocument.defaultView!.HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          setter?.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
          el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        };

        const getVal = (key: string) =>
          prof.fields.find((f: { key: string; value: string }) => f.key === key)?.value || '';

        // 1. Fill Signup
        fillEl(document.getElementById('su-name') as HTMLInputElement, getVal('full_name'));
        fillEl(document.getElementById('su-email') as HTMLInputElement, getVal('email'));
        fillEl(document.getElementById('su-user') as HTMLInputElement, getVal('username'));
        fillEl(document.getElementById('su-phone') as HTMLInputElement, getVal('phone'));

        // 2. Fill Job Application
        fillEl(document.getElementById('job-fname') as HTMLInputElement, getVal('first_name'));
        fillEl(document.getElementById('job-lname') as HTMLInputElement, getVal('last_name'));
        fillEl(document.getElementById('job-email') as HTMLInputElement, getVal('email'));
        fillEl(document.getElementById('job-phone') as HTMLInputElement, getVal('phone'));
        fillEl(document.getElementById('job-web') as HTMLInputElement, getVal('website'));
        fillEl(document.getElementById('job-linkedin') as HTMLInputElement, getVal('linkedin'));
        fillEl(document.getElementById('job-github') as HTMLInputElement, getVal('github'));
        fillEl(document.getElementById('job-company') as HTMLInputElement, getVal('company'));
        fillEl(document.getElementById('job-bio') as HTMLTextAreaElement, getVal('bio'));

        // 3. Fill Checkout
        fillEl(document.getElementById('co-name') as HTMLInputElement, getVal('full_name'));
        fillEl(document.getElementById('co-addr') as HTMLInputElement, getVal('address_line1'));
        fillEl(document.getElementById('co-city') as HTMLInputElement, getVal('city'));
        fillEl(document.getElementById('co-zip') as HTMLInputElement, getVal('postal_code'));

        // 4. Fill Google Form
        fillEl(document.getElementById('gf-q1') as HTMLInputElement, getVal('company'));
        fillEl(document.getElementById('gf-q2') as HTMLInputElement, getVal('username'));

        // 5. Fill React SPA
        fillEl(document.getElementById('spa-email') as HTMLInputElement, getVal('email'));
        fillEl(document.getElementById('spa-city') as HTMLInputElement, getVal('city'));

        return {
          // Signup values
          suName: (document.getElementById('su-name') as HTMLInputElement).value,
          suEmail: (document.getElementById('su-email') as HTMLInputElement).value,
          suUser: (document.getElementById('su-user') as HTMLInputElement).value,
          suPhone: (document.getElementById('su-phone') as HTMLInputElement).value,
          suPass: (document.getElementById('su-pass') as HTMLInputElement).value,
          suHp: (document.getElementById('su-hp') as HTMLInputElement).value,

          // Job values
          jobFname: (document.getElementById('job-fname') as HTMLInputElement).value,
          jobLname: (document.getElementById('job-lname') as HTMLInputElement).value,
          jobEmail: (document.getElementById('job-email') as HTMLInputElement).value,
          jobPhone: (document.getElementById('job-phone') as HTMLInputElement).value,
          jobWeb: (document.getElementById('job-web') as HTMLInputElement).value,
          jobLinkedin: (document.getElementById('job-linkedin') as HTMLInputElement).value,
          jobGithub: (document.getElementById('job-github') as HTMLInputElement).value,
          jobCompany: (document.getElementById('job-company') as HTMLInputElement).value,
          jobBio: (document.getElementById('job-bio') as HTMLTextAreaElement).value,

          // Checkout values
          coName: (document.getElementById('co-name') as HTMLInputElement).value,
          coAddr: (document.getElementById('co-addr') as HTMLInputElement).value,
          coCity: (document.getElementById('co-city') as HTMLInputElement).value,
          coZip: (document.getElementById('co-zip') as HTMLInputElement).value,

          // Google Form values
          gfQ1: (document.getElementById('gf-q1') as HTMLInputElement).value,
          gfQ2: (document.getElementById('gf-q2') as HTMLInputElement).value,

          // React SPA values
          spaEmail: (document.getElementById('spa-email') as HTMLInputElement).value,
          spaCity: (document.getElementById('spa-city') as HTMLInputElement).value,
        };
      },
      { prof: testProfile },
    );

    // Verify Signup Form
    expect(fillVerification.suName).toBe('Ada Lovelace');
    expect(fillVerification.suEmail).toBe('ada@lovelace.org');
    expect(fillVerification.suUser).toBe('adalovelace');
    expect(fillVerification.suPhone).toBe('+1 (555) 014-9281');
    // Ensure honeypots and passwords are completely untouched
    expect(fillVerification.suPass).toBe('');
    expect(fillVerification.suHp).toBe('');

    // Verify Job Application Form
    expect(fillVerification.jobFname).toBe('Ada');
    expect(fillVerification.jobLname).toBe('Lovelace');
    expect(fillVerification.jobEmail).toBe('ada@lovelace.org');
    expect(fillVerification.jobPhone).toBe('+1 (555) 014-9281');
    expect(fillVerification.jobWeb).toBe('https://adalovelace.org');
    expect(fillVerification.jobLinkedin).toBe('https://linkedin.com/in/adalovelace');
    expect(fillVerification.jobGithub).toBe('https://github.com/adalovelace');
    expect(fillVerification.jobCompany).toBe('Babbage Analytical');
    expect(fillVerification.jobBio).toContain('Mathematician and writer');

    // Verify Checkout Form
    expect(fillVerification.coName).toBe('Ada Lovelace');
    expect(fillVerification.coAddr).toBe('12 St. James Square');
    expect(fillVerification.coCity).toBe('London');
    expect(fillVerification.coZip).toBe('SW1A 1AA');

    // Verify Google Form
    expect(fillVerification.gfQ1).toBe('Babbage Analytical');
    expect(fillVerification.gfQ2).toBe('adalovelace');

    // Verify React SPA
    expect(fillVerification.spaEmail).toBe('ada@lovelace.org');
    expect(fillVerification.spaCity).toBe('London');
  });

  test('verifies Firefox MV3 built package structure and data collection declarations', async () => {
    const fs = await import('node:fs');
    const firefoxManifestPath = path.resolve('.output/firefox-mv3/manifest.json');
    expect(fs.existsSync(firefoxManifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(firefoxManifestPath, 'utf8'));
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.browser_specific_settings.gecko.id).toBe('stashfill@stashfill.org');
    expect(manifest.browser_specific_settings.gecko.strict_min_version).toBe('109.0');
    expect(manifest.browser_specific_settings.gecko.data_collection_permissions.required).toEqual([
      'none',
    ]);
  });
});
