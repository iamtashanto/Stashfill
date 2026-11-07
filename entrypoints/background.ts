import { browser } from 'wxt/browser';
import { StashRepository } from '../src/storage/StashRepository';
import { LocalStorageAdapter } from '../src/storage/LocalStorageAdapter';

export default defineBackground(() => {
  const storage = new LocalStorageAdapter();
  const repo = new StashRepository(storage);

  // Setup context menus
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.removeAll().then(() => {
      // Main context menu item for inputs
      browser.contextMenus.create({
        id: 'stashfill-root',
        title: 'Stashfill',
        contexts: ['editable'],
      });

      browser.contextMenus.create({
        id: 'stashfill-fill-form',
        parentId: 'stashfill-root',
        title: 'Fill whole form',
        contexts: ['editable'],
      });

      browser.contextMenus.create({
        id: 'stashfill-sep-1',
        parentId: 'stashfill-root',
        type: 'separator',
        contexts: ['editable'],
      });

      browser.contextMenus.create({
        id: 'stashfill-fill-name',
        parentId: 'stashfill-root',
        title: 'Fill Name',
        contexts: ['editable'],
      });

      browser.contextMenus.create({
        id: 'stashfill-fill-email',
        parentId: 'stashfill-root',
        title: 'Fill Email',
        contexts: ['editable'],
      });

      browser.contextMenus.create({
        id: 'stashfill-fill-phone',
        parentId: 'stashfill-root',
        title: 'Fill Phone',
        contexts: ['editable'],
      });

      browser.contextMenus.create({
        id: 'stashfill-fill-address',
        parentId: 'stashfill-root',
        title: 'Fill Address',
        contexts: ['editable'],
      });
    });
  });

  // Handle context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    const profile = await repo.getActiveProfile();
    if (!profile) return;

    const getVal = (key: string) => profile.fields.find((f) => f.key === key)?.value || '';

    switch (info.menuItemId) {
      case 'stashfill-fill-form': {
        await browser.tabs.sendMessage(tab.id, {
          type: 'FILL_PAGE_FORM',
          profile,
        });
        break;
      }
      case 'stashfill-fill-name': {
        const val = getVal('full_name') || `${getVal('first_name')} ${getVal('last_name')}`.trim();
        if (val) {
          await browser.tabs.sendMessage(tab.id, {
            type: 'FILL_ACTIVE_FIELD',
            target: { kind: 'profileField', fieldPath: 'fullName', value: val },
          });
        }
        break;
      }
      case 'stashfill-fill-email': {
        const val = getVal('email');
        if (val) {
          await browser.tabs.sendMessage(tab.id, {
            type: 'FILL_ACTIVE_FIELD',
            target: { kind: 'profileField', fieldPath: 'email', value: val },
          });
        }
        break;
      }
      case 'stashfill-fill-phone': {
        const val = getVal('phone') || getVal('mobile');
        if (val) {
          await browser.tabs.sendMessage(tab.id, {
            type: 'FILL_ACTIVE_FIELD',
            target: { kind: 'profileField', fieldPath: 'phone', value: val },
          });
        }
        break;
      }
      case 'stashfill-fill-address': {
        const val = getVal('address_line1');
        if (val) {
          await browser.tabs.sendMessage(tab.id, {
            type: 'FILL_ACTIVE_FIELD',
            target: { kind: 'profileField', fieldPath: 'address1', value: val },
          });
        }
        break;
      }
    }
  });
});
