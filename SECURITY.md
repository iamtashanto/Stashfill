# Security Policy

The Stashfill project takes security, local vault encryption, and data isolation seriously. We welcome responsible security reports from researchers and community members.

---

## Supported Versions

Only the latest release of Stashfill receives security patches.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub issues, discussions, or social media.**

To report a vulnerability responsibly:

1. Email your report privately to **security@stashfill.org** (or use GitHub Private Vulnerability Reporting via the Security tab).
2. Include as much detail as possible:
   - Type of vulnerability (e.g. DOM injection, bypass of sensitive field confirmation, crypto issue)
   - Steps to reproduce or proof-of-concept
   - Impact assessment
   - Target browser(s) and operating system

### What You Can Expect

- **Initial Response**: Within 48 hours, acknowledging receipt of your report.
- **Triage & Assessment**: Within 5 business days, confirming whether the report is accepted or requires additional detail.
- **Remediation & Patch**: We will work with you to test and deploy a fix before any public disclosure.
- **Attribution**: If desired, we will credit your contribution in our release notes and `CHANGELOG.md`.

---

## Security Principles & Threat Model

For full details on our cryptographic choices (PBKDF2-SHA256 with >= 600,000 iterations, AES-GCM 256-bit encryption), attack surface mitigations, and offline isolation, please refer to [THREAT_MODEL.md](./THREAT_MODEL.md).
