# Microsoft Edge Add-ons Listing — Stashfill

## Basic Information

- **Extension Name**: Stashfill — Offline Autofill & Quick Paste
- **Short Description**:
  Offline, no-login autofill and quick-paste. Save your personal data locally and fill any web form in 1 click. Zero trackers.
- **Category**: Productivity / Privacy
- **Support Contact / URL**: https://github.com/stashfill/stashfill
- **Privacy Policy URL**: https://stashfill.org/privacy.html

---

## Detailed Description

**Stashfill** is an offline, no-login, privacy-first autofill and quick-paste extension for Microsoft Edge.
Save your own data once (name, email, phone, shipping addresses, payment cards, custom snippets) and fill or paste it into any web form in one click.

### Why Choose Stashfill?

- **100% Offline & Local**: No accounts, no sign-in, zero telemetry, and zero remote network requests. All data stays strictly on your PC.
- **1-Click Autofill**: Fill standard HTML forms, React SPA forms, Vue `v-model` inputs, Google Forms, and shadow DOM elements instantly.
- **Encrypted Vault**: Sensitive fields and payment cards are encrypted locally using AES-GCM 256-bit with PBKDF2 (600,000 iterations). Auto-locks when inactive.
- **Payment Card Protection**: Real-time Luhn algorithm validation, brand detection, split 4-box card input detection, ephemeral one-time CVV, and 15-second clipboard clearing.
- **Lightning Fast & Accessible**: Popup opens in under 100 milliseconds with full keyboard navigation (arrow keys, Enter to fill/copy, Esc), dark/light theme, and multilingual support (English and বাংলা).
- **Import / Export**: Export to plain JSON (cards stripped for safety), CSV, or password-protected encrypted backups.

---

## Permission Justifications

- `storage`: Required to store profiles, snippets, and the encrypted vault locally on the user's computer.
- `activeTab`: Used strictly when the user clicks the extension icon, popup, or context menu to fill the active page.
- `scripting`: Required to inject the form-filling script on explicit user command.
- `contextMenus`: Adds right-click options for quick form filling and snippet insertion.
- `Optional Host Permissions`: Not requested upon installation; only requested optionally at runtime if the user enables the experimental inline overlay.

---

## Developer Disclosure on Payment Information

Stashfill allows users to store payment cards locally in an on-device encrypted vault using AES-GCM 256-bit encryption. Stashfill does not collect, transmit, or share financial or payment data with any third party.
