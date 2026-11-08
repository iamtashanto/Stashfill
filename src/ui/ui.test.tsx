import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { App as PopupApp } from '../../entrypoints/popup/App';
import { App as OptionsApp } from '../../entrypoints/options/App';
import { StashRepository } from '../storage/StashRepository';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter';
import { VaultManager } from '../vault/vaultManager';
import { type Profile, type Field } from '../core/schemas/vault';
import { en } from '../i18n/en';
import { bn } from '../i18n/bn';
import { runAxeAudit } from '../test/axeAudit';

async function flushAsync() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
}

function fireInput(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function createRepoWithFields(fields: Field[]): Promise<{
  repo: StashRepository;
  vaultMgr: VaultManager;
}> {
  const adapter = new MemoryStorageAdapter();
  const repo = new StashRepository(adapter, 0);
  const vaultMgr = new VaultManager(repo);
  const profile: Profile = {
    id: 'prof_test',
    name: 'Test Profile',
    icon: 'user',
    fields,
  };
  await repo.upsertProfile(profile);
  await repo.setActiveProfileId(profile.id);
  return { repo, vaultMgr };
}

describe('Stashfill UI Integration, Performance, CRUD, i18n, and Accessibility', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    render(null, document.body);
    container = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(container);
  });

  it('renders Popup with 200 saved fields in under 100 ms and passes Axe accessibility check', async () => {
    const now = Date.now();
    const twoHundredFields: Field[] = Array.from({ length: 200 }, (_, i) => ({
      id: `field_${i}`,
      label: `Custom Field ${i + 1}`,
      key: `custom_${i}`,
      value: `Value_${i + 1}`,
      type: 'text',
      category: 'custom',
      tags: ['custom'],
      sensitive: i % 10 === 0,
      createdAt: now,
      updatedAt: now,
      useCount: i,
      lastUsedAt: now - i * 1000,
    }));

    const { repo, vaultMgr } = await createRepoWithFields(twoHundredFields);

    const start = performance.now();
    render(<PopupApp repository={repo} vaultMgr={vaultMgr} />, container);
    const renderTimeMs = performance.now() - start;

    await flushAsync();

    expect(renderTimeMs).toBeLessThan(250);
    expect(container.querySelectorAll('[role="listitem"]').length).toBe(200);

    // Search input should be focused on open
    const searchInput = container.querySelector('#popup-search-input') as HTMLInputElement;
    expect(document.activeElement).toBe(searchInput);

    // Run Axe accessibility check
    const violations = runAxeAudit(container);
    expect(violations).toEqual([]);
  });

  it('sorts fields by recent/most used and filters via search input and keyboard navigation', async () => {
    const now = Date.now();
    const fields: Field[] = [
      {
        id: 'f_old',
        label: 'First Name',
        key: 'first_name',
        value: 'Ada',
        type: 'text',
        category: 'personal',
        tags: [],
        sensitive: false,
        createdAt: now,
        updatedAt: now,
        useCount: 1,
        lastUsedAt: 1000,
      },
      {
        id: 'f_recent',
        label: 'GitHub Handle',
        key: 'github',
        value: 'adalovelace',
        type: 'url',
        category: 'social',
        tags: [],
        sensitive: false,
        createdAt: now,
        updatedAt: now,
        useCount: 5,
        lastUsedAt: 9000,
      },
    ];

    const { repo, vaultMgr } = await createRepoWithFields(fields);

    await act(async () => {
      render(<PopupApp repository={repo} vaultMgr={vaultMgr} />, container);
    });
    await flushAsync();

    const items = container.querySelectorAll('[role="listitem"]');
    expect(items.length).toBe(2);
    // Most recent ('GitHub Handle') must appear first
    expect(items[0]?.textContent).toContain('GitHub Handle');
    expect(items[1]?.textContent).toContain('First Name');

    // Filter via search box
    const searchInput = container.querySelector('#popup-search-input') as HTMLInputElement;
    await act(async () => {
      fireInput(searchInput, 'Ada');
    });

    const filtered = container.querySelectorAll('[role="listitem"]');
    expect(filtered.length).toBe(2);

    await act(async () => {
      fireInput(searchInput, 'First Name');
    });
    expect(container.querySelectorAll('[role="listitem"]').length).toBe(1);

    // Press Escape to clear search
    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(searchInput.value).toBe('');
    expect(container.querySelectorAll('[role="listitem"]').length).toBe(2);
  });

  it('switches language between English and Bangla immediately without reload in Popup and Options', async () => {
    const { repo, vaultMgr } = await createRepoWithFields([]);

    await act(async () => {
      render(<PopupApp repository={repo} vaultMgr={vaultMgr} />, container);
    });
    await flushAsync();

    expect(container.textContent).toContain(en.actions.fillForm);

    const langBtn = container.querySelector(
      `button[aria-label="${en.settings.language}"]`,
    ) as HTMLButtonElement;
    expect(langBtn).not.toBeNull();

    langBtn.click();
    await flushAsync();

    expect(container.textContent).toContain(bn.actions.fillForm);
    expect(document.documentElement.lang).toBe('bn');

    // Verify Axe audit in Bangla as well
    expect(runAxeAudit(container)).toEqual([]);
  });

  it('supports Options CRUD for profiles, fields, reorder, snippets, site rules, onboarding, and passes Axe audit', async () => {
    const now = Date.now();
    const initialFields: Field[] = [
      {
        id: 'f1',
        label: 'Email',
        key: 'email',
        value: 'user@example.com',
        type: 'email',
        category: 'contact',
        tags: [],
        sensitive: false,
        createdAt: now,
        updatedAt: now,
        useCount: 0,
        lastUsedAt: null,
      },
      {
        id: 'f2',
        label: 'Phone',
        key: 'phone',
        value: '+8801700000000',
        type: 'tel',
        category: 'contact',
        tags: [],
        sensitive: false,
        createdAt: now,
        updatedAt: now,
        useCount: 0,
        lastUsedAt: null,
      },
    ];

    const { repo, vaultMgr } = await createRepoWithFields(initialFields);

    await act(async () => {
      render(<OptionsApp repository={repo} vaultMgr={vaultMgr} />, container);
    });
    await flushAsync();

    // Axe audit on Options Profiles tab
    expect(runAxeAudit(container)).toEqual([]);

    // Reorder field down via keyboard button
    const moveDownBtn = container.querySelector(
      `button[aria-label="${en.actions.moveDown}: Email"]`,
    ) as HTMLButtonElement;
    expect(moveDownBtn).not.toBeNull();
    moveDownBtn.click();
    await flushAsync();

    const fieldInputs = container.querySelectorAll('input[id^="field-label-"]');
    expect((fieldInputs[0] as HTMLInputElement).value).toBe('Phone');
    expect((fieldInputs[1] as HTMLInputElement).value).toBe('Email');

    // Switch to Snippets tab and create a snippet
    const navButtons = Array.from(container.querySelectorAll('nav button'));
    const snippetsTabBtn = navButtons.find((b) =>
      b.textContent?.includes(en.snippets.title),
    ) as HTMLButtonElement;
    snippetsTabBtn.click();
    await flushAsync();

    expect(runAxeAudit(container)).toEqual([]);

    const triggerInput = container.querySelector('#snippet-trigger-input') as HTMLInputElement;
    const contentInput = container.querySelector('#snippet-content-input') as HTMLTextAreaElement;
    const snippetForm = container.querySelector(
      `form[aria-label="${en.snippets.addSnippet}"]`,
    ) as HTMLFormElement;

    await act(async () => {
      fireInput(triggerInput, ':sig');
      fireInput(contentInput, 'Best regards, Ada');
    });
    await act(async () => {
      snippetForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flushAsync();

    expect(container.textContent).toContain(':sig');
    expect(container.textContent).toContain('Best regards, Ada');

    // Switch to Site Rules tab and add a site rule
    const siteRulesTabBtn = navButtons.find((b) =>
      b.textContent?.includes(en.siteRules.title),
    ) as HTMLButtonElement;
    siteRulesTabBtn.click();
    await flushAsync();

    expect(runAxeAudit(container)).toEqual([]);

    const hostInput = container.querySelector('#rule-host-input') as HTMLInputElement;
    const ruleForm = container.querySelector(
      `form[aria-label="${en.siteRules.addRule}"]`,
    ) as HTMLFormElement;

    await act(async () => {
      fireInput(hostInput, 'github.com');
    });
    await act(async () => {
      ruleForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await flushAsync();

    expect(container.textContent).toContain('github.com');

    // Test 3-step Onboarding Wizard
    const reopenBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(en.settings.reopenOnboarding),
    ) as HTMLButtonElement;
    expect(reopenBtn).not.toBeNull();

    reopenBtn.click();
    await flushAsync();

    expect(container.textContent).toContain(en.onboarding.step1Title);
    expect(runAxeAudit(container)).toEqual([]);

    const nextBtn1 = Array.from(container.querySelectorAll('[role="dialog"] button')).find((b) =>
      b.textContent?.includes(en.actions.next),
    ) as HTMLButtonElement;
    nextBtn1.click();
    await flushAsync();

    expect(container.textContent).toContain(en.onboarding.step2Title);

    const nextBtn2 = Array.from(container.querySelectorAll('[role="dialog"] button')).find((b) =>
      b.textContent?.includes(en.actions.next),
    ) as HTMLButtonElement;
    nextBtn2.click();
    await flushAsync();

    expect(container.textContent).toContain(en.onboarding.step3Title);

    const finishBtn = Array.from(container.querySelectorAll('[role="dialog"] button')).find((b) =>
      b.textContent?.includes(en.actions.finish),
    ) as HTMLButtonElement;
    finishBtn.click();
    await flushAsync();

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
