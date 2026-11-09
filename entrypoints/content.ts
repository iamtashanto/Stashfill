import {
  fillFormWithProfile,
  fillElement,
  fillPaymentCard,
  undoLastFill,
  extractFieldAttributes,
  isFillable,
  collectFillableElements,
  copyCardNumberWithAutoClear,
  expandSnippetVariables,
  findMatchingSnippetTrigger,
  type FillableElement,
  type FillableCard,
} from '../src/fill';
import {
  matchProfileField,
  rankFieldCandidates,
  resolveProfileValue,
  computeFieldSignature,
} from '../src/matcher';
import type { Profile, Snippet, SiteRule, Settings } from '../src/core/schemas/vault';
import type { ExtensionMessage } from '../src/types/messages';
import { LocalStorageAdapter } from '../src/storage/LocalStorageAdapter';
import { StashRepository } from '../src/storage/StashRepository';
import { browser } from 'wxt/browser';

const OVERLAY_CSS = `
  :host {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Bengali", sans-serif;
    color: #0f172a;
  }
  .sf-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  .sf-modal {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 400px;
    padding: 16px;
    box-sizing: border-box;
    font-size: 13px;
  }
  .sf-title {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #0f172a;
  }
  .sf-input, .sf-select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 12px;
    margin-bottom: 8px;
    outline: none;
  }
  .sf-input:focus, .sf-select:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.25);
  }
  .sf-list {
    max-height: 220px;
    overflow-y: auto;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .sf-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-bottom: 1px solid #f1f5f9;
    padding: 7px 10px;
    font-size: 12px;
    cursor: pointer;
    color: #0f172a;
  }
  .sf-item:hover, .sf-item[data-active="true"] {
    background: #f0f9ff;
    color: #0369a1;
  }
  .sf-badge {
    font-size: 10px;
    background: #e2e8f0;
    color: #334155;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .sf-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
  }
  .sf-btn {
    border: 1px solid #cbd5e1;
    background: #ffffff;
    color: #334155;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .sf-btn-primary {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }
  .sf-btn-danger {
    background: #e11d48;
    border-color: #e11d48;
    color: #ffffff;
  }
  .sf-chip {
    position: fixed;
    z-index: 2147483645;
    background: #0284c7;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.18);
  }
`;

