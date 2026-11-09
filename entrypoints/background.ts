import { browser } from 'wxt/browser';
import { StashRepository } from '../src/storage/StashRepository';
import { LocalStorageAdapter } from '../src/storage/LocalStorageAdapter';
import { VaultManager } from '../src/vault/vaultManager';
import { buildContextMenuDescriptors } from '../src/background/contextMenu';
import { createPersonalTemplate } from '../src/core/templates';
import type { Field } from '../src/core/schemas/vault';
import type { ExtensionMessage } from '../src/types/messages';

export default defineBackground(() => {
  const storage = new LocalStorageAdapter();
  const repo = new StashRepository(storage);
  const vaultManager = new VaultManager(repo);

  let rebuildTimeout: ReturnType<typeof setTimeout> | null = null;

  async function rebuildContextMenus(isHttpsPage = true) {
    try {
      await browser.contextMenus.removeAll();
      let profiles = await repo.getProfiles();
      if (profiles.length === 0) {
        const initial = createPersonalTemplate('Personal');
        await repo.upsertProfile(initial);
        await repo.setActiveProfileId(initial.id);
        profiles = [initial];
      }
      const settings = await repo.getSettings();
      const activeProf = await repo.getActiveProfile();
      const vaultInitialized = await vaultManager.isInitialized();
      const vaultUnlocked = vaultManager.isUnlocked();
      const cards = vaultUnlocked ? await vaultManager.getCards() : [];

      const descriptors = buildContextMenuDescriptors({
        profiles,
        settings,
        vaultInitialized,
        vaultUnlocked,
        cards,
        isHttpsPage,
        activeProfileId: activeProf?.id,
      });

      for (const desc of descriptors) {
        try {
          if (desc.type === 'separator') {
            browser.contextMenus.create({
              id: desc.id,
              parentId: desc.parentId,
              type: 'separator',
              contexts: desc.contexts as Parameters<
                typeof browser.contextMenus.create
              >[0]['contexts'],
            });
          } else {
            browser.contextMenus.create({
              id: desc.id,
              parentId: desc.parentId,
              title: desc.title || 'Stashfill',
              contexts: desc.contexts as Parameters<
                typeof browser.contextMenus.create
              >[0]['contexts'],
            });
          }
        } catch {
          // Ignore unsupported context types across browsers (e.g., action vs browser_action)
        }
      }
    } catch {
      // Ignore contextMenus errors during startup/teardown
    }
  }

  function scheduleMenuRebuild() {
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      void rebuildContextMenus(true);
    }, 150);
  }

  browser.runtime.onInstalled.addListener(() => {
    void rebuildContextMenus(true);
  });

  // Rebuild context menus immediately on service worker startup
  void rebuildContextMenus(true);

  // Subscribe to storage updates to rebuild context menu (debounced)
  storage.subscribe('stashfill_vault_primary', () => {
    scheduleMenuRebuild();
  });

  vaultManager.onLock(() => {
    scheduleMenuRebuild();
  });

  async function sendToTabOrFrame(
    tabId: number,
    message: ExtensionMessage,
    frameId?: number,
  ): Promise<unknown> {
    try {
      if (typeof frameId === 'number') {
        return await browser.tabs.sendMessage(tabId, message, { frameId });
      }
      return await browser.tabs.sendMessage(tabId, message);
    } catch {
      // Fallback: if content script is not yet injected, try injecting it via scripting.executeScript
      if (browser.scripting?.executeScript) {
        try {
          await browser.scripting.executeScript({
            target: typeof frameId === 'number' ? { tabId, frameIds: [frameId] } : { tabId },
            files: ['/content-scripts/content.js'],
          });
          // Small delay then retry sending the message
          await new Promise((resolve) => setTimeout(resolve, 80));
          if (typeof frameId === 'number') {
            return await browser.tabs.sendMessage(tabId, message, { frameId });
          }
          return await browser.tabs.sendMessage(tabId, message);
        } catch {
          // If script file execution fails, fallback to direct input manipulation for single field
        }
      }

      if (
        message.type === 'FILL_ACTIVE_FIELD' &&
        message.target.kind === 'profileField' &&
        browser.scripting?.executeScript
      ) {
        const val = message.target.value;
        try {
          await browser.scripting.executeScript({
            target: typeof frameId === 'number' ? { tabId, frameIds: [frameId] } : { tabId },
            func: (valueToInsert: string) => {
              let el = document.activeElement as HTMLElement | null;
              while (el && el.shadowRoot && el.shadowRoot.activeElement) {
                el = el.shadowRoot.activeElement as HTMLElement;
              }
              if (el) {
                if ('value' in el) {
                  const inputEl = el as HTMLInputElement | HTMLTextAreaElement;
                  const proto =
                    inputEl.tagName.toLowerCase() === 'textarea'
                      ? HTMLTextAreaElement.prototype
                      : HTMLInputElement.prototype;
                  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
                  if (setter) setter.call(inputEl, valueToInsert);
                  else inputEl.value = valueToInsert;
                  const tracker = (
                    inputEl as unknown as { _valueTracker?: { setValue: (v: string) => void } }
                  )._valueTracker;
                  if (tracker) tracker.setValue(valueToInsert);
                } else if (el.isContentEditable) {
                  el.textContent = valueToInsert;
                }
                el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
                el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
              }
            },
            args: [val],
          });
        } catch {
          // ignore injection error on restricted browser pages
        }
      }
      return null;
    }
  }

  // Handle native right-click context menu clicks
  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const menuId = String(info.menuItemId);

    if (
      menuId === 'stashfill-open-settings' ||
      menuId === 'stashfill-open-options' ||
      menuId === 'stashfill-unlock-vault'
    ) {
      const url = browser.runtime.getURL('/options.html');
      await browser.tabs.create({ url });
      return;
    }

    if (menuId.startsWith('stashfill-switch-profile:')) {
      const nextProfileId = menuId.replace('stashfill-switch-profile:', '');
      await repo.setActiveProfileId(nextProfileId);
      await rebuildContextMenus(true);
      return;
    }

    if (menuId === 'stashfill-open-popup') {
      const url = browser.runtime.getURL('/options.html');
      await browser.tabs.create({ url });
      return;
    }

    if (!tab?.id) return;
    const frameId = typeof info.frameId === 'number' ? info.frameId : undefined;
    const targetElementId = (info as unknown as { targetElementId?: number }).targetElementId;

    const profiles = await repo.getProfiles();
    const activeProfile = (await repo.getActiveProfile()) ?? profiles[0] ?? null;
    const siteRules = await repo.getSiteRules();
    let host = '';
    try {
      if (tab.url) host = new URL(tab.url).hostname.toLowerCase();
    } catch {
      host = '';
    }
    const matchingRule = siteRules.find((r) => r.host.toLowerCase() === host) ?? null;

    if (menuId.startsWith('stashfill-field:')) {
      const parts = menuId.split(':');
      const profileId = parts[1];
      const fieldId = parts[2];
      const prof = profiles.find((p) => p.id === profileId) ?? activeProfile;
      const field = prof?.fields.find((f) => f.id === fieldId);
      if (prof && field && field.value) {
        await repo.recordFieldUsage(prof.id, field.id);
        await sendToTabOrFrame(
          tab.id,
          {
            type: 'FILL_ACTIVE_FIELD',
            target: {
              kind: 'profileField',
              fieldPath: field.key,
              value: field.value,
              label: field.label,
              sensitive: field.sensitive,
            },
            targetElementId,
          },
          frameId,
        );
      }
      return;
    }

    if (menuId === 'stashfill-fill-form' && activeProfile) {
      const ruleProfile = matchingRule?.profileId
        ? (profiles.find((p) => p.id === matchingRule.profileId) ?? activeProfile)
        : activeProfile;
      await sendToTabOrFrame(
        tab.id,
        {
          type: 'FILL_PAGE_FORM',
          profile: ruleProfile,
          mode: 'all',
          siteRule: matchingRule,
        },
        frameId,
      );
      return;
    }

    if (menuId.startsWith('stashfill-fill-profile:')) {
      const targetProfId = menuId.replace('stashfill-fill-profile:', '');
      const targetProf = profiles.find((p) => p.id === targetProfId);
      if (targetProf) {
        await sendToTabOrFrame(
          tab.id,
          {
            type: 'FILL_PAGE_FORM',
            profile: targetProf,
            mode: 'all',
            siteRule: matchingRule,
          },
          frameId,
        );
      }
      return;
    }

    if (menuId === 'stashfill-fill-empty' && activeProfile) {
      const ruleProfile = matchingRule?.profileId
        ? (profiles.find((p) => p.id === matchingRule.profileId) ?? activeProfile)
        : activeProfile;
      await sendToTabOrFrame(
        tab.id,
        {
          type: 'FILL_PAGE_FORM',
          profile: ruleProfile,
          mode: 'emptyOnly',
          siteRule: matchingRule,
        },
        frameId,
      );
      return;
    }

    if (menuId === 'stashfill-undo') {
      await sendToTabOrFrame(tab.id, { type: 'UNDO_LAST_FILL' }, frameId);
      return;
    }

    if (menuId === 'stashfill-more' || menuId.startsWith('stashfill-more-profile:')) {
      const snippets = await repo.getSnippets();
      await sendToTabOrFrame(
        tab.id,
        {
          type: 'OPEN_QUICK_PICKER',
          profiles,
          snippets,
          activeProfileId: activeProfile?.id ?? '',
        },
        frameId,
      );
      return;
    }

    if (menuId === 'stashfill-map-field') {
      await sendToTabOrFrame(
        tab.id,
        {
          type: 'START_MAP_FIELD_MODE',
          profiles,
          activeProfileId: activeProfile?.id ?? '',
          targetElementId,
        },
        frameId,
      );
      return;
    }

    if (menuId === 'stashfill-save-selection' && info.selectionText) {
      await sendToTabOrFrame(
        tab.id,
        {
          type: 'OPEN_SAVE_SELECTION_MODAL',
          selectedText: info.selectionText,
          profiles,
          activeProfileId: activeProfile?.id ?? '',
        },
        frameId,
      );
      return;
    }

    if (menuId.startsWith('stashfill-card:')) {
      const cardId = menuId.split(':')[1];
      if (!vaultManager.isUnlocked() || !cardId) return;
      const card = await vaultManager.getCard(cardId);
      if (card) {
        await sendToTabOrFrame(
          tab.id,
          {
            type: 'REQUEST_CARD_FILL_CONFIRMATION',
            card,
            origin: host || tab.url || '',
          },
          frameId,
        );
      }
    }
  });

  // Handle keyboard shortcuts from browser.commands
  if (browser.commands?.onCommand) {
    browser.commands.onCommand.addListener(async (command) => {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) return;

      const profiles = await repo.getProfiles();
      const activeProfile = (await repo.getActiveProfile()) ?? profiles[0] ?? null;
      const snippets = await repo.getSnippets();

      if (command === 'open-quick-picker') {
        await sendToTabOrFrame(activeTab.id, {
          type: 'OPEN_QUICK_PICKER',
          profiles,
          snippets,
          activeProfileId: activeProfile?.id ?? '',
        });
      } else if (command === 'fill-all-fields' && activeProfile) {
        const siteRules = await repo.getSiteRules();
        let host = '';
        try {
          if (activeTab.url) host = new URL(activeTab.url).hostname.toLowerCase();
        } catch {
          host = '';
        }
        const matchingRule = siteRules.find((r) => r.host.toLowerCase() === host) ?? null;
        await sendToTabOrFrame(activeTab.id, {
          type: 'FILL_PAGE_FORM',
          profile: activeProfile,
          mode: 'all',
          siteRule: matchingRule,
        });
      } else if (command === 'fill-payment-card') {
        if (!vaultManager.isUnlocked()) return;
        const cards = await vaultManager.getCards();
        if (cards[0]) {
          await sendToTabOrFrame(activeTab.id, {
            type: 'REQUEST_CARD_FILL_CONFIRMATION',
            card: cards[0],
            origin: activeTab.url || '',
          });
        }
      }
    });
  }

  // Handle messages from content script (saving selection or saving field mapping)
  browser.runtime.onMessage.addListener((rawMsg: unknown, _sender, sendResponse) => {
    const msg = rawMsg as ExtensionMessage;
    if (!msg || !msg.type) return;

    if (msg.type === 'SAVE_SELECTION_TO_PROFILE') {
      void (async () => {
        const profile = (await repo.getProfile(msg.profileId)) ?? (await repo.getActiveProfile());
        if (!profile) {
          sendResponse({ success: false });
          return;
        }
        const now = Date.now();
        const newField: Field = {
          id: `f_${now}_${Math.random().toString(36).slice(2, 7)}`,
          label: msg.label.trim() || 'Saved Selection',
          key: `custom_${now}`,
          value: msg.value,
          type: 'text',
          category: msg.category || 'custom',
          tags: [msg.category || 'custom'],
          sensitive: false,
          createdAt: now,
          updatedAt: now,
          useCount: 0,
          lastUsedAt: now,
        };
        await repo.upsertProfile({
          ...profile,
          fields: [newField, ...profile.fields],
        });
        sendResponse({ success: true });
      })();
      return true;
    }

    if (msg.type === 'SAVE_FIELD_MAPPING') {
      void (async () => {
        const host = msg.host.toLowerCase();
        const rules = await repo.getSiteRules();
        const existing = rules.find((r) => r.host.toLowerCase() === host);
        if (existing) {
          const filtered = (existing.fieldMappings || []).filter((m) => m.id !== msg.mapping.id);
          await repo.upsertSiteRule({
            ...existing,
            fieldMappings: [...filtered, msg.mapping],
          });
        } else {
          await repo.upsertSiteRule({
            id: `rule_${Date.now()}`,
            host,
            autoFillRule: 'ask',
            disabledFields: [],
            fieldMappings: [msg.mapping],
          });
        }
        sendResponse({ success: true });
      })();
      return true;
    }
  });
});
