import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { browser } from 'wxt/browser';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter';
import { StashRepository } from '../../src/storage/StashRepository';
import { VaultManager } from '../../src/vault/vaultManager';
import {
  type Profile,
  type Field,
  type Settings,
  DEFAULT_SETTINGS,
} from '../../src/core/schemas/vault';
import { createPersonalTemplate } from '../../src/core/templates';
import { type PaymentCard, maskCardNumber } from '../../src/types/vault';
import { copyCardNumberWithAutoClear } from '../../src/fill/domFiller';
import { exportPlainJson } from '../../src/storage/importExport';
import { getTranslations, formatString, type Language } from '../../src/i18n';
import { StashItemRow } from '../../src/components/StashItemRow';
import { CardBrandIcon } from '../../src/components/CardBrandIcon';
import { Toast, type ToastMessage } from '../../src/components/Toast';

export interface PopupProps {
  repository?: StashRepository;
  vaultMgr?: VaultManager;
}

export function App({ repository, vaultMgr }: PopupProps = {}) {
  const [repo] = useState(() => repository ?? new StashRepository(new LocalStorageAdapter()));
  const [vaultManager] = useState(() => vaultMgr ?? new VaultManager(repo));

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Quick Add Field state
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [quickLabel, setQuickLabel] = useState('');
  const [quickValue, setQuickValue] = useState('');
  const [quickSensitive, setQuickSensitive] = useState(false);

  // Vault state
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cardToConfirmFill, setCardToConfirmFill] = useState<PaymentCard | null>(null);
  const [ephemeralCvv, setEphemeralCvv] = useState('');
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});
  const [reauthPendingAction, setReauthPendingAction] = useState<
    | { kind: 'fill'; card: PaymentCard }
    | { kind: 'reveal'; cardId: string }
    | { kind: 'copy'; cardNumber: string }
    | null
  >(null);
  const [reauthPassphrase, setReauthPassphrase] = useState('');
  const [reauthError, setReauthError] = useState('');

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

  // Focus search box on open & load initial data
  useEffect(() => {
    searchInputRef.current?.focus();

    async function load() {
      let allProfiles = await repo.getProfiles();
      let curSettings = await repo.getSettings();
      if (allProfiles.length === 0) {
        const initialProfile = createPersonalTemplate('Personal');
        await repo.upsertProfile(initialProfile);
        await repo.setActiveProfileId(initialProfile.id);
        allProfiles = [initialProfile];
        curSettings = await repo.getSettings();
      }

      const [active, isInit] = await Promise.all([
        repo.getActiveProfile(),
        vaultManager.isInitialized(),
      ]);

      setProfiles(allProfiles);
      setActiveProfile(active || allProfiles[0] || null);
      setSettings(curSettings);
      setVaultInitialized(isInit);

      applyTheme(curSettings.theme);
      document.documentElement.lang = curSettings.language;
      searchInputRef.current?.focus();
    }
    load();
  }, [repo, vaultManager]);

  const isProfileDefault = (p: Profile) =>
    settings.defaultProfileId ? settings.defaultProfileId === p.id : profiles[0]?.id === p.id;

  const applyTheme = (theme: 'system' | 'light' | 'dark') => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const isSystemDark =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    document.documentElement.lang = nextLang;
  };

  const openOptionsPage = () => {
    if (browser?.runtime?.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else if (browser?.runtime?.getURL) {
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

  const markFieldUsed = async (fieldId: string) => {
    if (!activeProfile) return;
    const updatedProfile = await repo.recordFieldUsage(activeProfile.id, fieldId);
    if (updatedProfile) {
      setActiveProfile(updatedProfile);
      setProfiles((prev) => prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)));
    }
  };

  // Fill single field into active focused element
  const handleFillField = async (
    fieldId: string,
    key: string,
    value: string,
    label?: string,
    sensitive?: boolean,
  ) => {
    await markFieldUsed(fieldId);
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        await handleCopy(fieldId, value, false);
        return;
      }

      const res = (await browser.tabs.sendMessage(activeTab.id, {
        type: 'FILL_ACTIVE_FIELD',
        target: { kind: 'profileField', fieldPath: key, value, label, sensitive },
      })) as { success: boolean };

      if (res && res.success) {
        showToast(formatString(t.actions.filled, { count: 1 }), 'success');
      } else {
        await handleCopy(fieldId, value, false);
      }
    } catch {
      await handleCopy(fieldId, value, false);
    }
  };

  // Copy to clipboard
  const handleCopy = async (fieldId: string, value: string, recordUsage = true) => {
    if (recordUsage) {
      await markFieldUsed(fieldId);
    }
    try {
      await navigator.clipboard.writeText(value);
      showToast(t.actions.copied, 'success');
    } catch {
      showToast(t.actions.copyFailed, 'error');
    }
  };

  // Quick Add Field
  const handleQuickAddField = async (e: Event) => {
    e.preventDefault();
    if (!activeProfile || !quickLabel.trim() || !quickValue.trim()) return;

    const now = Date.now();
    const newField: Field = {
      id: `f_${now}_${Math.random().toString(36).substring(2, 7)}`,
      label: quickLabel.trim(),
      key: `custom_${now}`,
      value: quickValue.trim(),
      type: 'text',
      category: 'custom',
      tags: ['custom'],
      sensitive: quickSensitive,
      createdAt: now,
      updatedAt: now,
      useCount: 0,
      lastUsedAt: now,
    };

    const updatedProfile: Profile = {
      ...activeProfile,
      fields: [newField, ...activeProfile.fields],
    };

    const saved = await repo.upsertProfile(updatedProfile);
    const all = await repo.getProfiles();
    setProfiles(all);
    setActiveProfile(saved);
    setQuickLabel('');
    setQuickValue('');
    setQuickSensitive(false);
    setIsQuickAdding(false);
    showToast(t.messages.fieldAdded, 'success');
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
    setRevealedCardIds({});
    setReauthPendingAction(null);
  };

  const checkCardReauthRequired = (): boolean => {
    const maxMins = settings.cardReauthMinutes ?? 5;
    return vaultManager.requiresCardReauth(maxMins);
  };

  const handleToggleRevealCard = (cardId: string) => {
    if (revealedCardIds[cardId]) {
      setRevealedCardIds((prev) => ({ ...prev, [cardId]: false }));
      return;
    }
    if (checkCardReauthRequired()) {
      setReauthError('');
      setReauthPassphrase('');
      setReauthPendingAction({ kind: 'reveal', cardId });
      return;
    }
    setRevealedCardIds((prev) => ({ ...prev, [cardId]: true }));
  };

  const handleCopyCardNumber15s = async (cardNumber: string) => {
    if (checkCardReauthRequired()) {
      setReauthError('');
      setReauthPassphrase('');
      setReauthPendingAction({ kind: 'copy', cardNumber });
      return;
    }
    const ok = await copyCardNumberWithAutoClear(cardNumber, 15000);
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        browser.tabs
          .sendMessage(tabs[0].id, {
            type: 'SCHEDULE_CLIPBOARD_CLEAR',
            value: cardNumber,
            delayMs: 15000,
          })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
    if (ok) {
      showToast(t.vault.cardCopiedAutoClear, 'success');
    } else {
      showToast(t.actions.copyFailed, 'error');
    }
  };

  const handleRequestFillCard = (card: PaymentCard) => {
    if (checkCardReauthRequired()) {
      setReauthError('');
      setReauthPassphrase('');
      setReauthPendingAction({ kind: 'fill', card });
      return;
    }
    setEphemeralCvv('');
    if (settings.confirmBeforePaymentFill) {
      setCardToConfirmFill(card);
    } else {
      executeCardFill(card);
    }
  };

  const handleVerifyReauth = async () => {
    setReauthError('');
    try {
      await vaultManager.reauthenticate(reauthPassphrase);
      const pending = reauthPendingAction;
      setReauthPendingAction(null);
      setReauthPassphrase('');
      if (!pending) return;

      if (pending.kind === 'reveal') {
        setRevealedCardIds((prev) => ({ ...prev, [pending.cardId]: true }));
      } else if (pending.kind === 'copy') {
        await copyCardNumberWithAutoClear(pending.cardNumber, 15000);
        try {
          const tabs = await browser.tabs.query({ active: true, currentWindow: true });
          if (tabs[0]?.id) {
            browser.tabs
              .sendMessage(tabs[0].id, {
                type: 'SCHEDULE_CLIPBOARD_CLEAR',
                value: pending.cardNumber,
                delayMs: 15000,
              })
              .catch(() => {});
          }
        } catch {
          // ignore
        }
        showToast(t.vault.cardCopiedAutoClear, 'success');
      } else if (pending.kind === 'fill') {
        setEphemeralCvv('');
        if (settings.confirmBeforePaymentFill) {
          setCardToConfirmFill(pending.card);
        } else {
          await executeCardFill(pending.card);
        }
      }
    } catch {
      setReauthError(t.vault.invalidPassphrase);
    }
  };

  const executeCardFill = async (card: PaymentCard, oneTimeCvv?: string) => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      if (!activeTab?.id) return;

      const res = (await browser.tabs.sendMessage(activeTab.id, {
        type: 'FILL_PAYMENT_CARD',
        card,
        confirmed: true,
        ephemeralCvv: oneTimeCvv?.trim() || undefined,
      })) as {
        success: boolean;
        count?: number;
        error?: string;
        hasCrossOriginPaymentIframe?: boolean;
      };

      if (res && res.success && res.count && res.count > 0) {
        showToast(formatString(t.actions.filled, { count: res.count }), 'success');
      } else if (res && !res.success && res.error) {
        showToast(res.error, 'error');
      } else if (res && res.hasCrossOriginPaymentIframe) {
        showToast('Payment iframe detected. Copying card number with 15s auto-clear...', 'info');
        await copyCardNumberWithAutoClear(card.cardNumber, 15000);
      } else {
        showToast(t.messages.noFormFound, 'info');
      }
    } catch {
      showToast(t.messages.cardFillError, 'error');
    } finally {
      setCardToConfirmFill(null);
      setEphemeralCvv('');
    }
  };

  // Backup reminder banner check (shows if user has fields and hasn't exported or dismissed within backupReminderDays)
  const shouldShowBackupReminder = useMemo(() => {
    const totalFields = profiles.reduce(
      (sum, p) => sum + p.fields.filter((f) => f.value.trim().length > 0).length,
      0,
    );
    if (totalFields === 0) return false;
    const reminderDays = settings.backupReminderDays ?? 14;
    const thresholdMs = reminderDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    if (
      settings.backupReminderDismissedAt &&
      now - settings.backupReminderDismissedAt < thresholdMs
    ) {
      return false;
    }
    if (!settings.lastBackupExportedAt) {
      return true;
    }
    return now - settings.lastBackupExportedAt >= thresholdMs;
  }, [
    profiles,
    settings.backupReminderDays,
    settings.lastBackupExportedAt,
    settings.backupReminderDismissedAt,
  ]);

  const handleQuickDownloadBackup = async () => {
    const vault = await repo.loadVault();
    const envelope = exportPlainJson(vault);
    const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stashfill-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    const updated = await repo.updateSettings({ lastBackupExportedAt: Date.now() });
    setSettings(updated);
    showToast(t.messages.exportDownloaded, 'success');
  };

  const handleDismissBackupReminder = async () => {
    const updated = await repo.updateSettings({ backupReminderDismissedAt: Date.now() });
    setSettings(updated);
  };

  // Sorted & filtered field list: sorted by recent (lastUsedAt desc) then most used (useCount desc)
  const visibleItems = useMemo(() => {
    if (!activeProfile || !activeProfile.fields) return [];

    const nonEmptyFields = activeProfile.fields.filter((f) => f.value && f.value.trim().length > 0);

    const sorted = [...nonEmptyFields].sort((a, b) => {
      const lastA = a.lastUsedAt ?? 0;
      const lastB = b.lastUsedAt ?? 0;
      if (lastB !== lastA) return lastB - lastA;
      return (b.useCount ?? 0) - (a.useCount ?? 0);
    });

    const mapped = sorted.map((field) => ({
      id: field.id,
      label: field.label,
      value: field.value,
      group: field.category || t.sections.personal,
      key: field.key,
      sensitive: field.sensitive,
      useCount: field.useCount,
    }));

    if (!searchQuery.trim()) return mapped;

    const q = searchQuery.toLowerCase();
    return mapped.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (!item.sensitive && item.value.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q),
    );
  }, [activeProfile, searchQuery, t]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cardToConfirmFill) {
          setCardToConfirmFill(null);
        } else if (isQuickAdding) {
          setIsQuickAdding(false);
        } else if (searchQuery) {
          setSearchQuery('');
        }
        return;
      }

      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        if (visibleItems.length > 0) {
          e.preventDefault();
          setSelectedItemIndex((prev) => (prev < visibleItems.length - 1 ? prev + 1 : 0));
        }
      } else if (e.key === 'ArrowUp') {
        if (visibleItems.length > 0) {
          e.preventDefault();
          setSelectedItemIndex((prev) => (prev > 0 ? prev - 1 : visibleItems.length - 1));
        }
      } else if (
        e.key === 'Enter' &&
        selectedItemIndex >= 0 &&
        document.activeElement === searchInputRef.current
      ) {
        const item = visibleItems[selectedItemIndex];
        if (item) {
          e.preventDefault();
          handleFillField(item.id, item.key, item.value, item.label, item.sensitive);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleItems, selectedItemIndex, cardToConfirmFill, isQuickAdding, searchQuery]);

  return (
    <div
      dir="auto"
      class="flex max-h-[580px] w-[360px] flex-col overflow-hidden bg-white font-sans text-slate-900 dark:bg-slate-900 dark:text-slate-100"
    >
      {/* Header */}
      <header class="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-800 dark:bg-slate-900">
        <div class="flex items-center gap-2">
          <div
            aria-hidden="true"
            class="flex h-6 w-6 items-center justify-center rounded bg-brand-600 text-xs font-bold tracking-tighter text-white"
          >
            SF
          </div>
          <h1 class="text-sm font-bold text-slate-900 dark:text-white">{t.appName}</h1>
          <span class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            {t.offlineBadge}
          </span>
        </div>

        <div class="flex items-center gap-1">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleToggleLanguage}
            title={t.settings.language}
            aria-label={t.settings.language}
            class="rounded px-1.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {settings.language === 'en' ? 'বাংলা' : 'EN'}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleTheme}
            title={t.settings.theme}
            aria-label={t.settings.theme}
            class="rounded p-1 text-slate-700 transition-colors hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {settings.theme === 'dark' ? (
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
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
            class="rounded p-1 text-slate-700 transition-colors hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg
              class="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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

      <main class="flex flex-1 flex-col overflow-hidden">
        {/* Backup Reminder Banner (no notification permission) */}
        {shouldShowBackupReminder && (
          <div
            role="region"
            aria-label={t.settings.exportImportTitle}
            class="flex shrink-0 items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <span class="leading-tight">{t.settings.backupReminderBanner}</span>
            <div class="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleQuickDownloadBackup}
                class="rounded bg-amber-700 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-800"
              >
                {t.settings.backupReminderDownload}
              </button>
              <button
                type="button"
                onClick={handleDismissBackupReminder}
                aria-label={t.settings.backupReminderDismiss}
                class="rounded px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-200/60 dark:text-amber-200 dark:hover:bg-amber-900/50"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Profile Bar & Primary Actions */}
        <div class="shrink-0 space-y-2 border-b border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div class="flex items-center gap-2">
            <label
              for="profile-select"
              class="shrink-0 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              {t.settings.activeProfile}:
            </label>
            <select
              id="profile-select"
              value={activeProfile?.id ?? ''}
              onChange={(e) => handleProfileChange((e.target as HTMLSelectElement).value)}
              class="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {isProfileDefault(p) ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          <div class="flex items-center gap-1.5">
            {/* 1-Click Form Fill Button */}
            <button
              type="button"
              onClick={handleFillEntireForm}
              class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <svg
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{t.actions.fillForm}</span>
            </button>

            {/* Quick Add Field Button */}
            <button
              type="button"
              onClick={() => setIsQuickAdding((prev) => !prev)}
              aria-expanded={isQuickAdding}
              aria-label={t.actions.quickAdd}
              title={t.actions.quickAdd}
              class="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              + {t.actions.add}
            </button>
          </div>

          {/* Quick Add Field Inline Drawer */}
          {isQuickAdding && (
            <form
              onSubmit={handleQuickAddField}
              aria-label={t.actions.quickAdd}
              class="space-y-2 rounded-md border border-brand-200 bg-brand-50/50 p-2.5 dark:border-brand-800 dark:bg-brand-950/30"
            >
              <div class="grid grid-cols-2 gap-1.5">
                <div>
                  <label
                    for="quick-field-label"
                    class="mb-0.5 block text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t.fields.fieldLabel}
                  </label>
                  <input
                    id="quick-field-label"
                    type="text"
                    required
                    value={quickLabel}
                    onInput={(e) => setQuickLabel((e.target as HTMLInputElement).value)}
                    placeholder={t.fields.newFieldPlaceholder}
                    class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    for="quick-field-value"
                    class="mb-0.5 block text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                  >
                    {t.fields.fieldValue}
                  </label>
                  <input
                    id="quick-field-value"
                    type="text"
                    required
                    value={quickValue}
                    onInput={(e) => setQuickValue((e.target as HTMLInputElement).value)}
                    placeholder={t.fields.valuePlaceholder}
                    class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              <div class="flex items-center justify-between pt-1">
                <label class="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={quickSensitive}
                    onChange={(e) => setQuickSensitive((e.target as HTMLInputElement).checked)}
                    class="rounded border-slate-300 text-brand-600"
                  />
                  <span>{t.fields.sensitiveField}</span>
                </label>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsQuickAdding(false)}
                    class="rounded px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    type="submit"
                    class="rounded bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-700"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Search Input */}
          <div class="relative">
            <label for="popup-search-input" class="sr-only">
              {t.actions.search}
            </label>
            <input
              id="popup-search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onInput={(e) => {
                setSearchQuery((e.target as HTMLInputElement).value);
                setSelectedItemIndex(0);
              }}
              placeholder={t.actions.search}
              class="w-full rounded-md border border-slate-300 bg-slate-50 py-1.5 pe-7 ps-7 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <svg
              class="absolute start-2 top-2 h-3.5 w-3.5 text-slate-500 dark:text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
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
                aria-label={t.actions.clearSearch}
                class="absolute end-2 top-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Main List Area */}
        <div class="flex-1 space-y-1 divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800/50">
          {visibleItems.length === 0 ? (
            <div class="py-6 text-center text-xs text-slate-600 dark:text-slate-300">
              {searchQuery ? t.emptyStates.noFieldsMatchSearch : t.emptyStates.noFieldsInProfile}
            </div>
          ) : (
            <div role="list" class="space-y-0.5">
              {visibleItems.map((item, idx) => (
                <StashItemRow
                  key={item.id}
                  label={item.label}
                  value={item.value}
                  sensitive={item.sensitive}
                  useCount={item.useCount}
                  usedBadgeText={
                    item.useCount > 0
                      ? formatString(t.fields.mostUsedBadge, { count: item.useCount })
                      : undefined
                  }
                  fillLabel={t.actions.fillField}
                  copyLabel={t.actions.copy}
                  revealLabel={t.actions.reveal}
                  hideLabel={t.actions.hide}
                  isSelected={idx === selectedItemIndex}
                  onFill={() =>
                    handleFillField(item.id, item.key, item.value, item.label, item.sensitive)
                  }
                  onCopy={() => handleCopy(item.id, item.value)}
                />
              ))}
            </div>
          )}

          {/* Secure Vault Section */}
          <section aria-labelledby="popup-vault-heading" class="mt-2 pt-2">
            <div class="flex items-center justify-between px-2 py-1">
              <h2
                id="popup-vault-heading"
                class="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                <svg
                  class="h-3 w-3 text-brand-600 dark:text-brand-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>{t.vault.title}</span>
              </h2>

              {vaultUnlocked && (
                <button
                  type="button"
                  onClick={handleLockVault}
                  class="text-[11px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  {t.actions.lock}
                </button>
              )}
            </div>

            {!vaultInitialized ? (
              <div class="rounded bg-slate-50 p-2.5 text-center text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                <span>{t.vault.setupPassphrase}</span>
                <button
                  type="button"
                  onClick={openOptionsPage}
                  class="mx-auto mt-1 block font-semibold text-brand-700 hover:underline dark:text-brand-300"
                >
                  {t.actions.options}
                </button>
              </div>
            ) : !vaultUnlocked ? (
              <div class="space-y-2 rounded bg-slate-50 p-2.5 dark:bg-slate-800/40">
                <div class="flex items-center gap-1.5">
                  <label for="popup-vault-passphrase" class="sr-only">
                    {t.vault.enterPassphrase}
                  </label>
                  <input
                    id="popup-vault-passphrase"
                    type="password"
                    value={vaultPassphrase}
                    onInput={(e) => setVaultPassphrase((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
                    placeholder={t.vault.enterPassphrase}
                    class="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={handleUnlockVault}
                    class="rounded bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    {t.actions.unlock}
                  </button>
                </div>
                {vaultError && (
                  <p role="alert" class="text-[11px] font-medium text-rose-700 dark:text-rose-400">
                    {vaultError}
                  </p>
                )}
              </div>
            ) : (
              <div class="space-y-1.5 p-1">
                {reauthPendingAction && (
                  <div class="space-y-1.5 rounded border border-amber-300 bg-amber-50 p-2 dark:border-amber-800 dark:bg-amber-950/40">
                    <p class="text-[11px] font-semibold text-amber-950 dark:text-amber-200">
                      {formatString(t.vault.reauthRequiredDesc, {
                        minutes: settings.cardReauthMinutes ?? 5,
                      })}
                    </p>
                    <div class="flex items-center gap-1.5">
                      <label for="popup-reauth-passphrase" class="sr-only">
                        {t.vault.enterPassphrase}
                      </label>
                      <input
                        id="popup-reauth-passphrase"
                        type="password"
                        value={reauthPassphrase}
                        onInput={(e) => setReauthPassphrase((e.target as HTMLInputElement).value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyReauth()}
                        placeholder={t.vault.enterPassphrase}
                        class="flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyReauth}
                        class="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        {t.actions.confirm}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReauthPendingAction(null)}
                        class="rounded px-1.5 py-1 text-xs text-slate-700 hover:bg-slate-200 dark:text-slate-300"
                      >
                        {t.actions.cancel}
                      </button>
                    </div>
                    {reauthError && (
                      <p
                        role="alert"
                        class="text-[10px] font-medium text-rose-700 dark:text-rose-400"
                      >
                        {reauthError}
                      </p>
                    )}
                  </div>
                )}

                {cards.length === 0 ? (
                  <p class="px-2 py-1 text-xs text-slate-600 dark:text-slate-300">
                    {t.vault.noCardsYet}
                  </p>
                ) : (
                  cards.map((card) => {
                    const isRevealed = Boolean(revealedCardIds[card.id]);
                    return (
                      <div
                        key={card.id}
                        class="flex items-center justify-between rounded border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-700 dark:bg-slate-800/40"
                      >
                        <div>
                          <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                            <CardBrandIcon brand={card.brand} />
                            <span>{card.nickname}</span>
                          </div>
                          <div class="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <span>
                              {isRevealed ? card.cardNumber : maskCardNumber(card.cardNumber)} (
                              {card.expMonth}/{card.expYear})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleRevealCard(card.id)}
                              aria-label={`${
                                isRevealed ? t.vault.hideCardNumber : t.vault.revealCardNumber
                              }: ${card.nickname}`}
                              title={isRevealed ? t.vault.hideCardNumber : t.vault.revealCardNumber}
                              class="rounded px-1 font-sans text-[10px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
                            >
                              {isRevealed
                                ? t.actions.hide.split(' ')[0]
                                : t.actions.reveal.split(' ')[0]}
                            </button>
                          </div>
                        </div>

                        <div class="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyCardNumber15s(card.cardNumber)}
                            aria-label={`${t.vault.copyCardNumber15s}: ${card.nickname}`}
                            title={t.vault.copyCardNumber15s}
                            class="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {t.actions.copy}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestFillCard(card)}
                            aria-label={`${t.actions.fillCard} ${card.nickname}`}
                            class="rounded border border-amber-600/40 bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-500/25 dark:text-amber-200"
                          >
                            {t.actions.fillCard}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Confirmation Modal for Sensitive Payment Card Fill (Principle 6 + runtime CVV prompt if not saved) */}
      {cardToConfirmFill !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.vault.confirmFillTitle}
          class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3"
        >
          <div class="w-full max-w-xs space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white">
              {t.vault.confirmFillTitle}
            </h3>
            <p class="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
              {formatString(t.vault.confirmFillWarning, {
                nickname: cardToConfirmFill.nickname,
                masked: maskCardNumber(cardToConfirmFill.cardNumber),
              })}
            </p>
            {!cardToConfirmFill.cvv && (
              <div>
                <label
                  for="popup-ephemeral-cvv"
                  class="mb-1 block text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                >
                  {t.vault.ephemeralCvvLabel}
                </label>
                <input
                  id="popup-ephemeral-cvv"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={ephemeralCvv}
                  onInput={(e) => setEphemeralCvv((e.target as HTMLInputElement).value)}
                  placeholder={t.vault.cvvPlaceholder}
                  class="w-full rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p class="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                  {t.vault.ephemeralCvvHint}
                </p>
              </div>
            )}
            <div class="flex justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCardToConfirmFill(null);
                  setEphemeralCvv('');
                }}
                class="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {t.actions.cancel}
              </button>
              <button
                type="button"
                onClick={() => executeCardFill(cardToConfirmFill, ephemeralCvv)}
                class="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {t.vault.confirmFillButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} closeLabel={t.actions.close} />
    </div>
  );
}
