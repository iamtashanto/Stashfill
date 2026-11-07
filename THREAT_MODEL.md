# Stashfill Threat Model

This document describes the security architecture, protected assets, threat actors, trust boundaries, and concrete technical mitigations implemented in Stashfill.

> **Important Scope Disclaimer**: Stashfill is an offline, local-first quick-fill utility. **Stashfill is not a replacement for your browser wallet, hardware security module, or OS wallet (such as Apple Pay, Google Wallet, or Windows Hello).**

---

## 1. Protected Assets

| Asset                                                 | Sensitivity | Storage Location                                     | Protection Level                                                                                                     |
| :---------------------------------------------------- | :---------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Master Passphrase & Derived AES Key**               | Critical    | Volatile memory only (`VaultManager`)                | Never persisted to disk; wiped on lock or auto-lock timeout                                                          |
| **Payment Cards (PAN, Expiry, optional CVV)**         | High        | `chrome.storage.local` (`stashfill_encrypted_vault`) | Mandatory AES-GCM 256-bit encryption via PBKDF2-SHA256 (600,000 iterations)                                          |
| **Sensitive Profile Fields (Tax ID, NID, SSN, etc.)** | High        | `chrome.storage.local` (`stashfill_vault_primary`)   | Masked in UI (`••••••••`), excluded from inline chips by default, per-origin confirmation required before first fill |
| **General Profile Fields & Text Snippets**            | Medium      | `chrome.storage.local`                               | Isolated within extension storage origin; filled only on explicit user gesture                                       |
| **Exported Backup Files**                             | High        | User filesystem                                      | Plain JSON/CSV exports strictly strip all payment cards; cards travel only inside AES-GCM encrypted export envelopes |

---

## 2. Threat Actors & Mitigations

### 2.1 Malicious Web Page (Untrusted Host DOM)

**Attack Vectors:**

- Hidden honeypot inputs (`display: none`, `visibility: hidden`, `opacity: 0`, off-screen, `tabindex="-1"`) attempting to harvest profile fields during "Fill All" when the user only sees an email input.
- Fake payment forms served over unencrypted HTTP or embedded inside untrusted cross-origin iframes.
- CSS/DOM spoofing or script inspection of extension overlays injected into the page.
- Prototype pollution or XSS payloads inside text selected on a page and saved to Stashfill, or imported via crafted files.

**Mitigations:**

1. **Strict User-Gesture-Only Filling**: Stashfill never autofills passively on page load. Every fill requires an explicit user action (Popup click, Context Menu click, Keyboard shortcut, or Quick Picker selection).
2. **Invisible & Honeypot Field Rejection**: `isElementHiddenOrHoneypot()` and `shouldSkipField()` inspect `hidden`, `aria-hidden`, inline styles, computed styles (`display`, `visibility`, `opacity`), and negative `tabIndex` traps, skipping them unconditionally.
3. **Closed Shadow DOM Isolation**: On-page overlays (Quick Picker, Map Field modal, Card Confirmation modal) are mounted inside a `mode: 'closed'` Shadow Root (`attachShadow({ mode: 'closed' })`) with `all: initial` CSS isolation and zero `innerHTML` usage (`textContent` and `replaceChildren()` only). Host page scripts cannot read or tamper with the shadow tree.
4. **Payment Card Isolation & HTTPS Enforcement**:
   - Payment cards are **never** filled via "Fill All", inline chips, snippets, or auto-suggest.
   - `fillPaymentCard()` blocks `http:` origins strictly.
   - Every card fill displays an explicit confirmation showing the target site origin and the card's last 4 digits.
   - Cross-origin payment iframes are never forcibly filled; Stashfill offers a **Copy Card Number** fallback that automatically clears the clipboard after **15 seconds**.
5. **Sensitive Field Per-Origin Gate**: Fields flagged `sensitive: true` require an explicit confirmation the first time they are filled on a domain (`confirmedSensitiveOrigins`), and warn when triggered inside a cross-origin iframe.

---

### 2.2 Malicious or Compromised Third-Party Extension

**Attack Vectors:**

