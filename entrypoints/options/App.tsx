import { useState, useEffect, useMemo } from 'preact/hooks';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter';
import { StashRepository } from '../../src/storage/StashRepository';
import { VaultManager } from '../../src/vault/vaultManager';
import {
  type Profile,
  type Field,
  type Settings,
  DEFAULT_SETTINGS,
} from '../../src/core/schemas/vault';
import { createPersonalTemplate, TEMPLATE_REGISTRY } from '../../src/core/templates';
import { validateLuhn, detectCardBrand, maskCardNumber } from '../../src/core/luhn';
import { type PaymentCard } from '../../src/types/vault';
import { getTranslations, formatString, type Language } from '../../src/i18n';
import { Toast, type ToastMessage } from '../../src/components/Toast';
import { ConfirmModal } from '../../src/components/ConfirmModal';

type Tab = 'profiles' | 'vault' | 'backup' | 'settings';

function getFieldValue(profile: Profile | null, key: string): string {
  if (!profile || !profile.fields) return '';
  const f = profile.fields.find((field) => field.key === key);
  return f ? f.value : '';
}

function updateFieldValue(
  profile: Profile,
  key: string,
  value: string,
  defaultLabel: string,
  category = 'general',
): Profile {
  const fields = [...profile.fields];
  const idx = fields.findIndex((f) => f.key === key);
  const now = Date.now();
  const existing = fields[idx];
  if (idx >= 0 && existing) {
    fields[idx] = {
      ...existing,
      value,
      updatedAt: now,
    };
  } else {
    fields.push({
      id: `f_${now}_${Math.random().toString(36).substring(2, 7)}`,
      key,
      label: defaultLabel,
      value,
      type: 'text',
      category,
      tags: [category],
      sensitive: false,
      createdAt: now,
      updatedAt: now,
      useCount: 0,
      lastUsedAt: null,
    });
  }
  return { ...profile, fields };
}

const CANONICAL_KEYS_SET = new Set([
  'full_name',
  'first_name',
  'last_name',
  'email',
  'phone',
  'mobile',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
  'website',
  'github',
  'linkedin',
  'twitter',
]);

