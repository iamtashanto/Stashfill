# Stashfill Privacy Policy

**Effective Date:** November 7, 2026  
**Last Updated:** November 7, 2026

Stashfill is designed from the ground up as an offline, no-login, privacy-first browser extension. Our architecture ensures that **your personal data never leaves your device**.

---

## 1. Zero Network Transmission (Offline Only)

- **No Remote Servers**: Stashfill does not operate any backend servers, APIs, or databases.
- **No Telemetry or Analytics**: There are zero tracking pixels, telemetry probes, Google Analytics, error-tracking SDKs, or third-party libraries that make network requests.
- **Automated Verification**: Our Continuous Integration pipeline runs an automated static analysis gate (`scripts/check-code-safety.mjs`) on every pull request that fails the build if `fetch`, `XMLHttpRequest`, `WebSocket`, or dynamic script execution appears in production source code.

---

## 2. Local Storage and Encryption

- **All Data Stays On-Device**: Your profiles, custom fields, contact info, snippets, and site rules are stored locally on your device using the browser's local storage engine (`browser.storage.local`).
- **Encrypted Vault for Sensitive Data & Payment Cards**:
  - Payment cards are stored only inside an encrypted vault envelope.
  - Encryption is performed using the W3C Web Cryptography API (`crypto.subtle`) using **PBKDF2-SHA256** (with at least 600,000 iterations) and **AES-GCM 256-bit** encryption.
  - Your master passphrase is never stored on disk.
  - The decryption key is held only in ephemeral memory and auto-locks after your configured inactivity period (default: 5 minutes).
  - CVV codes are never persisted to disk unless you explicitly enable it in settings; otherwise, they are prompted at fill time and kept in memory only for that single action.

---

## 3. Extension Permissions & Justifications

Stashfill requests only the minimal permissions required to provide form filling:

| Permission                                              | Purpose & Technical Justification                                                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                               | Required to store your user profiles, custom fields, and encrypted vault locally on your device.                                                        |
| `activeTab`                                             | Granted only when you interact with Stashfill (click the extension icon, popup, or context menu) to fill or paste your saved data into the active page. |
| `scripting`                                             | Required to programmatically inject the form-filling script into the active page upon your explicit click or shortcut.                                  |
| `contextMenus`                                          | Provides right-click shortcuts to quickly paste a specific field or insert a text snippet into the active input.                                        |
| Optional Host Permissions (`http://*/*`, `https://*/*`) | **Not requested on install.** Only requested optionally at runtime if you explicitly enable the experimental inline-chip overlay feature.               |

---

## 4. No Data Sharing or Selling

We do not collect, buy, sell, share, or monetize your data. Because Stashfill has no accounts, no logins, and no servers, we have no access to your information.

---

## 5. Exports, Backups & Deletion

- **You Own Your Data**: You can export your data at any time in plain JSON (which automatically excludes sensitive payment cards for safety), CSV, or as a fully encrypted `.stashfill` backup file.
- **Complete Deletion**: Uninstalling Stashfill from your browser instantly and completely wipes all stored profiles, settings, and vault data from your local browser storage.

---

## 6. Contact

If you have questions regarding this Privacy Policy, please visit **https://stashfill.tashanto.com** or open an issue on our GitHub repository.
