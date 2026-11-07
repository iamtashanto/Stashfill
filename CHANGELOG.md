# Changelog

All notable changes to Stashfill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-07

### Added

- Comprehensive security audit (`AUDIT.md`) with senior reviewer sign-off.
- Real-world forms verification suite in Playwright E2E: Signup, Job Application, Checkout with embedded payment iframe fallback, Google Form, and React SPA.
- Iteration downgrade protection in `decryptVault` enforcing $\ge 600,000$ iterations at the cryptographic core.
- OWASP-compliant CSV formula injection protection prepending `'` to spreadsheet formula trigger tokens (`=,+,-,@,\t,\r,%`).
- Cross-context 15-second clipboard auto-clear coordination between popup and active tab content script.
- Strict HTTPS requirement for payment card filling, blocking insecure HTTP and non-HTTPS origins.
- Mandatory explicit user confirmation gate for card autofill (`options.confirmed === true`).
- Production packages built for Chrome MV3, Edge MV3, Firefox MV3, and clean AMO source archive (`stashfill-sources.zip`).

## [0.1.0] - 2026-11-07

### Added

- **Offline Architecture**: Zero network calls, zero accounts, zero analytics, strictly local-only storage.
- **Cross-Browser MV3 Packaging**: Unified codebase for Chrome, Edge, and Firefox MV3 with WXT.
- **Encrypted Vault**: Master passphrase key derivation with PBKDF2-SHA256 (600,000 iterations) and AES-GCM 256-bit envelope encryption for cards and sensitive data.
- **Payment Card Protection**:
  - Luhn checksum validation and auto brand detection.
  - Split 4-box card number input detection.
  - Ephemeral in-memory CVV handling (never persisted unless user opts in).
  - 15-second auto-clearing clipboard for copied card numbers.
  - Step-up re-authentication requiring passphrase re-entry if unlocked more than 5 minutes ago.
- **Intelligent Heuristic Matcher**:
  - Weighted signal ranking (autocomplete, input type, tokenized name/id, labels, placeholder, aria-label, nearby text).
  - English and Bangla synonyms dictionaries.
  - Site-specific custom field mapping rules with DOM signature fallback.
- **Framework DOM Filler**:
  - Full support for React controlled inputs (`_valueTracker`), Vue `v-model`, open Shadow DOM, same-origin iframes, and `contenteditable`.
  - Visual green highlight on filled fields with 1-click Undo.
- **Accessible UI & i18n**:
  - Preact and Tailwind CSS popup opening in under 100 ms with 200 saved fields.
  - Full English and Bangla language support switchable live without page reload.
  - Light, Dark, and System theme support with WCAG AA contrast compliance.
  - Keyboard navigation (Up/Down, Enter, `/` to search, Esc).
- **Import, Export & Local Backups**:
  - Versioned Plain JSON export (cards automatically stripped for safety).
  - CSV export and dry-run preview import with merge conflict strategies.
  - Password-protected encrypted backup file (`.stashfill`).
  - Rolling local automatic backup snapshots with instant restore.
- **Security & Quality Gates**:
  - `check-code-safety` CI check enforcing zero network calls or dynamic code evaluation.
  - `check-budgets` script verifying content script <= 60 KB gzipped, matcher < 50ms, popup < 100ms, and zero memory leaks.
  - Playwright E2E suite and 108 unit tests with >= 80% coverage across core, storage, matcher, and fill.