- Other browser extensions attempting to intercept network traffic, read DOM overlays, or scrape clipboard contents after a copy action.

**Mitigations:**

1. **100% Offline & Zero Network Surface**: Stashfill makes zero network requests. A CI gate (`scripts/check-code-safety.mjs`) fails the build if `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, or `new Function` appear anywhere in `src/` or `entrypoints/`.
2. **Extension Storage Origin Isolation**: Browser extension `chrome.storage.local` is isolated per extension ID by the browser security model; other extensions cannot read Stashfill's storage.
3. **15-Second Clipboard Auto-Clear**: When copying a payment card number (`copyCardNumberWithAutoClear`), Stashfill overwrites the system clipboard with an empty string after 15,000 ms to minimize exposure to clipboard-monitoring software.

---

### 2.3 Shoulder Surfing & Unattended Unlocked Session

**Attack Vectors:**

- Visual observation of the screen while the user opens the Popup or Options page in a public space.
- An attacker briefly accessing an unlocked browser session while the user steps away.

**Mitigations:**

1. **Default Masking Everywhere**:
   - Payment cards are always displayed as brand icon + `•••• •••• •••• 1234`. Revealing full digits requires an unlocked vault plus an explicit click on the Reveal toggle.
   - Sensitive profile fields are masked as `••••••••` in both Popup and Options UI until explicitly clicked, and their value previews are suppressed in right-click context menus.
2. **Configurable Inactivity Auto-Lock**: `VaultManager` maintains an inactivity timer (`vaultTimeoutMinutes`, default 15 minutes) that wipes decrypted vault contents and the passphrase from memory.
3. **5-Minute Step-Up Re-Authentication for Cards**: Even when the vault is unlocked, if `lastUnlockedAt` is older than `cardReauthMinutes` (default **5 minutes**), accessing, revealing, copying, or filling a payment card requires re-entering the master passphrase (`requiresCardReauth`).
4. **Ephemeral CVV by Default**: CVV storage is **off by default**. When CVV is not saved, Stashfill prompts for a one-time CVV at fill time, holds it only in volatile memory for that single fill action, and discards it immediately.

---

### 2.4 Physical Device Theft or Disk Inspection

**Attack Vectors:**

- An attacker obtains a copy of the user's browser profile directory on disk or an exported backup file and attempts offline brute-force decryption.

**Mitigations:**

1. **PBKDF2-SHA256 (600,000 Iterations) + AES-GCM 256-Bit**:
   - Master passphrases are stretched using Web Crypto `PBKDF2` with `SHA-256` and **600,000 iterations** (aligned with OWASP recommendations) and a fresh cryptographically random 16-byte salt per save.
   - Encryption uses authenticated `AES-GCM` with a 256-bit key and a fresh 12-byte random IV on every write. Ciphertext tampering is detected and rejected with `VaultDecryptionError`.
2. **Mandatory Encryption Before First Card**: The repository and UI enforce `requiresEncryptionForCards`; a user cannot save a payment card until a master passphrase is created.
3. **Zero Card Leakage in Plain Exports & Local Snapshots**:
   - Plain JSON and CSV exports strip `cards` unconditionally (`cards: []`) and include an explicit security notice.
   - Automatic local backup snapshots store payment cards **only** inside the encrypted `EncryptedPayload` envelope.

---

## 3. Code & Supply-Chain Safety Controls

- **Content Security Policy (CSP)**: Extension pages enforce `script-src 'self'; object-src 'self'; base-uri 'self';`.
- **Static CI Safety Gate**: `pnpm check:safety` (run automatically during `pnpm lint`) scans all production source files and fails if `fetch`, `XMLHttpRequest`, `WebSocket`, `eval`, `new Function`, or `.innerHTML =` are present.
- **Strict Input & Import Validation**: All imported JSON, CSV, and key-value TXT files are validated through Zod schemas (`previewImport`), checked against prototype pollution keys (`__proto__`, `constructor`, `prototype`), and rejected atomically if malformed.
- **Zero User-Data Logging**: No user field values, card numbers, or passphrases are ever passed to `console.*` or error messages.
