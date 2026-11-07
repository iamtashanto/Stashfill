# Contributing to Stashfill

Thank you for your interest in contributing to Stashfill! We welcome bug fixes, documentation improvements, language translations, and accessible UI enhancements.

---

## Core Principles & Non-Negotiable Rules

1. **Offline & Zero-Network Only**: Stashfill must never make network requests, include analytics, connect to accounts, or load remote code. Every PR is checked by `pnpm check:safety`.
2. **Never Log User Data**: Do not log, print, or leak user values to console, files, or storage.
3. **Permission & Dependency Justification**: Never add a permission or dependency without a clear, documented justification in your PR description.
4. **Tests & Coverage**: Write unit and component tests together with your code. Core, storage, matcher, and fill modules must maintain `>= 80%` test coverage.
5. **Small Conventional Commits**: Use conventional commits (e.g. `feat:`, `fix:`, `test:`, `docs:`, `perf:`).

---

## Development Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/stashfill/stashfill.git
   cd stashfill
   ```

2. **Install dependencies**:

   ```bash
   pnpm install
   ```

3. **Start local development server with hot module reloading**:
   ```bash
   # Chrome
   pnpm dev

   # Firefox
   pnpm dev:firefox
   ```
   WXT will launch a test browser instance with the extension loaded.

---

## Running Checks Locally

Before submitting a Pull Request, run the full verification pipeline:

```bash
# 1. Code safety check (fails if fetch, XHR, WebSocket, or eval appear in source)
pnpm check:safety

# 2. Linter & Prettier check
pnpm lint
pnpm format:check

# 3. TypeScript typecheck
pnpm typecheck

# 4. Unit tests and coverage verification (>= 80%)
pnpm test:coverage

# 5. Production builds
pnpm build
pnpm build:firefox

# 6. Manifest structure linter
pnpm lint:manifest

# 7. Performance budgets (< 60 KB gzip, < 50ms matcher, < 100ms popup)
pnpm check:budgets
```

---

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).
