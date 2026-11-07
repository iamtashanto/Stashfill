## Description

Briefly describe the change, rationale, and problem it solves.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Performance optimization
- [ ] Documentation update
- [ ] i18n / Translation update

## Permission & Dependency Justification (Working Rule)

- Permissions added or modified: None / [Justify if any]
- Dependencies added or modified: None / [Justify if any]

## Verification Checklist

- [ ] `pnpm check:safety` passed (zero fetch, XHR, WebSocket, eval, or innerHTML)
- [ ] `pnpm lint` and `pnpm format:check` passed
- [ ] `pnpm typecheck` passed
- [ ] `pnpm test:coverage` passed (>= 80% coverage on core, storage, matcher, fill)
- [ ] `pnpm check:budgets` passed (< 60 KB gzip content script, < 50ms matcher, < 100ms popup)
- [ ] Never logged, printed, or sent user data anywhere
