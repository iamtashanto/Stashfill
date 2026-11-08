# Mozilla Add-ons (AMO) Listing — Stashfill

## Basic Information

- **Name**: Stashfill — Offline Autofill & Quick Paste
- **Summary**:
  Offline, no-login autofill and quick-paste. Save your personal data locally and fill any web form in 1 click. Zero trackers.
- **Categories**:
  - Privacy & Security
  - Productivity
- **Tags**: `autofill`, `privacy`, `form-filler`, `offline`, `encryption`
- **Support Website**: https://stashfill.tashanto.com
- **Privacy Policy URL**: https://stashfill.tashanto.com/privacy.html

---

## Detailed Description (AMO Markdown)

**Stashfill** is an offline, no-login, privacy-first browser extension for Firefox.
Save your own data once (name, email, phone, shipping address, links, payment cards, custom snippets) and fill or paste it into any web form in one click.

Think _FakeFiller_, but for your real saved data instead of random fake text.

### ✨ Features

- **1-Click Form Filling**: Fills matching inputs across the active page via popup, context menu, or `Alt+Shift+F`.
- **Works on Modern Frameworks**: Handles React controlled inputs (`_valueTracker`), Vue `v-model`, open Shadow DOM, same-origin iframes, and `contenteditable`.
- **100% Offline & Local**: No accounts, no servers, no analytics, no remote code. Verified by automated CI security checks.
- **Encrypted Vault**: Sensitive fields and payment cards are protected with AES-GCM 256-bit encryption and PBKDF2-SHA256 (600,000 iterations). Auto-locks on inactivity.
- **Card Security**: Luhn checksum validation, split 4-box card input detection, ephemeral one-time CVV, and 15-second clipboard clearing.
- **Multilingual Matcher**: English and Bangla (বাংলা) field synonyms dictionaries out of the box.
- **Accessible & Fast**: Full keyboard navigation, dark/light theme, and WCAG AA contrast compliance.

---

## Notes to Reviewer

- **Data Collection Permissions**: Declared as `required: ["none"]` in `manifest.json`. The extension does not collect or transmit any user information.
- **Storage**: All user profiles, custom fields, and encrypted envelopes are stored locally using `browser.storage.local`.
- **Encryption**: Uses standard W3C Web Cryptography API (`crypto.subtle`) natively built into Firefox.
- **Payment Card Disclosure**: Users can optionally save payment cards locally inside an AES-GCM 256 encrypted vault. Stashfill never sends financial or payment information to any server.

---

## Source Submission Notes (for AMO Reviewers)

To build and verify the extension from source:

1. Unzip the submitted `stashfill-sources.zip` file.
2. Ensure Node.js 20+ and pnpm 9+ are installed.
3. Run:
   ```bash
   pnpm install --frozen-lockfile
   pnpm build:firefox
   ```
4. The output matches `.output/firefox-mv3/` bit-for-bit.
5. See `BUILD.md` in the source zip for complete reproducible build steps.
