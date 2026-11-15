# Microsoft Edge Add-ons Listing — Stashfill

## Basic Information

- **Extension Name**: Stashfill — Offline Autofill & Quick Paste
- **Short Description / Summary** (90 chars / Edge max 100 chars):
  Offline, no-login autofill & quick paste. Save data locally & fill any web form in 1 click.
- **Detailed Short Description** (for stores with 132-char limit):
  Offline, no-login autofill and quick-paste. Save your personal data locally and fill any web form in 1 click. Zero trackers.
- **Primary Category**: Productivity
- **Secondary Category**: Personalization
- **Support Contact / Website**: https://stashfill.tashanto.com
- **Privacy Policy URL**: https://stashfill.tashanto.com/privacy.html
- **Support Email**: privacy@stashfill.org

---

## Detailed Description

Tired of typing your email, phone, shipping address, or custom info into web forms again and again?
Meet **Stashfill** — the offline, no-login, privacy-first autofill and quick-paste browser extension for Microsoft Edge.

Think FakeFiller, but for your real saved data instead of fake dummy text.

### 🌟 Key Highlights

- ⚡ **1-Click Form Filling**: Fill matching fields across complex forms instantly via the popup, keyboard shortcut (`Alt+Shift+F`), or right-click context menu.
- 🔒 **100% Offline & Local**: No accounts, no sign-in, zero telemetry, and zero remote network requests. All data stays strictly on your computer.
- 🛡️ **Encrypted Vault for Sensitive Data**: Payment cards and sensitive fields are protected with AES-GCM 256-bit encryption derived via PBKDF2 (600,000 iterations). Auto-locks after inactivity.
- 💳 **Safe Payment Card Autofill**: Real-time Luhn algorithm validation, brand detection (Visa, Mastercard, Amex, Discover, JCB, Diners Club, UnionPay), split 4-box card input detection, ephemeral one-time CVV, and 15-second clipboard auto-clear.
- 🌐 **Works Everywhere**: Traverses React controlled inputs (`_valueTracker`), Vue `v-model`, open Shadow DOM, same-origin iframes, and `contenteditable` rich text editors.
- ⌨️ **Keyboard-First & Accessible**: Search 200+ fields in milliseconds with arrow-key navigation. Full WCAG AA color contrast, dark/light modes, and English & Bangla (বাংলা) support.
- 📦 **Backup & Portability**: Export your data as plain JSON, CSV, or password-protected encrypted backups with automatic rolling local snapshots.

---

## Permission Justifications (for Edge Review Team)

- `storage`: Required to save user profile data, text snippets, site preferences, and the encrypted vault locally on the device using browser storage (`chrome.storage.local`). No data is ever transmitted to remote servers.
- `activeTab`: Granted strictly on-demand when the user clicks the extension action icon, popup, or context menu item to fill the active webpage.
- `scripting`: Required to programmatically execute the DOM filling script on the active tab upon explicit user invocation.
- `contextMenus`: Creates right-click menu items allowing users to quickly fill forms or paste snippets directly into focused input fields.
- `Optional Host Permissions` (`https://*/*`, `http://*/*`): **Not requested upon install.** Only requested optionally at runtime if the user explicitly turns on the experimental inline-chip overlay feature.

---

## Developer Disclosure on Payment Information

Stashfill allows users to locally save payment card data (cardholder name, card number, expiry date, and optional CVV) inside a client-side AES-GCM 256-bit encrypted vault for local autofill convenience. Stashfill does not collect, transmit, or share financial or payment data with any remote server or third party. All cryptographic operations happen entirely in memory on the client device.

---

## Notes for Certification (Reviewer Instructions)

```text
Stashfill is a 100% offline, privacy-first autofill extension. It does not communicate with any external backend servers.

How to test:
1. Click the Stashfill extension icon in the toolbar to open the popup.
2. The default profile 'Personal' comes pre-loaded with example fields (Full Name, Email, Address, etc.).
3. Open any web form (such as a registration or checkout form) and click 'Fill Form' in the popup or right-click any input and select 'Stashfill > Fill this form'.
4. To test the encrypted vault: Open Options (or click Encrypted Vault in popup), create a master passphrase, and add a test card (e.g. 4111 1111 1111 1111).
5. All data is saved strictly locally via chrome.storage.local.
```

---

## Submission Package & Store Visual Assets

- **Edge ZIP Package**: `output/stashfill-1.0.0-edge.zip` (142 KB)
- **Unpacked Folder**: `output/edge-mv3/`
- **Store Logo (128x128)**: `output/edge-mv3/icons/icon-128.png`
- **Small Promo Tile (440x280)**: `store/assets/promo-small-440x280.png`
- **Large Banner (1400x560)**: `store/assets/promo-marquee-1400x560.png`
- **Screenshots (1280x800)**:
  - `store/assets/screenshot-1-autofill-1280x800.png`
  - `store/assets/screenshot-2-encrypted-vault-1280x800.png`
  - `store/assets/screenshot-3-profiles-fields-1280x800.png`
  - `store/assets/screenshot-4-multilingual-1280x800.png`
  - `store/assets/screenshot-5-backups-snapshots-1280x800.png`
