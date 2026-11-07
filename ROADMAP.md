# Stashfill Roadmap

This roadmap outlines the milestones and future plans for Stashfill.
In keeping with our principles, **Version 1.0 focuses exclusively on being the fastest, most reliable offline-only autofill and quick-paste extension**.

---

## Current Release: v0.1.0 (MVP / Launch)

- [x] Offline, local-only architecture with zero network requests or telemetry.
- [x] Preact + Tailwind CSS fast UI (< 100 ms popup open with 200 fields).
- [x] WXT cross-browser packaging for Chrome, Edge, and Firefox (MV3).
- [x] AES-GCM 256-bit encrypted vault with PBKDF2 (>= 600,000 iterations).
- [x] Strict payment card protection with Luhn validation, ephemeral CVV, and 15-second clipboard wipe.
- [x] Pure heuristic matcher with English and Bangla synonyms dictionaries (65 fixtures tested).
- [x] Multi-framework input support (React controlled inputs, Vue `v-model`, Shadow DOM, same-origin iframes, contenteditable).
- [x] Import/Export (Plain JSON, CSV, and Encrypted backup) with rolling local backups.
- [x] Accessible keyboard navigation and high-contrast WCAG AA compliance.

---

## Planned for Future Versions (Not Started)

The following items are planned post-v1.0. All storage is maintained behind a clean `StorageAdapter` interface so that sync and cloud adapters can be added without modifying core autofill logic.

### 1. End-to-End Encrypted Cloud Sync (Planned - Not Started)

- Optional opt-in sync across devices via user-provided WebDAV, Self-Hosted CouchDB, or zero-knowledge E2EE cloud sync.
- Zero plaintext leaves the client: everything remains sealed inside the AES-GCM 256 vault envelope.

### 2. Team & Workspace Sharing (Planned - Not Started)

- Multi-user team profiles (e.g. shared company billing addresses, support snippet libraries).
- Granular role-based access control and encrypted group keys.

### 3. Stashfill Pro Tier (Planned - Not Started)

- Commercial tier for enterprise fleet deployments, centralized administrative policies, and priority enterprise support.
- Core Stashfill extension remains 100% free, open-source, and offline for individual users.

### 4. Native Safari App Store Release (Planned - Not Started)

- Package and notarize macOS and iOS Safari extensions via Xcode converter for the Mac App Store and iOS App Store.

### 5. Additional Language Synonyms (Community Driven)

- Spanish, German, French, Hindi, and Arabic synonym dictionaries for international localized form fields.
