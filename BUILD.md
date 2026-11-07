# Reproducible Build Instructions for Stashfill

This document provides step-by-step, reproducible instructions for building the Stashfill browser extension from source code. This is intended for store reviewers (such as Mozilla Add-ons / AMO), security auditors, and developers.

---

## 1. Prerequisites and Environment

- **Operating System**: macOS, Linux (Ubuntu 22.04+), or Windows (with WSL2 or PowerShell).
- **Node.js**: `v20.x` or `v22.x` (LTS recommended).
- **Package Manager**: `pnpm` version `9.x` (`corepack enable && corepack prepare pnpm@9 --activate`).

Verify your environment:

```bash
node -v   # Should output v20+ or v22+
pnpm -v   # Should output 9.x
```

---

## 2. Unpack Sources

If you received the source bundle `stashfill-sources.zip`:

```bash
unzip stashfill-sources.zip -d stashfill
cd stashfill
```

---

## 3. Install Dependencies (Offline Reproducible)

Install locked dependencies:

```bash
pnpm install --frozen-lockfile
```

---

## 4. Run Verification Suite

Verify code safety, types, linting, unit tests, and performance budgets:

```bash
# 1. Code Safety Check: confirms zero network primitives (fetch, XHR, WebSocket, eval)
pnpm check:safety

# 2. Typecheck
pnpm typecheck

# 3. Unit test suite with >= 80% coverage check
pnpm test:coverage

# 4. Performance budget verification (< 60 KB gzip, < 50ms matcher, < 100ms popup)
pnpm check:budgets
```

---

## 5. Build Extension Targets

### Target A: Chrome & Chromium-based Browsers (MV3)

```bash
pnpm build
# Outputs unpacked extension to: .output/chrome-mv3
# Zip package:
pnpm zip
# Creates: .output/stashfill-<version>-chrome.zip
```

### Target B: Mozilla Firefox (MV3)

```bash
pnpm build:firefox
# Outputs unpacked extension to: .output/firefox-mv3
# Zip package:
pnpm zip:firefox
# Creates: .output/stashfill-<version>-firefox.zip
```

### Target C: Microsoft Edge (MV3)

```bash
pnpm build:edge
# Outputs unpacked extension to: .output/edge-mv3
# Zip package:
pnpm zip:edge
# Creates: .output/stashfill-<version>-edge.zip
```

---

## 6. Safari Support (Optional via Converter)

Stashfill is built on standard WebExtension Manifest V3 APIs. Support for macOS and iOS Safari is achieved via Apple's official `safari-web-extension-converter`:

```bash
# Build the Chrome MV3 bundle first
pnpm build

# Run Apple's Xcode converter tool (requires macOS with Xcode 15+)
xcrun safari-web-extension-converter .output/chrome-mv3 \
  --project-location ./safari-build \
  --app-name "Stashfill" \
  --bundle-identifier "org.stashfill.safari"
```

The generated Xcode project can then be opened in Xcode, signed, and run natively in Safari.

---

## 7. Reviewer Notes for Firefox AMO

1. **Zero External Network Calls**: The extension operates strictly locally on the user's device. No telemetry, no analytics, no external scripts or remote fonts are used.
2. **Deterministic Build**: Running `pnpm build:firefox` compiles the TypeScript and Preact code using Vite into `.output/firefox-mv3`.
3. **Data Collection Declaration**: Stashfill declares `data_collection_permissions: { required: ["none"] }` in `manifest.json`.
4. **Encryption Implementation**: Encrypted vault storage uses standard W3C Web Cryptography API (`crypto.subtle`) with PBKDF2 (600,000 iterations) and AES-GCM 256-bit encryption. No third-party proprietary crypto binaries are included.
