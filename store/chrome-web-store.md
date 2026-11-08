# Chrome Web Store Listing — Stashfill

## Basic Information

- **Extension Name**: Stashfill — Offline Autofill & Quick Paste
- **Short Description** (128 characters / max 132):
  Offline, no-login autofill and quick-paste. Save your personal data locally and fill any web form in 1 click. Zero trackers.
- **Website / Homepage**: https://stashfill.tashanto.com
- **Privacy Policy URL**: https://stashfill.tashanto.com/privacy.html

---

## Single-Purpose Statement

Stashfill serves a single purpose: to allow users to securely store their own personal profile data (such as contact info, addresses, custom text snippets, and encrypted payment cards) locally on their device, and fill or paste that data into web forms upon explicit user request.

---

## Detailed Description

Tired of typing your email, phone, shipping address, or custom info into web forms again and again?
Meet **Stashfill** — the offline, no-login, privacy-first autofill and quick-paste browser extension.

Think FakeFiller, but for your real saved data instead of fake dummy text.

### 🌟 Key Highlights

- ⚡ **1-Click Form Filling**: Fill matching fields across complex forms instantly via the popup, keyboard shortcut (`Alt+Shift+F`), or right-click context menu.
- 🔒 **100% Offline & Local**: No accounts, no sign-in, no telemetry, no analytics, and zero external network requests. Everything stays strictly on your computer.
- 🛡️ **Encrypted Vault for Sensitive Data**: Payment cards and sensitive fields are protected with AES-GCM 256-bit encryption derived via PBKDF2 (600,000 iterations). Auto-locks after inactivity.
- 💳 **Safe Payment Card Autofill**: Real-time Luhn algorithm validation, brand detection (Visa, Mastercard, Amex, Discover, JCB, Diners Club, UnionPay), split 4-box card input detection, ephemeral one-time CVV, and 15-second clipboard auto-clear.
- 🌐 **Works Everywhere**: Traverses React controlled inputs (`_valueTracker`), Vue `v-model`, open Shadow DOM, same-origin iframes, and `contenteditable` rich text editors.
- ⌨️ **Keyboard-First & Accessible**: Search 200+ fields in milliseconds with arrow-key navigation. Full WCAG AA color contrast, dark/light modes, and English & Bangla (বাংলা) support.
- 📦 **Backup & Portability**: Export your data as plain JSON, CSV, or password-protected encrypted backups with automatic rolling local snapshots.

---

## Permission Justifications (for Chrome Web Store review)

| Permission                                                | Justification                                                                                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                                 | Required to store user profiles, custom fields, and the encrypted vault locally on the device (`browser.storage.local`).                           |
| `activeTab`                                               | Granted only when the user clicks the extension action icon, popup, or context menu item to fill the current webpage.                              |
| `scripting`                                               | Required to programmatically execute the DOM filling script on the active tab upon explicit user invocation.                                       |
| `contextMenus`                                            | Creates right-click menu items allowing users to quickly fill forms or paste snippets directly into focused input fields.                          |
| `Optional Host Permissions` (`https://*/*`, `http://*/*`) | **Not requested upon install.** Only requested optionally at runtime if the user explicitly turns on the experimental inline-chip overlay feature. |

---

## Privacy Practices & Developer Disclosure

- **Single Purpose**: Stashfill only stores user data locally and fills form fields upon explicit user action.
- **Data Collection**: **None.** Stashfill does not collect or transmit any user data, personally identifiable information, browsing history, or analytics.
- **Financial / Payment Information Disclosure**:
  > **Honest Disclosure**: Stashfill allows users to locally save payment card data (cardholder name, card number, expiry date, and optional CVV) inside a client-side AES-GCM 256-bit encrypted vault for local autofill convenience. Stashfill **never transmits any payment information to any remote server or third party**. All encryption and decryption happen strictly in memory on the user's device.  
  > _Note for Submission_: Ensure current Chrome Web Store policies regarding financial information storage comply with your deployment jurisdiction before publishing.
- **Remote Code**: Stashfill does not execute any remote code, external scripts, or `eval()`. Strict CSP is enforced in `manifest.json`.

---

## Screenshot Plan (Five 1280x800 Images)

1. **Screenshot 1 — 1-Click Form Filling in Action**
   - _Caption_: "Fill any web form in 1 click. Works on React, Vue, Google Forms, and shadow DOM."
   - _Visual_: Split view showing a complex checkout/signup form and the Stashfill popup overlay with the green "Fill Form" button highlighted and fields glowing green.
2. **Screenshot 2 — Instant Search & Quick Paste**
   - _Caption_: "Lightning-fast search across all your saved profiles, addresses, and snippets."
   - _Visual_: Popup search bar focused with keyboard navigation highlighting a field, showing copy and fill action pills.
3. **Screenshot 3 — Encrypted Vault for Payment Cards**
   - _Caption_: "Bank-grade AES-GCM 256-bit encrypted vault for payment cards with auto-lock."
   - _Visual_: The Vault UI showing masked card `VISA •••• 0366`, lock status, and Luhn card validation.
4. **Screenshot 4 — Multilingual & Accessible (English & Bangla)**
   - _Caption_: "Multilingual heuristic matcher with English and Bangla support, dark mode, and high contrast."
   - _Visual_: Side-by-side view of English and Bangla localized Options dashboard with dark theme enabled.
5. **Screenshot 5 — Complete Control & Encrypted Backups**
   - _Caption_: "100% offline. Zero accounts. Export or backup your data with rolling local history."
   - _Visual_: The Import/Export dashboard showing dry-run merge conflict preview and backup snapshots.

---

## Promotional Tile Copy

- **Small Tile (440x280)**:
  - _Headline_: Stashfill
  - _Tagline_: 1-Click Offline Autofill. Privacy First.
- **Marquee Tile (1400x560)**:
  - _Headline_: Stashfill — Your Data. Your Device. 1-Click Fill.
  - _Subtext_: 100% Offline • Zero Analytics • AES-GCM 256 Encrypted Vault • Open Source
