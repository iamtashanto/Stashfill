import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { rankFieldCandidates } from '../matcher';
import { fillFormWithProfile, undoLastFill } from '../fill';
import { createPersonalTemplate } from '../core/templates';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter';
import { StashRepository } from '../storage/StashRepository';
import { VaultManager } from '../vault/vaultManager';
import { render, h } from 'preact';
import { App as PopupApp } from '../../entrypoints/popup/App';

const ROOT_DIR = process.cwd();

describe('Performance Budgets Verification', () => {
  it('enforces content script bundle size <= 60 KB gzipped', () => {
    const contentScriptPath = join(ROOT_DIR, '.output/chrome-mv3/content-scripts/content.js');
    expect(existsSync(contentScriptPath)).toBe(true);

    const raw = readFileSync(contentScriptPath);
    const gzipped = gzipSync(raw);

    const maxGzipBytes = 60 * 1024;
    expect(gzipped.length).toBeLessThanOrEqual(maxGzipBytes);
  });

  it('scans 200 inputs in under 50 ms', () => {
    const sampleInputs = [
      { name: 'first_name', autocomplete: 'given-name', placeholder: 'First name' },
      { name: 'last_name', autocomplete: 'family-name', placeholder: 'Last name' },
      { name: 'email', type: 'email', autocomplete: 'email' },
      { name: 'phone', type: 'tel', autocomplete: 'tel' },
      { name: 'address1', autocomplete: 'address-line1' },
      { name: 'city', autocomplete: 'address-level2' },
      { name: 'state', autocomplete: 'address-level1' },
      { name: 'postal_code', autocomplete: 'postal-code' },
      { name: 'card_number', autocomplete: 'cc-number' },
      { name: 'exp_month', autocomplete: 'cc-exp-month' },
    ];

    const twoHundredInputs = Array.from({ length: 200 }, (_, i) => {
      const base = sampleInputs[i % sampleInputs.length]!;
      return { ...base, id: `input_${i}` };
    });

    // Warmup
    for (let i = 0; i < 20; i++) {
      rankFieldCandidates(twoHundredInputs[i]!);
    }

    const start = performance.now();
    for (const input of twoHundredInputs) {
      rankFieldCandidates(input);
    }
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThan(50);
  });

  it('renders Popup with 200 saved fields under 100 ms', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const twoHundredFields = Array.from({ length: 200 }, (_, i) => ({
      id: `f_${i}`,
      label: `Field ${i + 1}`,
      key: `custom_${i}`,
      value: `Value ${i + 1}`,
      type: 'text' as const,
      category: 'custom',
      tags: ['custom'],
      sensitive: i % 10 === 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      useCount: i,
      lastUsedAt: Date.now(),
    }));

    const testProfile = createPersonalTemplate('Benchmark');
    testProfile.fields = twoHundredFields;

    const memoryStorage = new MemoryStorageAdapter();
    const repo = new StashRepository(memoryStorage, 0);
    await repo.upsertProfile(testProfile);
    await repo.setActiveProfileId(testProfile.id);
    const vaultMgr = new VaultManager(repo);

    const start = performance.now();
    render(h(PopupApp, { repository: repo, vaultMgr }), container);
    const elapsedMs = performance.now() - start;

    expect(elapsedMs).toBeLessThan(100);
  });

  it('verifies bounded memory without leaks after 100 fill/undo cycles', () => {
    document.body.innerHTML = `
      <form id="benchmark-form">
        <input id="name" name="first_name" autocomplete="given-name" />
        <input id="surname" name="last_name" autocomplete="family-name" />
        <input id="mail" name="email" type="email" autocomplete="email" />
        <input id="phone" name="phone" type="tel" autocomplete="tel" />
        <input id="addr" name="address" autocomplete="address-line1" />
        <input id="city" name="city" autocomplete="address-level2" />
        <input id="state" name="state" autocomplete="address-level1" />
        <input id="zip" name="postal_code" autocomplete="postal-code" />
      </form>
    `;

    const profile = createPersonalTemplate('MemProfile');
    const initialMem = process.memoryUsage().heapUsed;

    for (let i = 0; i < 100; i++) {
      fillFormWithProfile(document, profile, { mode: 'all' });
      undoLastFill();
    }

    const finalMem = process.memoryUsage().heapUsed;
    const growthDeltaMb = (finalMem - initialMem) / (1024 * 1024);

    // Assert heap growth over 100 full DOM fill/undo cycles stays bounded (< 50 MB)
    expect(growthDeltaMb).toBeLessThan(50);
  });
});