export function App() {
  const [repo] = useState(() => new StashRepository(new LocalStorageAdapter()));
  const [vaultManager] = useState(() => new VaultManager(repo));

  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [profileForm, setProfileForm] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Vault state
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [newVaultPassphrase, setNewVaultPassphrase] = useState('');
  const [confirmVaultPassphrase, setConfirmVaultPassphrase] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [cards, setCards] = useState<PaymentCard[]>([]);

  // Card modal / form
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardNickname, setCardNickname] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('01');
  const [expYear, setExpYear] = useState('28');
  const [cvv, setCvv] = useState('');

  // Delete modal
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [cardToDelete, setCardToDelete] = useState<PaymentCard | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const t = useMemo(() => getTranslations(settings.language as Language), [settings.language]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ id: String(Date.now()), text, type });
    setTimeout(() => {
      setToast((cur) => (cur?.text === text ? null : cur));
    }, 3000);
  };

  // Load initial data
  useEffect(() => {
    async function init() {
      let allProfiles = await repo.getProfiles();
      if (allProfiles.length === 0) {
        const initial = createPersonalTemplate('Personal');
        await repo.upsertProfile(initial);
        allProfiles = [initial];
      }

      const [activeId, curSettings, isInit] = await Promise.all([
        repo.getActiveProfileId(),
        repo.getSettings(),
        vaultManager.isInitialized(),
      ]);

      setProfiles(allProfiles);
      const chosenId = activeId || allProfiles[0]?.id || '';
      setSelectedProfileId(chosenId);
      const sel = allProfiles.find((p) => p.id === chosenId) ?? allProfiles[0]!;
      setProfileForm({ ...sel });
      setSettings(curSettings);
      setVaultInitialized(isInit);

      applyTheme(curSettings.theme);
    }
    init();
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

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    const p = profiles.find((item) => item.id === id);
    if (p) {
      setProfileForm({ ...p });
    }
  };

  const handleSaveProfile = async () => {
    if (!profileForm) return;
    try {
      const saved = await repo.upsertProfile(profileForm);
      const updatedList = await repo.getProfiles();
      setProfiles(updatedList);
      setProfileForm({ ...saved });
      showToast(t.messages.profileSaved, 'success');
    } catch {
      showToast('Error saving profile', 'error');
    }
  };

  const handleCreateProfile = async (templateKey = 'personal') => {
    const foundTemplate = TEMPLATE_REGISTRY.find((t) => t.id === templateKey);
    const createFn = foundTemplate?.create || createPersonalTemplate;
    const newProf = createFn(`Profile ${profiles.length + 1}`);
    const saved = await repo.upsertProfile(newProf);
    const updated = await repo.getProfiles();
    setProfiles(updated);
    setSelectedProfileId(saved.id);
    setProfileForm({ ...saved });
    showToast(t.messages.profileSaved, 'success');
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    await repo.deleteProfile(profileToDelete.id);
    const updated = await repo.getProfiles();
    const activeId = await repo.getActiveProfileId();
    setProfiles(updated);
    setSelectedProfileId(activeId);
    const sel = updated.find((p) => p.id === activeId) ?? updated[0]!;
    setProfileForm({ ...sel });
    setProfileToDelete(null);
    showToast(t.messages.profileDeleted, 'success');
  };

  // Custom field handlers
  const handleAddCustomField = () => {
    if (!profileForm) return;
    const now = Date.now();
    const newField: Field = {
      id: `cf_${now}_${Math.random().toString(36).substring(2, 7)}`,
      label: 'Custom Field',
      key: `custom_${now}`,
      value: '',
      type: 'text',
      category: 'custom',
      tags: ['custom'],
      sensitive: false,
      createdAt: now,
      updatedAt: now,
      useCount: 0,
      lastUsedAt: null,
    };
    setProfileForm({
      ...profileForm,
      fields: [...profileForm.fields, newField],
    });
  };

  const handleRemoveCustomField = (id: string) => {
    if (!profileForm) return;
    setProfileForm({
      ...profileForm,
      fields: profileForm.fields.filter((cf) => cf.id !== id),
    });
  };

  const handleUpdateCustomField = (id: string, updates: Partial<Field>) => {
    if (!profileForm) return;
    setProfileForm({
      ...profileForm,
      fields: profileForm.fields.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f,
      ),
    });
  };

  // Vault actions
  const handleSetupVault = async () => {
    setVaultError('');
    if (newVaultPassphrase.length < 6) {
      setVaultError('Passphrase must be at least 6 characters');
      return;
    }
    if (newVaultPassphrase !== confirmVaultPassphrase) {
      setVaultError(t.vault.passphraseMismatch);
      return;
    }

    try {
      await vaultManager.initializeVault(newVaultPassphrase);
      setVaultInitialized(true);
      setVaultUnlocked(true);
      setCards([]);
      setNewVaultPassphrase('');
      setConfirmVaultPassphrase('');
      showToast('Vault created and unlocked successfully!', 'success');
    } catch {
      setVaultError('Failed to initialize vault');
    }
  };

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

  const handleSaveCard = async () => {
    if (!cardNickname.trim() || !cardNumber.trim() || !cvv.trim()) {
      showToast('Please fill all required card fields', 'error');
      return;
    }

    const cleanedNumber = cardNumber.replace(/\s+/g, '');
    if (!validateLuhn(cleanedNumber)) {
      showToast('Card number failed Luhn validation', 'error');
      return;
    }

    const brand = detectCardBrand(cleanedNumber);
    const newCard: PaymentCard = {
      id: `card_${Date.now()}`,
      nickname: cardNickname.trim(),
      cardholderName: cardholderName.trim(),
      cardNumber: cleanedNumber,
      expMonth,
      expYear,
      cvv: cvv.trim(),
      brand:
        brand === 'visa' || brand === 'mastercard' || brand === 'amex' || brand === 'discover'
          ? brand
          : 'other',
      createdAt: Date.now(),
    };

    try {
      await vaultManager.saveCard(newCard);
      const updatedCards = await vaultManager.getCards();
      setCards(updatedCards);
      setIsAddingCard(false);
      setCardNickname('');
      setCardholderName('');
      setCardNumber('');
      setCvv('');
      showToast(t.messages.cardSaved, 'success');
    } catch {
      showToast('Failed to save card', 'error');
    }
  };

  const handleDeleteCard = async () => {
    if (!cardToDelete) return;
    try {
      await vaultManager.deleteCard(cardToDelete.id);
      const updatedCards = await vaultManager.getCards();
      setCards(updatedCards);
      setCardToDelete(null);
      showToast(t.messages.cardDeleted, 'success');
    } catch {
      showToast('Failed to delete card', 'error');
    }
  };

  // Export & Import
  const [includeVaultInExport, setIncludeVaultInExport] = useState(false);

  const handleExport = async () => {
    const data = await repo.exportData(includeVaultInExport);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stashfill-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export file downloaded', 'success');
  };

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await repo.importData(parsed);

      const [allProfiles, activeId, curSettings, isInit] = await Promise.all([
        repo.getProfiles(),
        repo.getActiveProfileId(),
        repo.getSettings(),
        vaultManager.isInitialized(),
      ]);

      setProfiles(allProfiles);
      setSelectedProfileId(activeId);
      const sel = allProfiles.find((p) => p.id === activeId) ?? allProfiles[0]!;
      setProfileForm({ ...sel });
      setSettings(curSettings);
      setVaultInitialized(isInit);

      showToast(formatString(t.settings.importSuccess, { count: result.profileCount }), 'success');
    } catch {
      showToast('Invalid backup file format', 'error');
    } finally {
      input.value = '';
    }
  };

  return (
    <div class="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Bar */}
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div class="flex items-center space-x-3">
            <div class="shadow-xs flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold tracking-tight text-white">
              SF
            </div>
            <div>
              <h1 class="text-base font-bold leading-none text-slate-900 dark:text-white">
                {t.appName}
              </h1>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.tagline}</p>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <span class="inline-flex items-center rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
              <span class="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
              {t.settings.privacyNote.split('.')[0]}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div class="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-4">
        {/* Navigation Sidebar */}
        <aside class="space-y-1 md:col-span-1">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            class={`flex w-full items-center space-x-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span>{t.settings.profilesTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            class={`flex w-full items-center space-x-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
              activeTab === 'vault'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>{t.vault.title}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            class={`flex w-full items-center space-x-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
              activeTab === 'backup'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>{t.settings.exportImportTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            class={`flex w-full items-center space-x-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
            }`}
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
            <span>{t.settings.title}</span>
          </button>
        </aside>

        {/* Content Pane */}
        <main class="shadow-xs rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:col-span-3">
          {/* TAB 1: PROFILES */}
          {activeTab === 'profiles' && (
            <div class="space-y-6">
              {/* Profile Selector & Add Bar */}
              <div class="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div class="flex items-center space-x-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p.id)}
                      class={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedProfileId === p.id
                          ? 'shadow-xs bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.name} {settings.defaultProfileId === p.id ? '★' : ''}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleCreateProfile('personal')}
                    class="rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-slate-700 dark:text-slate-400"
                  >
                    + {t.actions.add}
                  </button>
                </div>

                <div class="flex items-center space-x-2">
                  {profiles.length > 1 && profileForm && (
                    <button
                      type="button"
                      onClick={() => setProfileToDelete(profileForm)}
                      class="rounded-md px-2.5 py-1.5 text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      {t.actions.delete}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    class="shadow-xs rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </div>

              {profileForm && (
                <div class="space-y-6">
                  {/* Profile Header Fields */}
                  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t.settings.profileName}
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onInput={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: (e.target as HTMLInputElement).value,
                          })
                        }
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>

                    <div class="mt-6 flex items-center">
                      <label class="flex cursor-pointer items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={settings.defaultProfileId === profileForm.id}
                          onChange={async (e) => {
                            const isChecked = (e.target as HTMLInputElement).checked;
                            if (isChecked) {
                              await repo.setActiveProfileId(profileForm.id);
                              const cur = await repo.getSettings();
                              setSettings(cur);
                            }
                          }}
                          class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span>{t.settings.isDefaultProfile}</span>
                      </label>
                    </div>
                  </div>

                  {/* Section: Personal Info */}
                  <div>
                    <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {t.sections.personal}
                    </h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.fullName}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'full_name')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'full_name',
                                (e.target as HTMLInputElement).value,
                                t.fields.fullName,
                                'personal',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.firstName}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'first_name')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'first_name',
                                (e.target as HTMLInputElement).value,
                                t.fields.firstName,
                                'personal',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.lastName}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'last_name')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'last_name',
                                (e.target as HTMLInputElement).value,
                                t.fields.lastName,
                                'personal',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Contact Info */}
                  <div>
                    <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {t.sections.contact}
                    </h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.email}
                        </label>
                        <input
                          type="email"
                          value={getFieldValue(profileForm, 'email')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'email',
                                (e.target as HTMLInputElement).value,
                                t.fields.email,
                                'contact',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.phone}
                        </label>
                        <input
                          type="tel"
                          value={getFieldValue(profileForm, 'phone')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'phone',
                                (e.target as HTMLInputElement).value,
                                t.fields.phone,
                                'contact',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.altPhone}
                        </label>
                        <input
                          type="tel"
                          value={getFieldValue(profileForm, 'mobile')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'mobile',
                                (e.target as HTMLInputElement).value,
                                t.fields.altPhone,
                                'contact',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Address */}
                  <div>
                    <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {t.sections.address}
                    </h3>
                    <div class="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.address1}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'address_line1')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'address_line1',
                                (e.target as HTMLInputElement).value,
                                t.fields.address1,
                                'address',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.address2}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'address_line2')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'address_line2',
                                (e.target as HTMLInputElement).value,
                                t.fields.address2,
                                'address',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.city}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'city')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'city',
                                (e.target as HTMLInputElement).value,
                                t.fields.city,
                                'address',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.state}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'state')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'state',
                                (e.target as HTMLInputElement).value,
                                t.fields.state,
                                'address',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.postalCode}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'postal_code')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'postal_code',
                                (e.target as HTMLInputElement).value,
                                t.fields.postalCode,
                                'address',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.country}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'country')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'country',
                                (e.target as HTMLInputElement).value,
                                t.fields.country,
                                'address',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Links & Social */}
                  <div>
                    <h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      {t.sections.links}
                    </h3>
                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.website}
                        </label>
                        <input
                          type="url"
                          value={getFieldValue(profileForm, 'website')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'website',
                                (e.target as HTMLInputElement).value,
                                t.fields.website,
                                'links',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.github}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'github')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'github',
                                (e.target as HTMLInputElement).value,
                                t.fields.github,
                                'links',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.linkedin}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'linkedin')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'linkedin',
                                (e.target as HTMLInputElement).value,
                                t.fields.linkedin,
                                'links',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                          {t.fields.twitter}
                        </label>
                        <input
                          type="text"
                          value={getFieldValue(profileForm, 'twitter')}
                          onInput={(e) =>
                            setProfileForm(
                              updateFieldValue(
                                profileForm,
                                'twitter',
                                (e.target as HTMLInputElement).value,
                                t.fields.twitter,
                                'links',
                              ),
                            )
                          }
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Custom / Additional Fields */}
                  <div>
                    <div class="mb-3 flex items-center justify-between">
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {t.sections.custom}
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddCustomField}
                        class="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        + {t.actions.add}
                      </button>
                    </div>

                    <div class="space-y-2">
                      {profileForm.fields
                        .filter((f) => !CANONICAL_KEYS_SET.has(f.key))
                        .map((cf) => (
                          <div key={cf.id} class="flex items-center space-x-2">
                            <input
                              type="text"
                              value={cf.label}
                              onInput={(e) =>
                                handleUpdateCustomField(cf.id, {
                                  label: (e.target as HTMLInputElement).value,
                                })
                              }
                              placeholder="Label"
                              class="w-1/3 rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                            <input
                              type="text"
                              value={cf.value}
                              onInput={(e) =>
                                handleUpdateCustomField(cf.id, {
                                  value: (e.target as HTMLInputElement).value,
                                })
                              }
                              placeholder="Value"
                              class="flex-1 rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomField(cf.id)}
                              class="p-2 text-rose-500 hover:text-rose-700"
                              aria-label="Remove field"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENCRYPTED VAULT (PAYMENT CARDS) */}
          {activeTab === 'vault' && (
            <div class="space-y-6">
              <div>
                <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.vault.title}
                </h2>
                <p class="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {t.vault.description}
                </p>
              </div>

              {!vaultInitialized ? (
                <div class="max-w-md space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.vault.setupPassphrase}
                  </h3>
                  <div>
                    <input
                      type="password"
                      value={newVaultPassphrase}
                      onInput={(e) => setNewVaultPassphrase((e.target as HTMLInputElement).value)}
                      placeholder={t.vault.passphrasePlaceholder}
                      class="mb-2 w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                    <input
                      type="password"
                      value={confirmVaultPassphrase}
                      onInput={(e) =>
                        setConfirmVaultPassphrase((e.target as HTMLInputElement).value)
                      }
                      placeholder={t.vault.confirmPassphrasePlaceholder}
                      class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>
                  {vaultError && <p class="text-xs text-rose-500">{vaultError}</p>}
                  <button
                    type="button"
                    onClick={handleSetupVault}
                    class="shadow-xs w-full rounded-md bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    {t.actions.create}
                  </button>
                </div>
              ) : !vaultUnlocked ? (
                <div class="max-w-md space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
                  <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.vault.enterPassphrase}
                  </h3>
                  <input
                    type="password"
                    value={vaultPassphrase}
                    onInput={(e) => setVaultPassphrase((e.target as HTMLInputElement).value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
                    placeholder={t.vault.enterPassphrase}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  />
                  {vaultError && <p class="text-xs text-rose-500">{vaultError}</p>}
                  <button
                    type="button"
                    onClick={handleUnlockVault}
                    class="shadow-xs w-full rounded-md bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    {t.actions.unlock}
                  </button>
                </div>
              ) : (
                <div class="space-y-6">
                  <div class="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <span class="flex items-center space-x-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span>{t.vault.unlockedBadge}</span>
                    </span>
                    <div class="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingCard(true)}
                        class="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                      >
                        + {t.vault.addCard}
                      </button>
                      <button
                        type="button"
                        onClick={handleLockVault}
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        {t.actions.lock}
                      </button>
                    </div>
                  </div>

                  {/* Add Card Form */}
                  {isAddingCard && (
                    <div class="space-y-4 rounded-lg border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-950/20">
                      <h4 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {t.vault.addCard}
                      </h4>
                      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            {t.fields.nickname} *
                          </label>
                          <input
                            type="text"
                            value={cardNickname}
                            onInput={(e) => setCardNickname((e.target as HTMLInputElement).value)}
                            placeholder="e.g. Main Visa Debit"
                            class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            {t.fields.cardholderName}
                          </label>
                          <input
                            type="text"
                            value={cardholderName}
                            onInput={(e) => setCardholderName((e.target as HTMLInputElement).value)}
                            placeholder="Name as it appears on card"
                            class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        <div class="sm:col-span-2">
                          <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            {t.fields.cardNumber} *
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onInput={(e) => setCardNumber((e.target as HTMLInputElement).value)}
                            placeholder="16 digits"
                            class="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            {t.fields.expiry} (MM / YY) *
                          </label>
                          <div class="flex items-center space-x-2">
                            <input
                              type="text"
                              value={expMonth}
                              onInput={(e) => setExpMonth((e.target as HTMLInputElement).value)}
                              placeholder="01"
                              maxLength={2}
                              class="w-16 rounded-md border border-slate-300 bg-white p-2 text-center font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                            <span>/</span>
                            <input
                              type="text"
                              value={expYear}
                              onInput={(e) => setExpYear((e.target as HTMLInputElement).value)}
                              placeholder="28"
                              maxLength={4}
                              class="w-20 rounded-md border border-slate-300 bg-white p-2 text-center font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                            />
                          </div>
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-slate-600 dark:text-slate-400">
                            {t.fields.cvv} *
                          </label>
                          <input
                            type="password"
                            value={cvv}
                            onInput={(e) => setCvv((e.target as HTMLInputElement).value)}
                            placeholder="3-4 digits"
                            maxLength={4}
                            class="w-24 rounded-md border border-slate-300 bg-white p-2 text-center font-mono text-xs dark:border-slate-700 dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div class="flex items-center justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingCard(false)}
                          class="px-3 py-1.5 text-xs text-slate-600 hover:underline dark:text-slate-400"
                        >
                          {t.actions.cancel}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveCard}
                          class="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          {t.actions.save}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cards List */}
                  <div class="space-y-3">
                    {cards.length === 0 ? (
                      <p class="text-xs text-slate-500">{t.vault.noCardsYet}</p>
                    ) : (
                      cards.map((card) => (
                        <div
                          key={card.id}
                          class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30"
                        >
                          <div>
                            <div class="flex items-center space-x-2">
                              <span class="text-sm font-semibold text-slate-900 dark:text-white">
                                {card.nickname}
                              </span>
                              <span class="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                {card.brand}
                              </span>
                            </div>
                            <div class="mt-1 font-mono text-xs text-slate-500">
                              {maskCardNumber(card.cardNumber)} • Exp: {card.expMonth}/
                              {card.expYear}
                            </div>
                            {card.cardholderName && (
                              <div class="mt-0.5 text-xs text-slate-400">{card.cardholderName}</div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setCardToDelete(card)}
                            class="rounded-md px-2.5 py-1.5 text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            {t.actions.delete}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div class="space-y-6">
              <div>
                <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.settings.exportImportTitle}
                </h2>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t.settings.privacyNote}
                </p>
              </div>

              {/* Export Box */}
              <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-800/20">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.actions.export}
                </h3>
                <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.settings.exportDesc}
                </p>

                {vaultInitialized && (
                  <label class="flex cursor-pointer items-center space-x-2 pt-1 text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeVaultInExport}
                      onChange={(e) =>
                        setIncludeVaultInExport((e.target as HTMLInputElement).checked)
                      }
                      class="rounded border-slate-300 text-brand-600"
                    />
                    <span>{t.settings.exportWithVault}</span>
                  </label>
                )}

                <button
                  type="button"
                  onClick={handleExport}
                  class="shadow-xs mt-2 rounded-md bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  {t.actions.export}
                </button>
              </div>

              {/* Import Box */}
              <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-800/20">
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {t.actions.import}
                </h3>
                <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {t.settings.importDesc}
                </p>

                <label class="mt-2 inline-block cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <span>{t.actions.import}</span>
                  <input type="file" accept=".json" onChange={handleImport} class="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div class="space-y-6">
              <div>
                <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.settings.title}
                </h2>
              </div>

              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Language */}
                <div>
                  <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.settings.language}
                  </label>
                  <select
                    value={settings.language}
                    onChange={async (e) => {
                      const lang = (e.target as HTMLSelectElement).value as Language;
                      const updated = await repo.updateSettings({ language: lang });
                      setSettings(updated);
                    }}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="en">{t.settings.languages.en}</option>
                    <option value="bn">{t.settings.languages.bn}</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.settings.theme}
                  </label>
                  <select
                    value={settings.theme}
                    onChange={async (e) => {
                      const theme = (e.target as HTMLSelectElement).value as
                        'system' | 'light' | 'dark';
                      const updated = await repo.updateSettings({ theme });
                      setSettings(updated);
                      applyTheme(theme);
                    }}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="system">{t.settings.themes.system}</option>
                    <option value="light">{t.settings.themes.light}</option>
                    <option value="dark">{t.settings.themes.dark}</option>
                  </select>
                </div>

                {/* Vault auto-lock timeout */}
                <div>
                  <label class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.settings.vaultTimeout}
                  </label>
                  <select
                    value={settings.vaultTimeoutMinutes}
                    onChange={async (e) => {
                      const mins = Number((e.target as HTMLSelectElement).value);
                      const updated = await repo.updateSettings({
                        vaultTimeoutMinutes: mins,
                      });
                      setSettings(updated);
                    }}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes (recommended)</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>

                {/* Require Confirmation Before Payment Fill */}
                <div class="pt-2 sm:col-span-2">
                  <label class="flex cursor-pointer items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={settings.confirmBeforePaymentFill}
                      onChange={async (e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        const updated = await repo.updateSettings({
                          confirmBeforePaymentFill: checked,
                        });
                        setSettings(updated);
                      }}
                      class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{t.settings.confirmPaymentFill}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Profile Delete Confirmation */}
      <ConfirmModal
        isOpen={profileToDelete !== null}
        title="Delete Profile"
        message={`Are you sure you want to delete profile "${profileToDelete?.name}"?`}
        confirmLabel={t.actions.delete}
        cancelLabel={t.actions.cancel}
        isDestructive={true}
        onConfirm={handleDeleteProfile}
        onCancel={() => setProfileToDelete(null)}
      />

      {/* Card Delete Confirmation */}
      <ConfirmModal
        isOpen={cardToDelete !== null}
        title="Delete Card"
        message={`Are you sure you want to remove card "${cardToDelete?.nickname}" from your secure vault?`}
        confirmLabel={t.actions.delete}
        cancelLabel={t.actions.cancel}
        isDestructive={true}
        onConfirm={handleDeleteCard}
        onCancel={() => setCardToDelete(null)}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
