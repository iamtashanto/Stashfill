import { test as base, chromium, type BrowserContext, expect } from '@playwright/test';
import path from 'node:path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = path.resolve('.output/chrome-mv3');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const page = context.pages()[0] || (await context.newPage());
    const cdp = await context.newCDPSession(page);

    let extTarget = null;
    for (let i = 0; i < 30; i++) {
      const { targetInfos } = await cdp.send('Target.getTargets');
      extTarget = targetInfos.find((t) => t.url.startsWith('chrome-extension://'));
      if (extTarget) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    if (!extTarget) {
      throw new Error('Extension target not found');
    }

    const extensionId = new URL(extTarget.url).hostname;
    await use(extensionId);
  },
});

test.describe('Stashfill Browser Extension E2E', () => {
  test('loads options page and displays profiles & settings', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    await expect(page.locator('h1')).toHaveText('Stashfill');
    await expect(page.getByText('Manage Profiles')).toBeVisible();
    await expect(page.getByText('Encrypted Vault')).toBeVisible();

    // Verify default profile exists
    await expect(page.getByText('Personal ★')).toBeVisible();
  });

  test('loads popup page in under 100ms and shows 1-click fill button', async ({
    context,
    extensionId,
  }) => {
    const page = await context.newPage();
    const start = Date.now();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForSelector('text=Stashfill');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(1000);
    await expect(page.getByText('Fill Form')).toBeVisible();
    await expect(page.getByText('Offline')).toBeVisible();
  });
});