export default defineContentScript({
  matches: ['*://*/*'],
  allFrames: true,
  runAt: 'document_idle',
  main() {
    let lastRightClickedElement: FillableElement | null = null;
    let lastFocusedElement: FillableElement | null = null;
    let cachedProfiles: Profile[] = [];
    let cachedSnippets: Snippet[] = [];
    let cachedSiteRules: SiteRule[] = [];
    let cachedSettings: Settings | null = null;

    const repo = new StashRepository(new LocalStorageAdapter());

    async function refreshCache() {
      try {
        const [profiles, snippets, rules, settings] = await Promise.all([
          repo.getProfiles(),
          repo.getSnippets(),
          repo.getSiteRules(),
          repo.getSettings(),
        ]);
        cachedProfiles = profiles;
        cachedSnippets = snippets;
        cachedSiteRules = rules;
        cachedSettings = settings;
      } catch {
        // ignore storage errors in restricted contexts
      }
    }

    // Per-site "always auto-fill": runs once after load, only into empty, non-sensitive fields
    async function runAutoFillForSite() {
      await refreshCache();
      if (window.self !== window.top) return;
      const host = window.location.hostname.toLowerCase();
      const rule = cachedSiteRules.find((r) => r.host.toLowerCase() === host);
      if (!rule || rule.autoFillRule !== 'always') return;
      const profile =
        cachedProfiles.find((p) => p.id === rule.profileId) ??
        cachedProfiles.find((p) => p.id === cachedSettings?.defaultProfileId) ??
        cachedProfiles[0];
      if (!profile) return;
      const safeProfile = { ...profile, fields: profile.fields.filter((f) => !f.sensitive) };
      const attempt = () => {
        try {
          fillFormWithProfile(document, safeProfile, { mode: 'emptyOnly', siteRule: rule });
        } catch {
          // never break the host page
        }
      };
      attempt();
      // Single retry for SPAs that render forms shortly after load
      setTimeout(attempt, 1200);
    }

    void runAutoFillForSite();

    // Closed Shadow DOM UI host so page CSS cannot break Stashfill overlays
    let shadowRoot: ShadowRoot | null = null;
    let uiContainer: HTMLDivElement | null = null;

    function ensureClosedShadowContainer(): HTMLDivElement {
      if (uiContainer && shadowRoot) return uiContainer;
      const host = document.createElement('div');
      host.setAttribute('data-stashfill-overlay', 'true');
      shadowRoot = host.attachShadow({ mode: 'closed' });
      const style = document.createElement('style');
      style.textContent = OVERLAY_CSS;
      uiContainer = document.createElement('div');
      shadowRoot.appendChild(style);
      shadowRoot.appendChild(uiContainer);
      (document.body || document.documentElement).appendChild(host);
      return uiContainer;
    }

    function clearOverlay() {
      if (uiContainer) {
        uiContainer.replaceChildren();
      }
    }

    function isCrossOriginSubframe(): boolean {
      if (typeof window === 'undefined' || window.self === window.top) return false;
      try {
        return (
          !window.top?.location?.origin || window.top.location.origin !== window.location.origin
        );
      } catch {
        return true;
      }
    }

    async function requiresSensitiveSiteConfirm(): Promise<boolean> {
      const origin = window.location.origin;
      const confirmedList = cachedSettings?.confirmedSensitiveOrigins || [];
      return !confirmedList.includes(origin);
    }

    async function markSensitiveSiteConfirmed(): Promise<void> {
      const origin = window.location.origin;
      const confirmedList = cachedSettings?.confirmedSensitiveOrigins || [];
      if (!confirmedList.includes(origin)) {
        const updated = await repo.updateSettings({
          confirmedSensitiveOrigins: [...confirmedList, origin],
        });
        cachedSettings = updated;
      }
    }

    function openSensitiveConfirmationModal(label: string, onConfirm: () => void) {
      const origin = window.location.origin;
      const crossOrigin = isCrossOriginSubframe();
      const container = ensureClosedShadowContainer();
      container.replaceChildren();

      const backdrop = document.createElement('div');
      backdrop.className = 'sf-backdrop';

      const modal = document.createElement('div');
      modal.className = 'sf-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Confirm Sensitive Field Fill');

      const title = document.createElement('h2');
      title.className = 'sf-title';
      title.textContent = crossOrigin
        ? 'Warning: Sensitive Fill Inside Cross-Origin Frame'
        : 'Confirm Sensitive Field Autofill';

      const desc = document.createElement('p');
      desc.textContent = crossOrigin
        ? `You are filling sensitive field "${label}" inside an embedded cross-origin iframe (${origin}). Only proceed if you trust this frame.`
        : `First time filling a sensitive field ("${label}") on ${origin}. Allow sensitive field autofill on this site?`;

      const actions = document.createElement('div');
      actions.className = 'sf-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sf-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', clearOverlay);

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.className = 'sf-btn sf-btn-primary';
      confirmBtn.textContent = 'Allow & Fill';
      confirmBtn.addEventListener('click', async () => {
        await markSensitiveSiteConfirmed();
        onConfirm();
        clearOverlay();
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(confirmBtn);
      modal.appendChild(title);
      modal.appendChild(desc);
      modal.appendChild(actions);
      backdrop.appendChild(modal);
      container.appendChild(backdrop);
      confirmBtn.focus();
    }

    function resolveTargetElement(targetElementId?: number): FillableElement | null {
      // 1. Firefox browser.menus.getTargetElement(info.targetElementId)
      const menusApi = browser as unknown as {
        menus?: { getTargetElement?: (id: number) => Element | null };
        contextMenus?: { getTargetElement?: (id: number) => Element | null };
      };
      if (typeof targetElementId === 'number') {
        const getTarget =
          menusApi.menus?.getTargetElement || menusApi.contextMenus?.getTargetElement;
        if (typeof getTarget === 'function') {
          const el = getTarget(targetElementId);
          if (el && isFillable(el)) return el as FillableElement;
        }
      }

      // 2. Last right-clicked element recorded by contextmenu listener
      if (lastRightClickedElement && lastRightClickedElement.isConnected) {
        return lastRightClickedElement;
      }

      // 3. Currently focused element (including inside open shadow roots)
      let active: Element | null = document.activeElement;
      while (active && active.shadowRoot && active.shadowRoot.activeElement) {
        active = active.shadowRoot.activeElement;
      }
      if (active && isFillable(active)) {
        return active as FillableElement;
      }

      // 4. Last focused element recorded by focusin listener
      if (lastFocusedElement && lastFocusedElement.isConnected) {
        return lastFocusedElement;
      }

      // 5. Fallback: single visible fillable input on page or currently active input
      try {
        const fillables = collectFillableElements(document.body || document.documentElement);
        if (fillables.length === 1 && fillables[0]) {
          return fillables[0];
        }
        const focused = document.querySelector(
          'input:focus, textarea:focus',
        ) as FillableElement | null;
        if (focused && isFillable(focused)) {
          return focused;
        }
      } catch {
        // ignore DOM access errors in restricted contexts
      }

      return null;
    }

    // Track contextmenu target (never on password fields)
    document.addEventListener(
      'contextmenu',
      (ev) => {
        const path = ev.composedPath?.() || [];
        const firstEl = (path[0] as Element) || (ev.target as Element);
        const fillable =
          firstEl && isFillable(firstEl)
            ? firstEl
            : (firstEl?.closest?.(
                'input, textarea, select, [contenteditable="true"]',
              ) as Element | null);

        if (fillable && isFillable(fillable)) {
          lastRightClickedElement = fillable as FillableElement;
        } else {
          lastRightClickedElement = null;
        }
      },
      true,
    );

    // Track focus & optional inline chips (never on password fields)
    document.addEventListener(
      'focusin',
      (ev) => {
        const path = ev.composedPath?.() || [];
        const target = (path[0] as Element) || (ev.target as Element);
        if (target && isFillable(target)) {
          lastFocusedElement = target as FillableElement;
          if (cachedSettings?.enableInlineChips) {
            renderInlineChipForElement(target as FillableElement);
          }
        }
      },
      true,
    );

    // Text snippet expansion on input (never on password fields, respects per-site disable)
    document.addEventListener(
      'input',
      (ev) => {
        const target = ev.target as HTMLInputElement | HTMLTextAreaElement | null;
        if (!target || !isFillable(target)) return;
        if (!('value' in target) || typeof target.value !== 'string') return;

        const host = window.location.hostname.toLowerCase();
        const siteRule = cachedSiteRules.find((r) => r.host.toLowerCase() === host);
        if (siteRule?.snippetsDisabled || siteRule?.autoFillRule === 'never') return;

        const prefix = cachedSettings?.snippetTriggerPrefix || ';';
        const match = findMatchingSnippetTrigger(target.value, cachedSnippets, prefix);
        if (match) {
          const expanded = expandSnippetVariables(match.snippet.content);
          const nextValue =
            target.value.slice(0, target.value.length - match.matchedTrigger.length) +
            expanded.text;
          fillElement(target, nextValue, true);
          if (expanded.cursorOffset !== null && typeof target.setSelectionRange === 'function') {
            const pos = target.value.length - expanded.text.length + expanded.cursorOffset;
            try {
              target.setSelectionRange(pos, pos);
            } catch {
              // ignore on input types that don't support setSelectionRange
            }
          }
        }
      },
      true,
    );

    // Keyboard shortcut fallback for Quick Picker (Ctrl/Cmd+Shift+Space)
    document.addEventListener('keydown', (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.code === 'Space') {
        ev.preventDefault();
        openQuickPickerModal(
          cachedProfiles,
          cachedSnippets,
          cachedSettings?.defaultProfileId || cachedProfiles[0]?.id || '',
        );
      }
    });

    function renderInlineChipForElement(el: FillableElement) {
      const attrs = extractFieldAttributes(el);
      const ranked = rankFieldCandidates(attrs);
      if (ranked.skipped || ranked.candidates.length === 0) return;

      const profile =
        cachedProfiles.find((p) => p.id === cachedSettings?.defaultProfileId) || cachedProfiles[0];
      if (!profile) return;

      const topCandidate = ranked.candidates[0]!;
      const matchedFieldObj = profile.fields.find((f) => f.key === topCandidate.key);
      // Exclude sensitive fields from inline chips unless explicitly opted in
      if (matchedFieldObj?.sensitive && !cachedSettings?.allowSensitiveInInlineChips) {
        return;
      }

      const value = resolveProfileValue(profile, topCandidate.key);
      if (!value) return;

      const container = ensureClosedShadowContainer();
      const rect = el.getBoundingClientRect();
      container.replaceChildren();

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sf-chip';
      chip.textContent = `SF: ${topCandidate.key}`;
      chip.style.top = `${Math.max(4, rect.top + 4)}px`;
      chip.style.left = `${Math.max(4, rect.right - 72)}px`;
      chip.addEventListener('mousedown', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (matchedFieldObj?.sensitive && (await requiresSensitiveSiteConfirm())) {
          openSensitiveConfirmationModal(matchedFieldObj.label, () => {
            fillElement(el, value, true);
          });
          return;
        }
        fillElement(el, value, true);
        clearOverlay();
      });

      container.appendChild(chip);
    }

    /**
     * Quick Picker Overlay (rendered inside closed Shadow DOM).
     * Cards are strictly excluded from the Quick Picker.
     */
    function openQuickPickerModal(
      profiles: Profile[],
      snippets: Snippet[],
      activeProfileId: string,
    ) {
      const targetEl = resolveTargetElement();
      const container = ensureClosedShadowContainer();
      container.replaceChildren();

      const backdrop = document.createElement('div');
      backdrop.className = 'sf-backdrop';

      const modal = document.createElement('div');
      modal.className = 'sf-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Stashfill Quick Picker');

      const title = document.createElement('h2');
      title.className = 'sf-title';
      title.textContent = 'Stashfill Quick Picker';

      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.className = 'sf-input';
      searchInput.placeholder = 'Search saved fields & snippets...';

      const listEl = document.createElement('div');
      listEl.className = 'sf-list';

      const activeProf = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

      // Combine profile fields and snippets (NEVER cards!)
      const allEntries: { label: string; value: string; badge: string; sensitive?: boolean }[] = [];
      if (activeProf) {
        for (const f of activeProf.fields) {
          if (f.value && f.value.trim()) {
            allEntries.push({
              label: f.label,
              value: f.value,
              badge: f.category || 'field',
              sensitive: f.sensitive,
            });
          }
        }
      }
      for (const s of snippets) {
        allEntries.push({
          label: `Snippet ${s.trigger}`,
          value: expandSnippetVariables(s.content).text,
          badge: 'snippet',
        });
      }

      let selectedIdx = 0;

      function renderItems(query: string) {
        listEl.replaceChildren();
        const q = query.toLowerCase().trim();
        const filtered = q
          ? allEntries.filter(
              (item) =>
                item.label.toLowerCase().includes(q) || item.badge.toLowerCase().includes(q),
            )
          : allEntries;

        filtered.forEach((item, idx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sf-item';
          btn.setAttribute('data-active', idx === selectedIdx ? 'true' : 'false');

          const spanLabel = document.createElement('span');
          spanLabel.textContent = item.label;

          const spanBadge = document.createElement('span');
          spanBadge.className = 'sf-badge';
          spanBadge.textContent = item.badge;

          btn.appendChild(spanLabel);
          btn.appendChild(spanBadge);

          btn.addEventListener('click', async () => {
            if (targetEl) {
              if (item.sensitive && (await requiresSensitiveSiteConfirm())) {
                openSensitiveConfirmationModal(item.label, () => {
                  fillElement(targetEl, item.value, true);
                });
                return;
              }
              fillElement(targetEl, item.value, true);
            } else {
              void navigator.clipboard?.writeText(item.value);
            }
            clearOverlay();
          });

          listEl.appendChild(btn);
        });

        return filtered;
      }

      let currentFiltered = renderItems('');

      searchInput.addEventListener('input', () => {
        selectedIdx = 0;
        currentFiltered = renderItems(searchInput.value);
      });

      searchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          clearOverlay();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentFiltered.length > 0) {
            selectedIdx = (selectedIdx + 1) % currentFiltered.length;
            renderItems(searchInput.value);
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentFiltered.length > 0) {
            selectedIdx = (selectedIdx - 1 + currentFiltered.length) % currentFiltered.length;
            renderItems(searchInput.value);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const chosen = currentFiltered[selectedIdx];
          if (chosen) {
            if (targetEl) {
              if (chosen.sensitive && (await requiresSensitiveSiteConfirm())) {
                openSensitiveConfirmationModal(chosen.label, () => {
                  fillElement(targetEl, chosen.value, true);
                });
                return;
              }
              fillElement(targetEl, chosen.value, true);
            } else {
              void navigator.clipboard?.writeText(chosen.value);
            }
            clearOverlay();
          }
        }
      });

      const actions = document.createElement('div');
      actions.className = 'sf-actions';
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sf-btn';
      cancelBtn.textContent = 'Close';
      cancelBtn.addEventListener('click', clearOverlay);
      actions.appendChild(cancelBtn);

      modal.appendChild(title);
      modal.appendChild(searchInput);
      modal.appendChild(listEl);
      modal.appendChild(actions);
      backdrop.appendChild(modal);
      container.appendChild(backdrop);

      searchInput.focus();
    }

    /**
     * Save Selection to Stashfill tiny prompt (label, profile, category).
     */
    function openSaveSelectionModal(
      selectedText: string,
      profiles: Profile[],
      activeProfileId: string,
    ) {
      const container = ensureClosedShadowContainer();
      container.replaceChildren();

      const backdrop = document.createElement('div');
      backdrop.className = 'sf-backdrop';

      const modal = document.createElement('div');
      modal.className = 'sf-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Save selection to Stashfill');

      const title = document.createElement('h2');
      title.className = 'sf-title';
      title.textContent = 'Save selection to Stashfill';

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'sf-input';
      labelInput.placeholder = 'Field label (e.g. Work Address)';
      labelInput.value = 'Saved Selection';

      const profileSelect = document.createElement('select');
      profileSelect.className = 'sf-select';
      for (const p of profiles) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === activeProfileId) opt.selected = true;
        profileSelect.appendChild(opt);
      }

      const categorySelect = document.createElement('select');
      categorySelect.className = 'sf-select';
      for (const cat of ['personal', 'contact', 'address', 'work', 'social', 'custom']) {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
      }

      const actions = document.createElement('div');
      actions.className = 'sf-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sf-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', clearOverlay);

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'sf-btn sf-btn-primary';
      saveBtn.textContent = 'Save';
      saveBtn.addEventListener('click', async () => {
        await browser.runtime.sendMessage({
          type: 'SAVE_SELECTION_TO_PROFILE',
          profileId: profileSelect.value,
          label: labelInput.value.trim() || 'Saved Selection',
          category: categorySelect.value,
          value: selectedText,
        } satisfies ExtensionMessage);
        await refreshCache();
        clearOverlay();
      });

      actions.appendChild(cancelBtn);
      actions.appendChild(saveBtn);

      modal.appendChild(title);
      modal.appendChild(labelInput);
      modal.appendChild(profileSelect);
      modal.appendChild(categorySelect);
      modal.appendChild(actions);
      backdrop.appendChild(modal);
      container.appendChild(backdrop);
      labelInput.focus();
    }

    /**
     * Map This Field Mode: remembers mapping per origin using field signature (name, id, labelHash, domPath fallback).
     */
    function openMapFieldModal(
      profiles: Profile[],
      activeProfileId: string,
      targetElementId?: number,
    ) {
      const targetEl = resolveTargetElement(targetElementId);
      if (!targetEl) return;

      const attrs = extractFieldAttributes(targetEl);
      const signature = computeFieldSignature(targetEl, attrs);
      const host = window.location.hostname.toLowerCase();

      const container = ensureClosedShadowContainer();
      container.replaceChildren();

      const backdrop = document.createElement('div');
      backdrop.className = 'sf-backdrop';

      const modal = document.createElement('div');
      modal.className = 'sf-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Map this field');

      const title = document.createElement('h2');
      title.className = 'sf-title';
      title.textContent = `Map field on ${host}`;

      const listEl = document.createElement('div');
      listEl.className = 'sf-list';

      const activeProf = profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;

      if (activeProf) {
        for (const f of activeProf.fields) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'sf-item';
          btn.textContent = `${f.label} (${f.key})`;
          btn.addEventListener('click', async () => {
            await browser.runtime.sendMessage({
              type: 'SAVE_FIELD_MAPPING',
              host,
              mapping: {
                id: `map_${Date.now()}`,
                signature,
                targetKind: 'fieldKey',
                targetKey: f.key,
                profileId: activeProf.id,
                label: f.label,
              },
            } satisfies ExtensionMessage);
            if (f.value) {
              fillElement(targetEl, f.value, true);
            }
            await refreshCache();
            clearOverlay();
          });
          listEl.appendChild(btn);
        }
      }

      const actions = document.createElement('div');
      actions.className = 'sf-actions';
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sf-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', clearOverlay);
      actions.appendChild(cancelBtn);

      modal.appendChild(title);
      modal.appendChild(listEl);
      modal.appendChild(actions);
      backdrop.appendChild(modal);
      container.appendChild(backdrop);
    }

    /**
     * Explicit Card Fill Confirmation Modal (blocks HTTP, shows origin + last 4 digits,
     * prompts for ephemeral CVV if not stored, offers Copy with 15s auto-clear).
     */
    function openCardConfirmationModal(card: FillableCard, originText?: string) {
      const protocol = window.location.protocol;
      const origin = originText || window.location.origin;
      const rawNumber =
        'number' in card && typeof card.number === 'string'
          ? card.number
          : 'cardNumber' in card && typeof card.cardNumber === 'string'
            ? card.cardNumber
            : '';
      const last4 = rawNumber.replace(/\D/g, '').slice(-4) || '0000';

      const container = ensureClosedShadowContainer();
      container.replaceChildren();

      const backdrop = document.createElement('div');
      backdrop.className = 'sf-backdrop';

      const modal = document.createElement('div');
      modal.className = 'sf-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-label', 'Confirm Payment Card Fill');

      const title = document.createElement('h2');
      title.className = 'sf-title';
      title.textContent =
        protocol === 'http:' ? 'Blocked: Insecure HTTP Page' : 'Confirm Payment Card Autofill';

      const desc = document.createElement('p');
      if (protocol === 'http:') {
        desc.textContent =
          'Stashfill blocks payment card autofill on unencrypted HTTP pages to protect your card details.';
      } else {
        desc.textContent = `Fill card ending in •••• ${last4} on ${origin}?`;
      }

      let cvvInput: HTMLInputElement | null = null;
      if (protocol !== 'http:' && !card.cvv) {
        cvvInput = document.createElement('input');
        cvvInput.type = 'password';
        cvvInput.inputMode = 'numeric';
        cvvInput.maxLength = 4;
        cvvInput.className = 'sf-input';
        cvvInput.placeholder = 'Optional CVV for this fill only (never saved)';
      }

      const actions = document.createElement('div');
      actions.className = 'sf-actions';

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'sf-btn';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', clearOverlay);
      actions.appendChild(cancelBtn);

      if (protocol !== 'http:') {
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'sf-btn';
        copyBtn.textContent = 'Copy Number (Auto-clears in 15s)';
        copyBtn.addEventListener('click', async () => {
          await copyCardNumberWithAutoClear(rawNumber, 15000);
          clearOverlay();
        });
        actions.appendChild(copyBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'sf-btn sf-btn-primary';
        confirmBtn.textContent = `Confirm Fill (•••• ${last4})`;
        confirmBtn.addEventListener('click', () => {
          fillPaymentCard(document, card, {
            confirmed: true,
            ephemeralCvv: cvvInput?.value.trim() || undefined,
          });
          clearOverlay();
        });
        actions.appendChild(confirmBtn);
      }

      modal.appendChild(title);
      modal.appendChild(desc);
      if (cvvInput) modal.appendChild(cvvInput);
      modal.appendChild(actions);
      backdrop.appendChild(modal);
      container.appendChild(backdrop);
    }

    // Listen to messages from popup or background service worker
    browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
      const msg = message as ExtensionMessage;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'FILL_PAGE_FORM': {
          const host = window.location.hostname.toLowerCase();
          const siteRule =
            msg.siteRule ?? cachedSiteRules.find((r) => r.host.toLowerCase() === host) ?? null;
          const result = fillFormWithProfile(document, msg.profile, {
            mode: msg.mode ?? 'all',
            siteRule,
          });
          sendResponse({
            success: true,
            count: result.filledCount,
            crossOriginSubframe: isCrossOriginSubframe(),
          });
          return true;
        }

        case 'FILL_PAYMENT_CARD': {
          // Principle 6 & Part C: explicit confirmation + HTTPS required
          if (!msg.confirmed) {
            sendResponse({ success: false, error: 'Confirmation required for payment card fill' });
            return true;
          }
          const result = fillPaymentCard(document, msg.card, {
            confirmed: true,
            ephemeralCvv: msg.ephemeralCvv,
          });
          if (result.blockedReason === 'insecure_http') {
            sendResponse({
              success: false,
              error: 'Payment card autofill is blocked on insecure HTTP pages',
            });
            return true;
          }
          sendResponse({
            success: true,
            count: result.filledCount,
            hasCrossOriginPaymentIframe: result.hasCrossOriginPaymentIframe,
          });
          return true;
        }

        case 'REQUEST_CARD_FILL_CONFIRMATION': {
          openCardConfirmationModal(msg.card, msg.origin);
          sendResponse({ success: true });
          return true;
        }

        case 'UNDO_LAST_FILL': {
          const restored = undoLastFill();
          sendResponse({ success: true, count: restored });
          return true;
        }

        case 'SCHEDULE_CLIPBOARD_CLEAR': {
          const val = (msg as unknown as { value?: string }).value;
          const delay = (msg as unknown as { delayMs?: number }).delayMs ?? 15000;
          if (typeof val === 'string' && val.length > 0) {
            setTimeout(async () => {
              try {
                if (navigator.clipboard?.readText) {
                  try {
                    const current = await navigator.clipboard.readText();
                    if (current !== val) return;
                  } catch {
                    // ignore
                  }
                }
                await navigator.clipboard.writeText('');
              } catch {
                // ignore
              }
            }, delay);
          }
          sendResponse({ success: true });
          return true;
        }

        case 'OPEN_QUICK_PICKER': {
          openQuickPickerModal(msg.profiles, msg.snippets, msg.activeProfileId);
          sendResponse({ success: true });
          return true;
        }

        case 'OPEN_SAVE_SELECTION_MODAL': {
          openSaveSelectionModal(msg.selectedText, msg.profiles, msg.activeProfileId);
          sendResponse({ success: true });
          return true;
        }

        case 'START_MAP_FIELD_MODE': {
          openMapFieldModal(msg.profiles, msg.activeProfileId, msg.targetElementId);
          sendResponse({ success: true });
          return true;
        }

        case 'FILL_ACTIVE_FIELD': {
          const active = resolveTargetElement(msg.targetElementId);

          if (!active || !isFillable(active)) {
            sendResponse({ success: false, error: 'No active fillable field found' });
            return true;
          }

          if (msg.target.kind === 'profileField') {
            const target = msg.target;
            void requiresSensitiveSiteConfirm().then((needsConfirm) => {
              if (target.sensitive && needsConfirm) {
                openSensitiveConfirmationModal(target.label || target.fieldPath, () => {
                  fillElement(active, target.value, true);
                });
                sendResponse({ success: true, pendingConfirmation: true });
                return;
              }
              const ok = fillElement(active, target.value, true);
              sendResponse({ success: ok, crossOriginSubframe: isCrossOriginSubframe() });
            });
            return true;
          } else {
            sendResponse({ success: false, error: 'Unsupported target for single field' });
          }
          return true;
        }

        case 'GET_FOCUSED_INPUT_INFO': {
          const active = resolveTargetElement();
          if (active && isFillable(active)) {
            const attrs = extractFieldAttributes(active);
            const guess = matchProfileField(attrs);
            sendResponse({
              hasFocusedInput: true,
              fieldTypeGuess: guess ?? undefined,
            });
          } else {
            sendResponse({ hasFocusedInput: false });
          }
          return true;
        }
      }
    });
  },
});
