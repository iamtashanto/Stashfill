# Stashfill

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Framework: WXT](https://img.shields.io/badge/Framework-WXT-purple.svg)](https://wxt.dev)
[![Privacy: 100% Offline](https://img.shields.io/badge/Privacy-100%25%20Offline-brightgreen.svg)](PRIVACY.md)
[![Coverage: >= 80%](https://img.shields.io/badge/Coverage-%3E%3D%2080%25-brightgreen.svg)](#quality--tests)

> **Offline, no-login, privacy-first autofill and quick-paste browser extension.**  
> Save your personal profile data once, and fill or paste it into any form on any website in one click. Think FakeFiller, but for your real saved data instead of fake dummy text.

---

## Demo Preview

<!-- DEMO GIF PLACEHOLDER -->

![Stashfill 1-Click Form Filling Demo](docs/assets/demo.gif)

---

## Principles

1. **Offline and Local Only**: Zero network requests, zero telemetry, zero analytics, zero accounts, zero remote code. All data stays strictly on your local device.
2. **Fast & Lightweight**: Popup opens in under 100 ms with 200 saved fields. Content script is lightweight (~32 KB gzipped) and adds zero overhead to the host page.
3. **Private by Design**: Minimal permissions, optional Web Crypto encrypted vault, fills only on explicit user action.
4. **Works Everywhere**: Traverses Shadow DOM, nested same-origin iframes, `contenteditable`, selects, radios, checkboxes, and handles React/Vue controlled input value tracker interception.
5. **Accessible & Keyboard-First**: Complete keyboard navigation (arrow keys, Enter to fill/copy, `/` to search, Esc), visible focus rings, dark/light theme, and multilingual support (English and বাংলা).
6. **Highest-Risk Data Protection**: Payment cards are stored **only** inside an AES-GCM 256-bit encrypted vault derived via PBKDF2-SHA256 (600,000 iterations). Payment card fields are never auto-suggested or passively filled—only explicitly filled after an active confirmation dialog.

> **Important Note**: Stashfill is an offline local quick-fill utility and **is not a replacement for your browser or OS wallet** (such as Apple Pay, Google Wallet, or built-in browser payment managers). See [THREAT_MODEL.md](THREAT_MODEL.md) for full details.

---

## Features

- **1-Click Form Filling**: Fill all matching fields on any page via Popup, shortcut (`Alt+Shift+F`), or right-click context menu.
- **Instant Search & Paste**: Open the popup (autofocused), filter 200+ fields in milliseconds, and hit Enter to copy or fill the focused input.
- **Multilingual Heuristic Matcher**: Intelligent matching engine supporting English and Bangla (বাংলা) field synonyms across 65 tested fixture scenarios.
- **Site-Specific Custom Rules**: Map custom fields on unusual forms; mappings survive dynamic ID changes.
- **Interactive Snippets**: Create reusable text snippets with variable expansion (`{{date}}`, `{{time}}`, `{{cursor}}`) and insert with trigger shortcuts (e.g. `;sig`).
- **Encrypted Vault Storage**: Sensitive fields and payment cards remain encrypted at rest with PBKDF2-SHA256 and AES-GCM 256. Auto-locks after inactivity.
- **Luhn Check & Card Validation**: Real-time Luhn algorithm validation, brand detection (Visa, Mastercard, Amex, Discover, JCB, Diners Club, UnionPay), split 4-box card input detection, and ephemeral one-time CVV.
- **15-Second Clipboard Auto-Clear**: Copying card numbers automatically clears your clipboard after 15 seconds to prevent accidental leakage.
- **Import & Export with Local History**: Export to plain JSON (cards stripped for safety), CSV, or password-protected encrypted backup (`.stashfill`), with rolling automatic local backup snapshots.

---

## Supported Browsers & Installation

Stashfill is packaged from a single Manifest V3 codebase for all major modern browsers:

### 1. Google Chrome & Chromium (Edge, Brave, Opera, Vivaldi)

- Download `stashfill-<version>-chrome.zip` from [Releases](https://github.com/stashfill/stashfill/releases).
- Unzip the file.
- Navigate to `chrome://extensions`, enable **Developer mode** (top right), and click **Load unpacked**.
- Select the unzipped folder.

### 2. Mozilla Firefox

- Download `stashfill-<version>-firefox.zip` from [Releases](https://github.com/stashfill/stashfill/releases).
- Navigate to `about:debugging#/runtime/this-firefox`.
- Click **Load Temporary Add-on...** and select `manifest.json` inside the unzipped folder (or install directly from Firefox Add-ons AMO once published).

### 3. Microsoft Edge

- Download `stashfill-<version>-edge.zip` (or chrome zip).
- Navigate to `edge://extensions`, enable **Developer mode**, and click **Load unpacked**.

### 4. Apple Safari (macOS & iOS)

- Safari is supported via Apple's official `xcrun safari-web-extension-converter`.
- Build the Chrome MV3 bundle and convert:
  ```bash
  pnpm build
  xcrun safari-web-extension-converter .output/chrome-mv3 --project-location ./safari-build
  ```
- See [BUILD.md](BUILD.md) for detailed Safari compilation steps.

---

## Permissions Justification

Stashfill strictly adheres to the principle of least privilege:

| Permission                                              | Technical Justification                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `storage`                                               | Store user profiles, custom fields, and the encrypted vault locally on the device.                                              |
| `activeTab`                                             | Access the current tab only when the user explicitly triggers an action (clicks popup icon, context menu, or presses shortcut). |
| `scripting`                                             | Programmatically inject the autofill script on-demand upon explicit user action.                                                |
| `contextMenus`                                          | Provide right-click shortcuts on input fields to fill forms or paste snippets.                                                  |
| Optional Host Permissions (`http://*/*`, `https://*/*`) | **Not requested on install.** Only requested at runtime if the user explicitly turns on the experimental inline-chip overlay.   |

---

## Development Setup

```bash
# Clone repository
git clone https://github.com/stashfill/stashfill.git
cd stashfill

# Install dependencies (frozen lockfile)
pnpm install

# Start development with hot reloading
pnpm dev              # Chrome
pnpm dev:firefox      # Firefox MV3
```

---

## Quality & Tests

Stashfill maintains strict CI verification gates:

```bash
# 1. Zero-network & code safety verification
pnpm check:safety

# 2. ESLint & Prettier
pnpm lint
pnpm format:check

# 3. TypeScript strict check
pnpm typecheck

# 4. Unit tests and coverage check (>= 80% required on core, storage, matcher, fill)
pnpm test:coverage

# 5. Production builds
pnpm build            # Chrome MV3
pnpm build:firefox    # Firefox MV3

# 6. Manifest structure linter
pnpm lint:manifest

# 7. Performance budgets (< 60 KB gzip, < 50ms matcher, < 100ms popup, zero leaks)
pnpm check:budgets

# 8. Playwright E2E test suite
pnpm e2e
```

---

## Frequently Asked Questions (FAQ)

<details>
<summary><strong>Does Stashfill send any data to external servers?</strong></summary>

**No. Absolutely never.** Stashfill has no servers, no accounts, no analytics, and no tracking scripts. A strict CI grep check fails our build if `fetch`, `XMLHttpRequest`, `WebSocket`, or dynamic script evaluation primitives are added to production code.
</details>

<details>
<summary><strong>How are payment cards kept secure?</strong></summary>

Payment cards are stored only inside an encrypted vault envelope using AES-GCM 256-bit encryption. The encryption key is derived using PBKDF2-SHA256 with 600,000 iterations from your master passphrase. The key lives only in volatile memory and auto-locks after inactivity.
</details>

<details>
<summary><strong>Does Stashfill work with React, Vue, and Angular forms?</strong></summary>

Yes. Stashfill overrides the native value setter prototype and synchronizes React's internal `_valueTracker` and Vue's `v-model` event listeners before dispatching `input`, `change`, and `blur` events with `bubbles: true`.
</details>

<details>
<summary><strong>Is cloud sync supported?</strong></summary>

Not in v1.0. Stashfill is strictly offline-first. End-to-end encrypted sync (via user-owned WebDAV or zero-knowledge cloud) is planned for future versions behind our abstract `StorageAdapter` interface. See [ROADMAP.md](ROADMAP.md).
</details>

---

## Documentation Links

- [BUILD.md](BUILD.md): Reproducible build steps for Chrome, Firefox, Edge, Safari, and sources zip.
- [PRIVACY.md](PRIVACY.md): Privacy policy and data isolation guarantees.
- [THREAT_MODEL.md](THREAT_MODEL.md): Security architecture, threat model, and mitigations.
- [MANUAL_TEST_CHECKLIST.md](MANUAL_TEST_CHECKLIST.md): Step-by-step manual test checklist.
- [SECURITY.md](SECURITY.md): Vulnerability disclosure policy.
- [CONTRIBUTING.md](CONTRIBUTING.md): Contribution guidelines and working rules.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md): Community code of conduct.
- [ROADMAP.md](ROADMAP.md): Future milestones and feature plans.
- [CHANGELOG.md](CHANGELOG.md): Release history.

---

## License

Stashfill is open-source software licensed under the [MIT License](LICENSE).
