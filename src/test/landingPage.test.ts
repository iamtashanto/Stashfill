import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();

describe('Static Landing Page & Privacy Policy Verification', () => {
  const indexPath = join(ROOT_DIR, 'docs/index.html');
  const privacyPath = join(ROOT_DIR, 'docs/privacy.html');

  it('verifies docs/index.html exists and meets semantic & SEO standards', () => {
    expect(existsSync(indexPath)).toBe(true);
    const html = readFileSync(indexPath, 'utf8');

    // Essential SEO & viewport tags
    expect(html).toContain('name="viewport"');
    expect(html).toContain('content="width=device-width, initial-scale=1.0"');
    expect(html).toMatch(/<meta[\s\S]*?name="description"/);
    expect(html).toMatch(/<meta[\s\S]*?property="og:title"/);
    expect(html).toMatch(/<meta[\s\S]*?property="og:description"/);
    expect(html).toMatch(/<meta[\s\S]*?name="theme-color"/);

    // Semantic landmarks
    expect(html).toContain('<header');
    expect(html).toContain('<main');
    expect(html).toContain('<nav');
    expect(html).toContain('<footer');
    expect(html).toContain('<h1');
    expect(html).toContain('<h2');

    // How it works 3 steps
    expect(html).toContain('How It Works in 3 Steps');
    expect(html).toContain('Step 1');
    expect(html).toContain('Save Once Locally');

    // Zero external tracking or remote scripts
    expect(html).not.toMatch(/<script\s+[^>]*src=["']https?:\/\//i);
    expect(html).not.toMatch(/google-analytics|googletagmanager|hotjar|mixpanel/i);

    // Links to Privacy Policy and GitHub
    expect(html).toContain('privacy.html');
    expect(html).toContain('https://github.com/stashfill/stashfill');
  });

  it('verifies docs/privacy.html exists and contains complete disclosures', () => {
    expect(existsSync(privacyPath)).toBe(true);
    const html = readFileSync(privacyPath, 'utf8');

    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Zero Network Transmission');
    expect(html).toContain('browser.storage.local');
    expect(html).toContain('AES-GCM 256-bit');
    expect(html).toContain('PBKDF2-SHA256');
    expect(html).toContain('activeTab');
    expect(html).toContain('privacy@stashfill.org');

    // Zero external trackers
    expect(html).not.toMatch(/<script\s+[^>]*src=["']https?:\/\//i);
  });
});
