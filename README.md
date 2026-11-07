# Stashfill

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Framework: WXT](https://img.shields.io/badge/Framework-WXT-purple.svg)](https://wxt.dev)
[![Offline & Private](https://img.shields.io/badge/Privacy-100%25%20Offline-brightgreen.svg)](#privacy-guarantees)

> **Offline, no-login, privacy-first autofill and quick-paste browser extension.**  
> Save your personal profile data once, and fill or paste it into any form on any website in one click. Think FakeFiller, but for your real saved data instead of fake dummy text.

---

## Principles

1. **Offline and Local Only**: Zero network requests, zero telemetry, zero analytics, zero accounts, zero remote code. All data stays strictly on your local device.
2. **Ultra Fast**: Popup opens in under 100 ms with a minimal bundle size (~14 KB chunk). Content script is lightweight (~14 KB) and runs nothing heavy on the host page.
3. **Private by Design**: Minimal permissions, optional Web Crypto encrypted vault, fills only on explicit user action.
4. **Works Everywhere**: Traverses Shadow DOM, nested iframes, contenteditable, selects, radios, checkboxes, and handles React/Vue controlled input value tracker interception.
5. **Accessible & Keyboard-First**: Complete keyboard navigation (arrow keys, Enter to fill/copy, `/` to search), high contrast ARIA roles, dark/light theme, and multilingual support (English and বাংলা).
6. **Highest-Risk Data Protection**: Payment cards are stored **only** inside an AES-GCM 256-bit encrypted vault derived via PBKDF2 (250,000 iterations). Payment card fields are never auto-suggested or passively filled—only explicitly filled after an active confirmation dialog.

---

## Tech Stack

- **Framework**: [WXT](https://wxt.dev) (Manifest V3, unified codebase for Chrome, Edge, and Firefox)
- **Language**: TypeScript Strict Mode
- **UI**: [Preact](https://preactjs.com) (<4 KB footprint for instant popup loading)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Validation**: [Zod](https://zod.dev)
- **Unit Testing**: [Vitest](https://vitest.dev) + [Happy DOM](https://github.com/capricorn86/happy-dom)
- **E2E Testing**: [Playwright](https://playwright.dev)
- **Linting & Formatting**: ESLint + Prettier
- **Package Manager**: pnpm

---

## Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   Stashfill Extension                  │
├────────────────────┬───────────────────────────────────┤
│    Popup & UI      │ • Preact + Tailwind CSS           │
│                    │ • Keyboard navigation             │
│                    │ • English & বাংলা (Bangla) i18n   │
├────────────────────┼───────────────────────────────────┤
│    Heuristic DOM   │ • Autocomplete, ID, Name, Labels  │
│    Matcher         │ • Multilingual keyword heuristics │
│                    │ • Isolated payment card matcher   │
├────────────────────┼───────────────────────────────────┤
│    DOM Filler      │ • React / Vue _valueTracker bypass│
│    Engine          │ • Shadow DOM recursive walker     │
│                    │ • Selects, radios, contenteditable│
├────────────────────┼───────────────────────────────────┤
│    Encrypted       │ • AES-GCM 256-bit                 │
│    Vault           │ • PBKDF2 (SHA-256, 250k rounds)   │
│                    │ • In-memory session with auto-lock│
├────────────────────┼───────────────────────────────────┤
│    Storage Adapter │ • Abstract StorageAdapter API     │
│    Interface       │ • LocalStorageAdapter (Extension) │
│                    │ • MemoryStorageAdapter (Testing)  │
└────────────────────┴───────────────────────────────────┘
```

---

## Permissions Justification

| Permission       | Justification                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `storage`        | Required to store user profiles and encrypted vault strictly locally on-device.                            |
| `activeTab`      | Required to interact with the current tab when the user clicks the extension icon, popup, or context menu. |
| `contextMenus`   | Enables right-click "Stashfill: Fill entire form" and quick field paste into focused inputs.               |
| `clipboardWrite` | Enables click-to-copy stash items directly from the popup without requiring page paste.                    |

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 10

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/stashfill.git
cd stashfill

# Install dependencies
pnpm install
```

### Development

```bash
# Start Chrome MV3 dev server with hot module replacement
pnpm dev

# Start Firefox dev server
pnpm dev:firefox
```

### Building for Production

```bash
# Build Chrome MV3 extension (outputs to .output/chrome-mv3)
pnpm build

# Build Firefox extension (outputs to .output/firefox-mv2)
pnpm build:firefox

# Create distributable zip packages
pnpm zip
pnpm zip:firefox
```

### Running Tests

```bash
# Unit & integration tests (Vitest)
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format check
pnpm format:check
```

---

## Security & Privacy Guarantees

- **No Network Egress**: The extension manifest does not request any host permissions other than `activeTab` upon user gesture. No telemetry, error reporting, or tracking endpoints exist.
- **Master Passphrase Encryption**: Payment cards and secure notes are never written to unencrypted storage. Decryption keys are held in volatile session memory and wiped immediately upon auto-lock or lock action.
- **Safe Card Auto-Fill**: Payment card numbers are masked (`•••• •••• •••• 1234`) in the UI. Payment filling requires explicit user confirmation before populating card number, expiry, and CVV.
- **Zero Logging Policy**: User data values are strictly prohibited from being logged to `console.log` or error handlers anywhere in the codebase.

---

## License

[MIT](LICENSE) © 2026 Stashfill Contributors
