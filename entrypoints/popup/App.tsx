import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { browser } from 'wxt/browser';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter';
import { StashRepository } from '../../src/storage/StashRepository';
import { VaultManager } from '../../src/vault/vaultManager';
import { type Profile, type Settings, DEFAULT_SETTINGS } from '../../src/core/schemas/vault';
import { createPersonalTemplate } from '../../src/core/templates';
import { type PaymentCard, maskCardNumber } from '../../src/types/vault';
import { getTranslations, formatString, type Language } from '../../src/i18n';
import { StashItemRow } from '../../src/components/StashItemRow';
import { Toast, type ToastMessage } from '../../src/components/Toast';
import { ConfirmModal } from '../../src/components/ConfirmModal';

export function App() {
  const [repo] = useState(() => new StashRepository(new LocalStorageAdapter()));
  const [vaultManager] = useState(() => new VaultManager(repo));

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Vault state
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cardToConfirmFill, setCardToConfirmFill] = useState<PaymentCard | null>(null);

  // Keyboard navigation
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const t = useMemo(() => getTranslations(settings.language as Language), [settings.language]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ id: String(Date.now()), text, type });
    setTimeout(() => {
      setToast((cur) => (cur?.text === text ? null : cur));
    }, 2500);
  };

  // Load initial data
  useEffect(() => {
    async function load() {
      let allProfiles = await repo.getProfiles();
      if (allProfiles.length === 0) {
        const initialProfile = createPersonalTemplate('Personal');
        await repo.upsertProfile(initialProfile);
        allProfiles = [initialProfile];
      }

      const [active, curSettings, isInit] = await Promise.all([
        repo.getActiveProfile(),
        repo.getSettings(),
        vaultManager.isInitialized(),
      ]);

      setProfiles(allProfiles);
      setActiveProfile(active || allProfiles[0] || null);
      setSettings(curSettings);
      setVaultInitialized(isInit);

      // Apply theme
      applyTheme(curSettings.theme);
    }
    load();
  }, [repo, vaultManager]);

  const applyTheme = (theme: 'system' | 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isSystemDark);
    }
  };

  const handleProfileChange = async (profileId: string) => {
    await repo.setActiveProfileId(profileId);
    const p = profiles.find((item) => item.id === profileId) ?? null;
    setActiveProfile(p);
  };

  const handleToggleTheme = async () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    const updated = await repo.updateSettings({ theme: nextTheme });
    setSettings(updated);
    applyTheme(nextTheme);
  };

  const handleToggleLanguage = async () => {
    const nextLang = settings.language === 'en' ? 'bn' : 'en';
    const updated = await repo.updateSettings({ language: nextLang });
    setSettings(updated);
  };

  const openOptionsPage = () => {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else {
      window.open(browser.runtime.getURL('/options.html'));
    }
  };

  // Autofill full form
  const handleFillEntireForm = async () => {
    if (!activeProfile) return;
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        showToast(t.messages.noFormFound, 'error');
        return;
      }

      const res = (await browser.tabs.sendMessage(activeTab.id, {
        type: 'FILL_PAGE_FORM',
        profile: activeProfile,
      })) as { success: boolean; count?: number };

      if (res && res.success && res.count && res.count > 0) {
        showToast(formatString(t.actions.filled, { count: res.count }), 'success');
      } else {
        showToast(t.messages.noFormFound, 'info');
      }
    } catch {
      showToast(t.messages.noFormFound, 'info');
    }
  };

  // Fill single field into active focused element
  const handleFillField = async (key: string, value: string) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) return;

      const res = (await browser.tabs.sendMessage(activeTab.id, {
        type: 'FILL_ACTIVE_FIELD',
        target: { kind: 'profileField', fieldPath: key, value },
      })) as { success: boolean };

      if (res && res.success) {
        showToast(t.actions.copied, 'success');
      } else {
        // Fallback to copy if no active field is focused
        await handleCopy(value);
      }
    } catch {
      await handleCopy(value);
    }
  };

  // Copy to clipboard
  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(t.actions.copied, 'success');
    } catch {
      showToast('Copy failed', 'error');
    }
  };

  // Vault actions
  const handleUnlockVault = async () => {
    setVaultError('');
    try {
      const content = await vaultManager.unlock(vaultPassphrase);
      setVaultUnlocked(true);
      setCards(content.cards);
      setVaultPassphrase('');
    } catch {
      setVaultError(t.vault.invalidPassphrase);
    }
  };

  const handleLockVault = () => {
    vaultManager.lock();
    setVaultUnlocked(false);
    setCards([]);
    setVaultPassphrase('');
  };

  // Explicit payment card autofill with confirmation (Principle 6)
  const handleRequestFillCard = (card: PaymentCard) => {
    if (settings.confirmBeforePaymentFill) {
      setCardToConfirmFill(card);
    } else {
      executeCardFill(card);
    }
  };

  const executeCardFill = async (card: PaymentCard) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) return;

      const res = (await browser.tabs.sendMessage(activeTab.id, {
        type: 'FILL_PAYMENT_CARD',
        card,
        confirmed: true,
      })) as { success: boolean; count?: number };

      if (res && res.success && res.count && res.count > 0) {
        showToast(formatString(t.actions.filled, { count: res.count }), 'success');
      } else {
        showToast(t.messages.noFormFound, 'info');
      }
    } catch {
      showToast('Could not fill card into page', 'error');
    } finally {
      setCardToConfirmFill(null);
    }
  };

  // Flat list of profile items for search and keyboard navigation
  const visibleItems = useMemo(() => {
    if (!activeProfile || !activeProfile.fields) return [];

    const items: { id: string; label: string; value: string; group: string; key: string }[] = [];

    for (const field of activeProfile.fields) {
      if (field.value && field.value.trim().length > 0) {
        items.push({
          id: field.id,
          label: field.label,
          value: field.value,
          group: field.category
            ? field.category.charAt(0).toUpperCase() + field.category.slice(1)
            : t.sections.personal,
          key: field.key,
        });
      }
    }

    if (!searchQuery.trim()) return items;

    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    );
  }, [activeProfile, searchQuery, t]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedItemIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedItemIndex((prev) => (prev > 0 ? prev - 1 : visibleItems.length - 1));
      } else if (e.key === 'Enter' && selectedItemIndex >= 0) {
        const item = visibleItems[selectedItemIndex];
        if (item) {
          e.preventDefault();
          handleFillField(item.id, item.value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleItems, selectedItemIndex]);

  return (
    <div class="flex max-h-[580px] w-[360px] flex-col overflow-hidden bg-white font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Header */}
      <header class="backdrop-blur-xs flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/70 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900/70">
        <div class="flex items-center space-x-2">
          <div class="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-xs font-bold tracking-tighter text-white">
            SF
          </div>
          <span class="text-sm font-bold text-slate-900 dark:text-white">{t.appName}</span>
          <span class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            Offline
          </span>
        </div>

        <div class="flex items-center space-x-1.5">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleToggleLanguage}
            title={t.settings.language}
            aria-label={t.settings.language}
            class="rounded px-1.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {settings.language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            title={t.settings.theme}
            aria-label={t.settings.theme}
            class="rounded p-1 text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {settings.theme === 'dark' ? (
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          {/* Settings button */}
          <button
            type="button"
            onClick={openOptionsPage}
            title={t.actions.options}
            aria-label={t.actions.options}
            class="rounded p-1 text-slate-600 transition-colors hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Profile Bar & Primary Action */}
      <div class="shrink-0 space-y-2 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-center space-x-2">
          <label for="profile-select" class="shrink-0 text-xs font-medium text-slate-500">
            {t.settings.activeProfile}:
          </label>
          <select
            id="profile-select"
            value={activeProfile?.id ?? ''}
            onChange={(e) => handleProfileChange((e.target as HTMLSelectElement).value)}
            class="outline-hidden flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {settings.defaultProfileId === p.id ? '★' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 1-Click Form Fill Button */}
        <button
          type="button"
          onClick={handleFillEntireForm}
          class="shadow-xs flex w-full cursor-pointer items-center justify-center space-x-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand-700"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span>{t.actions.fillForm}</span>
        </button>

        {/* Search Input */}
        <div class="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            placeholder={t.actions.search}
            class="focus:outline-hidden w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-7 pr-7 text-xs text-slate-900 focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
          />
          <svg
            class="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              class="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main List Area */}
      <div class="flex-1 space-y-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/50">
        {visibleItems.length === 0 ? (
          <div class="py-6 text-center text-xs text-slate-400">
            {searchQuery ? 'No matching fields found' : 'No profile data saved yet.'}
          </div>
        ) : (
          <div class="space-y-0.5">
            {visibleItems.map((item, idx) => (
              <StashItemRow
                key={item.id}
                label={item.label}
                value={item.value}
                fillLabel={t.actions.fillField}
                copyLabel={t.actions.copy}
                isSelected={idx === selectedItemIndex}
                onFill={() => handleFillField(item.id, item.value)}
                onCopy={() => handleCopy(item.value)}
              />
            ))}
          </div>
        )}

        {/* Secure Vault Section */}
        <div class="mt-2 pt-2">
          <div class="flex items-center justify-between px-2 py-1">
            <span class="flex items-center space-x-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <svg
                class="h-3 w-3 text-brand-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>{t.vault.title}</span>
            </span>

            {vaultUnlocked && (
              <button
                type="button"
                onClick={handleLockVault}
                class="text-[10px] text-brand-600 hover:underline"
              >
                {t.actions.lock}
              </button>
            )}
          </div>

          {!vaultInitialized ? (
            <div class="rounded bg-slate-50 p-2.5 text-center text-xs text-slate-500 dark:bg-slate-800/40">
              <span>{t.vault.setupPassphrase}</span>
              <button
                type="button"
                onClick={openOptionsPage}
                class="mx-auto mt-1 block font-medium text-brand-600 hover:underline"
              >
                {t.actions.options}
              </button>
            </div>
          ) : !vaultUnlocked ? (
            <div class="space-y-2 rounded bg-slate-50 p-2.5 dark:bg-slate-800/40">
              <div class="flex items-center space-x-1.5">
                <input
                  type="password"
                  value={vaultPassphrase}
                  onInput={(e) => setVaultPassphrase((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
                  placeholder={t.vault.enterPassphrase}
                  class="focus:outline-hidden flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="button"
                  onClick={handleUnlockVault}
                  class="rounded bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                >
                  {t.actions.unlock}
                </button>
              </div>
              {vaultError && <p class="text-[11px] text-rose-500">{vaultError}</p>}
            </div>
          ) : (
            <div class="space-y-1.5 p-1">
              {cards.length === 0 ? (
                <p class="px-2 py-1 text-xs text-slate-400">{t.vault.noCardsYet}</p>
              ) : (
                cards.map((card) => (
                  <div
                    key={card.id}
                    class="flex items-center justify-between rounded border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/30"
                  >
                    <div>
                      <div class="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                        <span>{card.nickname}</span>
                        <span class="rounded bg-slate-200 px-1 text-[9px] uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {card.brand}
                        </span>
                      </div>
                      <div class="mt-0.5 font-mono text-[11px] text-slate-500">
                        {maskCardNumber(card.cardNumber)} ({card.expMonth}/{card.expYear})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRequestFillCard(card)}
                      class="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
                    >
                      {t.actions.fillField}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Sensitive Payment Card Fill (Principle 6) */}
      <ConfirmModal
        isOpen={cardToConfirmFill !== null}
        title={t.vault.confirmFillTitle}
        message={
          cardToConfirmFill
            ? formatString(t.vault.confirmFillWarning, {
                nickname: cardToConfirmFill.nickname,
                masked: maskCardNumber(cardToConfirmFill.cardNumber),
              })
            : ''
        }
        confirmLabel={t.vault.confirmFillButton}
        cancelLabel={t.actions.cancel}
        isDestructive={false}
        onConfirm={() => cardToConfirmFill && executeCardFill(cardToConfirmFill)}
        onCancel={() => setCardToConfirmFill(null)}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
