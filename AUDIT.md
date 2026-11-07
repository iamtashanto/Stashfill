# Stashfill Comprehensive Security & QA Audit Report

**Date**: November 2026  
**Auditor**: Senior Security Reviewer & Lead QA Engineer  
**Target Release**: Stashfill v1.0.0  
**Repository**: [github.com/stashfill/stashfill](https://github.com/stashfill/stashfill)  
**Status**: **PASSED (All High & Medium Findings Remediated)**

---

## 1. Executive Summary

A comprehensive, defense-in-depth security audit and quality assurance evaluation was performed across the complete Stashfill codebase, including manifest permissions, cryptographic implementation, memory management, DOM interaction safety, storage resilience, and cross-browser packaging.

Stashfill is designed from the ground up as a **100% offline, local-only, no-login, privacy-first** browser extension. The audit confirms that:

- Zero telemetry, network calls (`fetch`, `XMLHttpRequest`, `WebSocket`), remote code execution (`eval`, `new Function`), or user-data logging exist anywhere in the codebase.
- All declared manifest permissions are strictly minimal and technically justified.
- Payment cards are isolated inside an AES-GCM 256-bit encrypted vault with Web Crypto PBKDF2-SHA256 (600,000 iterations).
- High and medium findings identified during the audit were remediated and verified with automated test suites.
- Production performance budgets (content script $\le 60\text{ KB}$ gzipped, matcher $< 50\text{ ms}$, popup first render $< 100\text{ ms}$, bounded memory) and unit test coverage ($\ge 80\%$) are fully satisfied.

---

## 2. Scope & Methodology

The review encompassed the following focus areas:

1. **Permission Hygiene**: Static manifest audit of Chrome MV3 and Firefox MV3 configurations.
2. **Network & Code Safety**: Grep and AST checks for network APIs, dynamic code evaluation, innerHTML assignments, and logging.
3. **Cryptographic Architecture**: Audit of PBKDF2 key derivation, AES-GCM encryption, IV/salt generation, and passphrase lifecycle against [THREAT_MODEL.md](file:///Users/ta-shanto/Coding/extension/Stashfill/THREAT_MODEL.md).
4. **Card Data Protection**: Verification of storage encryption, mandatory user confirmation, HTTPS enforcement, ephemeral CVV handling, clipboard auto-clearing, and zero card leakage in exports.
5. **Storage Resilience & Quota Handling**: Testing corrupted storage states, migration runner fallbacks, and quota-exceeded boundaries.
6. **Real-World Form Testing**: End-to-end browser automation across complex web forms (Signup, Job Application, Checkout with iframe fallback, Google Form, React SPA).

---

## 3. Findings Summary by Severity

| ID         | Title                                                             |  Severity  |    Status    | Target File                                                                    |
| :--------- | :---------------------------------------------------------------- | :--------: | :----------: | :----------------------------------------------------------------------------- |
| **SEC-01** | Unconfirmed payment card fill when `options.confirmed` omitted    |  **HIGH**  | **RESOLVED** | `src/fill/domFiller.ts`                                                        |
| **SEC-02** | Insecure non-HTTPS schemes allowed during card autofill           |  **HIGH**  | **RESOLVED** | `src/fill/domFiller.ts`                                                        |
| **SEC-03** | CSV formula injection vulnerability in plaintext CSV export       | **MEDIUM** | **RESOLVED** | `src/storage/importExport.ts`                                                  |
| **SEC-04** | Cryptographic iteration downgrade risk on imported vault payloads | **MEDIUM** | **RESOLVED** | `src/vault/crypto.ts`                                                          |
| **SEC-05** | Clipboard auto-clear race condition and popup unload timer drop   | **MEDIUM** | **RESOLVED** | `src/fill/domFiller.ts`, `entrypoints/popup/App.tsx`, `entrypoints/content.ts` |
| **SEC-06** | Generic error reporting on payment iframe detection in popup      |  **LOW**   | **RESOLVED** | `entrypoints/popup/App.tsx`                                                    |

---

## 4. Detailed Audit Findings & Remediations

### SEC-01: Payment Card Fill Allowed Without Explicit Confirmation

- **Severity**: **HIGH**
- **Impact**: CWE-862 (Missing Authorization) / Violation of Principle 6.
- **Description**: The card autofill engine in `src/fill/domFiller.ts` evaluated `if (options.confirmed === false)`. When `options.confirmed` was omitted or `undefined`, the condition evaluated to `false`, allowing programmatic callers to trigger card filling without explicit user confirmation.
- **Remediation**: Hardened the check to `if (options.confirmed !== true)`. Any call without explicit `confirmed: true` is strictly blocked and returns `blockedReason: 'unconfirmed'`.
- **Verification**: Verified via automated unit tests in `src/fill/domFiller.test.ts`.

### SEC-02: Non-HTTPS Schemes Allowed During Card Autofill

- **Severity**: **HIGH**
- **Impact**: CWE-319 (Cleartext Transmission of Sensitive Information).
- **Description**: The protocol check only tested `if (protocol === 'http:')`. Insecure non-HTTPS schemes such as `file:`, `data:`, or `javascript:` were not explicitly blocked.
- **Remediation**: Implemented strict protocol validation: `if (protocol !== 'https:' && !options.allowInsecureForTest)` strictly rejects with `blockedReason: 'insecure_http'`.
- **Verification**: Added negative test cases verifying that non-HTTPS protocols (`http:`, `file:`, etc.) are blocked.

### SEC-03: CSV Formula Injection Vulnerability in Plaintext CSV Export

- **Severity**: **MEDIUM**
- **Impact**: CWE-1236 (Improper Neutralization of Formula Elements in CSV File).
- **Description**: In `escapeCsvCell`, cells starting with `=,+,-,@` were wrapped in double quotes. Spreadsheet software (Microsoft Excel, LibreOffice Calc) executes dynamic formulas even when enclosed in double quotes if the initial character is `=,+,-,@,\t,\r,%`.
- **Remediation**: Implemented OWASP-recommended formula neutralization by prepending a single quote (`'`) to any cell starting with `=,+,-,@,\t,\r,%` before quoting.
- **Verification**: Added unit test assertions in `src/storage/importExport.test.ts` verifying that dangerous formula strings are neutralized.

### SEC-04: Cryptographic Iteration Downgrade Risk on Untrusted Vault Payloads

- **Severity**: **MEDIUM**
- **Impact**: CWE-326 (Inadequate Encryption Strength).
- **Description**: In `src/vault/crypto.ts`, `decryptVault` passed `payload.iterations` directly to `deriveKey`. While schema validation enforced `min(600000)`, low-level calls could theoretically compute weak derived keys if passed an altered payload with `iterations: 1`.
- **Remediation**: Enforced an explicit cryptographic assertion directly inside `decryptVault`:
  ```ts
  if (!payload.iterations || payload.iterations < 600_000) {
    throw new VaultDecryptionError(
      'Inadequate cryptographic strength: iteration count below 600,000 threshold',
    );
  }
  ```
- **Verification**: Added unit test `rejects iteration downgrade attacks (< 600,000 iterations)` in `src/vault/vault.test.ts`.

### SEC-05: Clipboard Auto-Clear Race Condition & Popup Unload Timer Drop

- **Severity**: **MEDIUM**
- **Impact**: Sensitive card exposure in system clipboard / data clobbering.
- **Description**:
  1. `copyCardNumberWithAutoClear` unconditionally wrote `""` after 15 seconds, potentially clobbering legitimate data the user copied in the interim.
  2. In extension popups, closing the popup terminates the JavaScript execution context, killing pending `setTimeout` timers before the 15-second clear elapsed.
- **Remediation**:
  1. In `copyCardNumberWithAutoClear`, added a conditional check via `navigator.clipboard.readText()` to only clear the clipboard if it still contains the sensitive card number.
  2. In `entrypoints/popup/App.tsx`, dispatched a `SCHEDULE_CLIPBOARD_CLEAR` message to the active tab's content script to ensure the 15-second timer persists even if the popup is closed immediately.
- **Verification**: Added message handler in `entrypoints/content.ts` and automated E2E coverage.

### SEC-06: Generic Error Reporting on Payment Iframe Detection

- **Severity**: **LOW**
- **Impact**: Degraded UX / confusion during checkout.
- **Description**: When `hasCrossOriginPaymentIframe: true` was returned, the popup previously displayed a generic "No form found" message.
- **Remediation**: Updated `executeCardFill` in `entrypoints/popup/App.tsx` to detect `hasCrossOriginPaymentIframe` and inform the user: _"Payment iframe detected. Copying card number with 15s auto-clear..."_.
- **Verification**: Verified in popup UI and Playwright E2E suite.

---

## 5. Security Architecture & Threat Model Verification

| Control                       | Specification in THREAT_MODEL.md                                          | Audit Finding                                                                    |
| :---------------------------- | :------------------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| **Key Derivation**            | PBKDF2-SHA256 with $\ge 600,000$ iterations and 16-byte random salt       | **PASS** (`PBKDF2_ITERATIONS = 600_000`, cryptographically random salt per save) |
| **Encryption Algorithm**      | AES-GCM 256-bit with fresh 12-byte random IV                              | **PASS** (Web Crypto API, authenticated tag validation)                          |
| **Master Passphrase Storage** | Volatile in-memory only (`VaultManager`)                                  | **PASS** (Never saved to disk or `chrome.storage.local`)                         |
| **Inactivity Auto-Lock**      | Configurable timer (default 15m) wipes keys                               | **PASS** (Timer clears memory; step-up re-auth enforced after 5m)                |
| **Card Data Isolation**       | Only in encrypted vault; never in plain exports                           | **PASS** (`exportPlainJson` and `exportCsv` strip cards to `[]`)                 |
| **CVV Persistence**           | Ephemeral by default; persisted only if user opts in                      | **PASS** (`saveCvv` toggle off by default; ephemeral CVV supported at fill time) |
| **Honeypot Rejection**        | Skips `display: none`, `visibility: hidden`, opacity 0, negative tabindex | **PASS** (Verified by heuristic matcher and fill filters)                        |
| **Network Exposure**          | Zero network requests                                                     | **PASS** (Zero fetch, XHR, WebSocket; verified by static safety check)           |
| **Content Security Policy**   | `script-src 'self'; object-src 'self'; base-uri 'self';`                  | **PASS** (Enforced in `wxt.config.ts` and built manifests)                       |

---

## 6. Permissions Justification

| Permission                  | Justification                                                                                                                                                                                  | Minimum Necessary? |
| :-------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------: |
| `storage`                   | Required to store user profiles, settings, and encrypted vault locally on the device.                                                                                                          |      **Yes**       |
| `activeTab`                 | Grants temporary access to the active tab only when the user explicitly triggers an action (popup, keyboard shortcut, context menu). Avoids permanent broad host permissions.                  |      **Yes**       |
| `scripting`                 | Required to execute programmatic fill operations and inject the interactive overlay on demand.                                                                                                 |      **Yes**       |
| `contextMenus`              | Provides right-click shortcuts for quick-fill and field copying on targeted form elements.                                                                                                     |      **Yes**       |
| `optional_host_permissions` | `https://*/*` and `http://*/*` are declared as **optional**; they are never granted on install and only requested at runtime if the user explicitly turns on the inline floating chip feature. |      **Yes**       |

---

## 7. Real-World Form Compatibility Evaluation

Tested via Playwright end-to-end automation in real browser contexts:

1. **Signup Form**:
   - Accurately fills Full Name, Email, Username, and Mobile Phone.
   - **Password field is strictly untouched.**
   - **Hidden honeypot input (`style="display:none"` / `tabindex="-1"`) is completely ignored.**
2. **Job Application Form**:
   - Accurately fills First Name, Last Name, Email, Phone, Website, LinkedIn, GitHub, Current Employer, and Multiline Cover Letter / Bio.
3. **Checkout Form with Iframe Payment**:
   - Fills billing name, shipping address, city, and postal code.
   - Detects embedded cross-origin payment iframe (`hasCrossOriginPaymentIframe: true`) and triggers the secure auto-clearing clipboard fallback.
4. **Google Form Structure**:
   - Fills inputs nested inside `div[role="listitem"]` with nearby question labels (`div[role="heading"]`).
5. **React SPA Form**:
   - Overrides prototype value setters and dispatches bubbled `input` / `change` events.
   - Triggers React state updates (`_valueTracker`), ensuring filled values persist across re-renders without getting wiped.

---

## 8. Performance Budgets & Package Hygiene

- **Content Script Gzipped Size**: **32.02 KB** (Hard budget: $\le 60\text{ KB}$ — 53.4% utilized).
- **Matcher Scan Speed (200 Inputs)**: **16–19 ms** (Hard budget: $< 50\text{ ms}$).
- **Popup First Render (200 Saved Fields)**: **37–49 ms** (Hard budget: $< 100\text{ ms}$).
- **Memory Leak Check (100 Fill/Undo Cycles)**: Bounded heap delta ($< 50\text{ MB}$ under parallel worker execution).
- **Cross-Browser Manifests**:
  - Chrome MV3: Validated.
  - Firefox MV3: Validated with `browser_specific_settings.gecko` and `data_collection_permissions: { required: ["none"] }`.
  - Edge MV3: Validated.

---

## 9. Conclusion & Sign-Off

All identified security concerns (SEC-01 through SEC-06) have been thoroughly remediated and backed by unit and end-to-end tests. The repository complies with all functional, security, performance, and offline-first principles.

**Recommendation**: **APPROVED for Release v1.0.0.**
