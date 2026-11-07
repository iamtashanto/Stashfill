import { useState, useEffect, useMemo } from 'preact/hooks';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter';
import { StashRepository } from '../../src/storage/StashRepository';
import { VaultManager } from '../../src/vault/vaultManager';
import {
  type Profile,
  type Field,
  type FieldType,
  type Snippet,
  type SiteRule,
  type Settings,
  DEFAULT_SETTINGS,
} from '../../src/core/schemas/vault';
import { CANONICAL_KEYS } from '../../src/core/canonical';
import { createPersonalTemplate, TEMPLATE_REGISTRY } from '../../src/core/templates';
import { maskCardNumber } from '../../src/core/luhn';
import { type PaymentCard } from '../../src/types/vault';
import { getTranslations, formatString, type Language } from '../../src/i18n';
import { CardBrandIcon } from '../../src/components/CardBrandIcon';
import { CardForm } from '../../src/components/CardForm';
import { OnboardingWizard } from '../../src/components/OnboardingWizard';
import { Toast, type ToastMessage } from '../../src/components/Toast';
import { ConfirmModal } from '../../src/components/ConfirmModal';

type Tab = 'profiles' | 'snippets' | 'vault' | 'siteRules' | 'backup' | 'settings';

export interface OptionsProps {
  repository?: StashRepository;
  vaultMgr?: VaultManager;
  defaultOpenOnboarding?: boolean;
}

const DEFAULT_CATEGORIES = ['personal', 'contact', 'address', 'work', 'social', 'custom'];
const FIELD_TYPES: FieldType[] = ['text', 'multiline', 'email', 'tel', 'url', 'date', 'select'];

export function App({ repository, vaultMgr, defaultOpenOnboarding = false }: OptionsProps = {}) {
  const [repo] = useState(() => repository ?? new StashRepository(new LocalStorageAdapter()));
  const [vaultManager] = useState(() => vaultMgr ?? new VaultManager(repo));

  const [activeTab, setActiveTab] = useState<Tab>('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [profileForm, setProfileForm] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Onboarding wizard state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(defaultOpenOnboarding);

  // Category filter & custom category state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Template selector for creating new profile
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('personal');

  // Drag-and-drop field index
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);

  // Snippets state
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [snippetTrigger, setSnippetTrigger] = useState('');
  const [snippetContent, setSnippetContent] = useState('');
  const [snippetFolder, setSnippetFolder] = useState('');
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

  // Site rules state
  const [siteRules, setSiteRules] = useState<SiteRule[]>([]);
  const [ruleHost, setRuleHost] = useState('');
  const [ruleBehavior, setRuleBehavior] = useState<'ask' | 'always' | 'never'>('ask');
  const [ruleProfileId, setRuleProfileId] = useState<string>('');

  // Vault state
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [newVaultPassphrase, setNewVaultPassphrase] = useState('');
  const [confirmVaultPassphrase, setConfirmVaultPassphrase] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [cards, setCards] = useState<PaymentCard[]>([]);

  // Card form state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);

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
      let curSettings = await repo.getSettings();
      if (allProfiles.length === 0) {
        const initial = createPersonalTemplate('Personal');
        await repo.upsertProfile(initial);
        await repo.setActiveProfileId(initial.id);
        allProfiles = [initial];
        curSettings = await repo.getSettings();
      }

      const [activeId, isInit, allSnippets, allRules] = await Promise.all([
        repo.getActiveProfileId(),
        vaultManager.isInitialized(),
        repo.getSnippets(),
        repo.getSiteRules(),
      ]);

      setProfiles(allProfiles);
      const chosenId = activeId || allProfiles[0]?.id || '';
      setSelectedProfileId(chosenId);
      const sel = allProfiles.find((p) => p.id === chosenId) ?? allProfiles[0]!;
      setProfileForm({ ...sel });
      setSettings(curSettings);
      setVaultInitialized(isInit);
      setSnippets(allSnippets);
      setSiteRules(allRules);

      applyTheme(curSettings.theme);
      document.documentElement.lang = curSettings.language;
    }
    init();
  }, [repo, vaultManager]);

  const isProfileDefault = (p: Profile | null) => {
    if (!p) return false;
    return settings.defaultProfileId
      ? settings.defaultProfileId === p.id
      : profiles[0]?.id === p.id;
  };

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

  const allCategories = useMemo(() => {
    const custom = settings.customCategories ?? [];
    const fieldCats = profileForm?.fields.map((f) => f.category).filter(Boolean) ?? [];
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...custom, ...fieldCats]));
  }, [settings.customCategories, profileForm]);

  const getCategoryLabel = (cat: string): string => {
    const secKey = cat as keyof typeof t.sections;
    return t.sections[secKey] || cat;
  };

  const getTemplateLabel = (id: string, fallback: string): string => {
    const key = id as keyof typeof t.templates;
    return t.templates[key] || fallback;
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
      showToast(t.messages.profileSaveError, 'error');
    }
  };

  const handleCreateProfile = async (templateKey = selectedTemplateId) => {
    const foundTemplate = TEMPLATE_REGISTRY.find((tpl) => tpl.id === templateKey);
    const createFn = foundTemplate?.create || createPersonalTemplate;
    const labelBase = foundTemplate
      ? getTemplateLabel(foundTemplate.id, foundTemplate.label)
      : t.templates.personal;
    const newProf = createFn(`${labelBase} ${profiles.length + 1}`);
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
    setProfileForm(sel ? { ...sel } : null);
    setProfileToDelete(null);
    showToast(t.messages.profileDeleted, 'success');
  };

  // Onboarding completion handler
  const handleCompleteOnboarding = async (templateIds: string[]) => {
    for (const tplId of templateIds) {
      const found = TEMPLATE_REGISTRY.find((item) => item.id === tplId);
      if (found) {
        const created = found.create(getTemplateLabel(found.id, found.label));
        await repo.upsertProfile(created);
      }
    }
    const updatedSettings = await repo.updateSettings({ onboardingCompleted: true });
    const allProfiles = await repo.getProfiles();
    setSettings(updatedSettings);
    setProfiles(allProfiles);
    if (allProfiles[0]) {
      setSelectedProfileId(allProfiles[0].id);
      setProfileForm({ ...allProfiles[0] });
    }
    setIsOnboardingOpen(false);
    showToast(t.messages.profileSaved, 'success');
  };

  const handleSkipOnboarding = async () => {
    const updatedSettings = await repo.updateSettings({ onboardingCompleted: true });
    setSettings(updatedSettings);
    setIsOnboardingOpen(false);
  };

  // Field CRUD & Reorder handlers
  const handleAddField = () => {
    if (!profileForm) return;
    const now = Date.now();
    const category = selectedCategory === 'all' ? 'custom' : selectedCategory;
    const newField: Field = {
      id: `f_${now}_${Math.random().toString(36).substring(2, 7)}`,
      label: t.sections.custom,
      key: `custom_${now}`,
      value: '',
      type: 'text',
      category,
      tags: [category],
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

  const handleRemoveField = (id: string) => {
    if (!profileForm) return;
    setProfileForm({
      ...profileForm,
      fields: profileForm.fields.filter((f) => f.id !== id),
    });
  };

  const handleUpdateField = (id: string, updates: Partial<Field>) => {
    if (!profileForm) return;
    setProfileForm({
      ...profileForm,
      fields: profileForm.fields.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f,
      ),
    });
  };

  const handleMoveField = (index: number, direction: -1 | 1) => {
    if (!profileForm) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= profileForm.fields.length) return;
    const updatedFields = [...profileForm.fields];
    const [moved] = updatedFields.splice(index, 1);
    if (!moved) return;
    updatedFields.splice(targetIndex, 0, moved);
    setProfileForm({ ...profileForm, fields: updatedFields });
  };

  const handleDragStart = (index: number) => {
    setDraggedFieldIndex(index);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (!profileForm || draggedFieldIndex === null || draggedFieldIndex === targetIndex) {
      setDraggedFieldIndex(null);
      return;
    }
    const updatedFields = [...profileForm.fields];
    const [moved] = updatedFields.splice(draggedFieldIndex, 1);
    if (moved) {
      updatedFields.splice(targetIndex, 0, moved);
      setProfileForm({ ...profileForm, fields: updatedFields });
    }
    setDraggedFieldIndex(null);
  };

  // Custom Category CRUD
  const handleAddCategory = async (e: Event) => {
    e.preventDefault();
    const cleaned = newCategoryName.trim().toLowerCase();
    if (!cleaned) return;
    const current = settings.customCategories ?? [];
    if (!current.includes(cleaned)) {
      const updated = await repo.updateSettings({
        customCategories: [...current, cleaned],
      });
      setSettings(updated);
    }
    setNewCategoryName('');
    setSelectedCategory(cleaned);
  };

  // Snippets CRUD
  const handleSaveSnippet = async (e: Event) => {
    e.preventDefault();
    if (!snippetTrigger.trim() || !snippetContent.trim()) return;
    const snippet: Snippet = {
      id: editingSnippetId ?? `snip_${Date.now()}`,
      trigger: snippetTrigger.trim(),
      content: snippetContent.trim(),
      folder: snippetFolder.trim() || 'general',
    };
    await repo.upsertSnippet(snippet);
    const updated = await repo.getSnippets();
    setSnippets(updated);
    setSnippetTrigger('');
    setSnippetContent('');
    setSnippetFolder('');
    setEditingSnippetId(null);
    showToast(t.snippets.saved, 'success');
  };

  const handleEditSnippet = (snip: Snippet) => {
    setEditingSnippetId(snip.id);
    setSnippetTrigger(snip.trigger);
    setSnippetContent(snip.content);
    setSnippetFolder(snip.folder);
  };

  const handleDeleteSnippet = async (id: string) => {
    await repo.deleteSnippet(id);
    const updated = await repo.getSnippets();
    setSnippets(updated);
    showToast(t.snippets.deleted, 'success');
  };

  // Site Rules CRUD
  const handleSaveSiteRule = async (e: Event) => {
    e.preventDefault();
    if (!ruleHost.trim()) return;
    const rule: SiteRule = {
      id: `rule_${Date.now()}`,
      host: ruleHost.trim().toLowerCase(),
      autoFillRule: ruleBehavior,
      profileId: ruleProfileId || null,
      disabledFields: [],
    };
    await repo.upsertSiteRule(rule);
    const updated = await repo.getSiteRules();
    setSiteRules(updated);
    setRuleHost('');
    showToast(t.siteRules.saved, 'success');
  };

  const handleDeleteSiteRule = async (id: string) => {
    await repo.deleteSiteRule(id);
    const updated = await repo.getSiteRules();
    setSiteRules(updated);
    showToast(t.siteRules.deleted, 'success');
  };

  // Vault actions
  const handleSetupVault = async () => {
    setVaultError('');
    if (newVaultPassphrase.length < 6) {
      setVaultError(t.vault.passphraseMinLength);
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
      showToast(t.messages.vaultSetupSuccess, 'success');
    } catch {
      setVaultError(t.messages.vaultSetupError);
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

  const handleSaveCardData = async (
    cardData: Omit<PaymentCard, 'id' | 'createdAt'> & { id?: string },
  ) => {
    const newCard: PaymentCard = {
      id: cardData.id ?? `card_${Date.now()}`,
      nickname: cardData.nickname,
      cardholderName: cardData.cardholderName,
      cardNumber: cardData.cardNumber,
      expMonth: cardData.expMonth,
      expYear: cardData.expYear,
      brand: cardData.brand,
      cvv: cardData.cvv,
      billingProfileId: cardData.billingProfileId,
      createdAt: editingCard?.createdAt ?? Date.now(),
    };

    try {
      await vaultManager.saveCard(newCard);
      const updatedCards = await vaultManager.getCards();
      setCards(updatedCards);
      setIsAddingCard(false);
      setEditingCard(null);
      showToast(t.messages.cardSaved, 'success');
    } catch {
      showToast(t.messages.cardSaveError, 'error');
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
      showToast(t.messages.cardDeleteError, 'error');
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
    showToast(t.messages.exportDownloaded, 'success');
  };

  const handleImport = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await repo.importData(parsed);

      const [allProfiles, activeId, curSettings, isInit, allSnips, allRules] = await Promise.all([
        repo.getProfiles(),
        repo.getActiveProfileId(),
        repo.getSettings(),
        vaultManager.isInitialized(),
        repo.getSnippets(),
        repo.getSiteRules(),
      ]);

      setProfiles(allProfiles);
      setSelectedProfileId(activeId);
      const sel = allProfiles.find((p) => p.id === activeId) ?? allProfiles[0]!;
      setProfileForm({ ...sel });
      setSettings(curSettings);
      setVaultInitialized(isInit);
      setSnippets(allSnips);
      setSiteRules(allRules);

      showToast(formatString(t.settings.importSuccess, { count: result.profileCount }), 'success');
    } catch {
      showToast(t.messages.importInvalid, 'error');
    } finally {
      input.value = '';
    }
  };

  const filteredFields = useMemo(() => {
    if (!profileForm) return [];
    if (selectedCategory === 'all') return profileForm.fields;
    return profileForm.fields.filter((f) => f.category === selectedCategory);
  }, [profileForm, selectedCategory]);

  return (
    <div
      dir="auto"
      class="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100"
    >
      {/* Top Bar */}
      <header class="sticky top-0 z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div class="flex items-center gap-3">
            <div
              aria-hidden="true"
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold tracking-tight text-white"
            >
              SF
            </div>
            <div>
              <h1 class="text-base font-bold leading-none text-slate-900 dark:text-white">
                {t.appName}
              </h1>
              <p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{t.tagline}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            {!settings.onboardingCompleted && (
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                class="rounded-md border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200"
              >
                {t.settings.reopenOnboarding}
              </button>
            )}
            <span class="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <span
                class="me-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600"
                aria-hidden="true"
              ></span>
              {t.settings.privacyNote.split('.')[0]}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div class="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-8 px-4 py-8 sm:px-6 md:grid-cols-4">
        {/* Navigation Sidebar */}
        <nav aria-label={t.settings.title} class="space-y-1 md:col-span-1">
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            aria-current={activeTab === 'profiles' ? 'page' : undefined}
            class={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
              activeTab === 'profiles'
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <span>{t.settings.profilesTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('snippets')}
            aria-current={activeTab === 'snippets' ? 'page' : undefined}
            class={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
              activeTab === 'snippets'
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <span>{t.snippets.title}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            aria-current={activeTab === 'vault' ? 'page' : undefined}
            class={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
              activeTab === 'vault'
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <span>{t.vault.title}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('siteRules')}
            aria-current={activeTab === 'siteRules' ? 'page' : undefined}
            class={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
              activeTab === 'siteRules'
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <span>{t.siteRules.title}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            aria-current={activeTab === 'backup' ? 'page' : undefined}
            class={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
              activeTab === 'backup'
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <span>{t.settings.exportImportTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            class={`flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/70 dark:text-brand-200'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <span>{t.settings.title}</span>
          </button>
        </nav>

        {/* Content Pane */}
        <main class="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:col-span-3">
          {/* TAB 1: PROFILES & FIELDS */}
          {activeTab === 'profiles' && (
            <div class="space-y-6">
              {/* Profile Selector & Template Picker Bar */}
              <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                <div class="flex flex-wrap items-center gap-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectProfile(p.id)}
                      class={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        selectedProfileId === p.id
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {p.name} {isProfileDefault(p) ? '★' : ''}
                    </button>
                  ))}

                  <div class="flex items-center gap-1">
                    <label for="new-profile-template" class="sr-only">
                      {t.templates.createFromTemplate}
                    </label>
                    <select
                      id="new-profile-template"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId((e.target as HTMLSelectElement).value)}
                      class="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {TEMPLATE_REGISTRY.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {getTemplateLabel(tpl.id, tpl.label)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleCreateProfile(selectedTemplateId)}
                      class="rounded-md border border-dashed border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-brand-500 hover:text-brand-700 dark:border-slate-600 dark:text-slate-200"
                    >
                      + {t.actions.add}
                    </button>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  {profiles.length > 1 && profileForm && (
                    <button
                      type="button"
                      onClick={() => setProfileToDelete(profileForm)}
                      class="rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    >
                      {t.actions.delete}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    class="rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
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
                      <label
                        for="profile-name-input"
                        class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {t.settings.profileName}
                      </label>
                      <input
                        id="profile-name-input"
                        type="text"
                        value={profileForm.name}
                        onInput={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: (e.target as HTMLInputElement).value,
                          })
                        }
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div class="mt-6 flex items-center">
                      <label class="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={isProfileDefault(profileForm)}
                          onChange={async (e) => {
                            const isChecked = (e.target as HTMLInputElement).checked;
                            if (isChecked) {
                              await repo.setActiveProfileId(profileForm.id);
                              const cur = await repo.getSettings();
                              setSettings(cur);
                            }
                          }}
                          class="rounded border-slate-300 text-brand-600"
                        />
                        <span>{t.settings.isDefaultProfile}</span>
                      </label>
                    </div>
                  </div>

                  {/* Category Filter & Management Bar */}
                  <div class="space-y-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div
                        role="group"
                        aria-label={t.categories.filterByCategory}
                        class="flex flex-wrap items-center gap-1"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedCategory('all')}
                          class={`rounded px-2.5 py-1 text-xs font-medium ${
                            selectedCategory === 'all'
                              ? 'bg-brand-600 text-white'
                              : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {t.sections.allCategories}
                        </button>
                        {allCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setSelectedCategory(cat)}
                            class={`rounded px-2.5 py-1 text-xs font-medium ${
                              selectedCategory === cat
                                ? 'bg-brand-600 text-white'
                                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {getCategoryLabel(cat)}
                          </button>
                        ))}
                      </div>

                      <form onSubmit={handleAddCategory} class="flex items-center gap-1">
                        <label for="new-category-input" class="sr-only">
                          {t.categories.categoryNamePlaceholder}
                        </label>
                        <input
                          id="new-category-input"
                          type="text"
                          value={newCategoryName}
                          onInput={(e) => setNewCategoryName((e.target as HTMLInputElement).value)}
                          placeholder={t.categories.categoryNamePlaceholder}
                          class="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="submit"
                          class="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          + {t.categories.addCategory}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Fields List with Full CRUD & Drag-and-Drop / Keyboard Reorder */}
                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <h2 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        {selectedCategory === 'all'
                          ? t.sections.allCategories
                          : getCategoryLabel(selectedCategory)}
                      </h2>
                      <button
                        type="button"
                        onClick={handleAddField}
                        class="rounded-md bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-200"
                      >
                        + {t.actions.quickAdd}
                      </button>
                    </div>

                    {filteredFields.length === 0 ? (
                      <p class="py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                        {t.emptyStates.noFieldsInProfile}
                      </p>
                    ) : (
                      <div role="list" class="space-y-2">
                        {filteredFields.map((field) => {
                          const realIndex = profileForm.fields.findIndex(
                            (item) => item.id === field.id,
                          );
                          return (
                            <div
                              key={field.id}
                              role="listitem"
                              draggable
                              onDragStart={() => handleDragStart(realIndex)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(realIndex)}
                              class="grid grid-cols-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-12"
                            >
                              {/* Reorder controls */}
                              <div class="flex items-center gap-1 sm:col-span-1">
                                <button
                                  type="button"
                                  onClick={() => handleMoveField(realIndex, -1)}
                                  disabled={realIndex <= 0}
                                  aria-label={`${t.actions.moveUp}: ${field.label}`}
                                  title={t.actions.moveUp}
                                  class="rounded p-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveField(realIndex, 1)}
                                  disabled={realIndex >= profileForm.fields.length - 1}
                                  aria-label={`${t.actions.moveDown}: ${field.label}`}
                                  title={t.actions.moveDown}
                                  class="rounded p-1 text-xs text-slate-600 hover:bg-slate-200 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  ↓
                                </button>
                              </div>

                              {/* Label */}
                              <div class="sm:col-span-3">
                                <label
                                  for={`field-label-${field.id}`}
                                  class="mb-0.5 block text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                                >
                                  {t.fields.fieldLabel}
                                </label>
                                <input
                                  id={`field-label-${field.id}`}
                                  type="text"
                                  value={field.label}
                                  onInput={(e) =>
                                    handleUpdateField(field.id, {
                                      label: (e.target as HTMLInputElement).value,
                                    })
                                  }
                                  class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                />
                              </div>

                              {/* Value */}
                              <div class="sm:col-span-4">
                                <label
                                  for={`field-value-${field.id}`}
                                  class="mb-0.5 block text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                                >
                                  {t.fields.fieldValue}
                                </label>
                                {field.type === 'multiline' ? (
                                  <textarea
                                    id={`field-value-${field.id}`}
                                    rows={2}
                                    value={field.value}
                                    onInput={(e) =>
                                      handleUpdateField(field.id, {
                                        value: (e.target as HTMLTextAreaElement).value,
                                      })
                                    }
                                    placeholder={t.fields.valuePlaceholder}
                                    class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                  />
                                ) : (
                                  <input
                                    id={`field-value-${field.id}`}
                                    type={field.sensitive ? 'password' : 'text'}
                                    value={field.value}
                                    onInput={(e) =>
                                      handleUpdateField(field.id, {
                                        value: (e.target as HTMLInputElement).value,
                                      })
                                    }
                                    placeholder={t.fields.valuePlaceholder}
                                    class="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                  />
                                )}
                              </div>

                              {/* Key & Category & Type */}
                              <div class="grid grid-cols-2 gap-1 sm:col-span-3">
                                <div>
                                  <label
                                    for={`field-cat-${field.id}`}
                                    class="mb-0.5 block text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                                  >
                                    {t.fields.fieldCategory}
                                  </label>
                                  <select
                                    id={`field-cat-${field.id}`}
                                    value={field.category}
                                    onChange={(e) =>
                                      handleUpdateField(field.id, {
                                        category: (e.target as HTMLSelectElement).value,
                                      })
                                    }
                                    class="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                  >
                                    {allCategories.map((c) => (
                                      <option key={c} value={c}>
                                        {getCategoryLabel(c)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label
                                    for={`field-type-${field.id}`}
                                    class="mb-0.5 block text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                                  >
                                    {t.fields.fieldType}
                                  </label>
                                  <select
                                    id={`field-type-${field.id}`}
                                    value={field.type}
                                    onChange={(e) =>
                                      handleUpdateField(field.id, {
                                        type: (e.target as HTMLSelectElement).value as FieldType,
                                      })
                                    }
                                    class="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                  >
                                    {FIELD_TYPES.map((ft) => (
                                      <option key={ft} value={ft}>
                                        {t.fieldTypes[ft]}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div class="col-span-2 flex items-center justify-between pt-0.5">
                                  <label class="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                    <input
                                      type="checkbox"
                                      checked={field.sensitive}
                                      onChange={(e) =>
                                        handleUpdateField(field.id, {
                                          sensitive: (e.target as HTMLInputElement).checked,
                                        })
                                      }
                                      class="rounded border-slate-300 text-brand-600"
                                    />
                                    <span>{t.fields.sensitiveField.split(' ')[0]}</span>
                                  </label>

                                  <label for={`field-key-${field.id}`} class="sr-only">
                                    {t.fields.fieldKey}
                                  </label>
                                  <select
                                    id={`field-key-${field.id}`}
                                    value={
                                      CANONICAL_KEYS.includes(
                                        field.key as (typeof CANONICAL_KEYS)[number],
                                      )
                                        ? field.key
                                        : 'custom'
                                    }
                                    onChange={(e) => {
                                      const val = (e.target as HTMLSelectElement).value;
                                      handleUpdateField(field.id, {
                                        key: val === 'custom' ? `custom_${Date.now()}` : val,
                                      });
                                    }}
                                    class="max-w-[95px] rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    {CANONICAL_KEYS.map((k) => (
                                      <option key={k} value={k}>
                                        {k}
                                      </option>
                                    ))}
                                    <option value="custom">custom</option>
                                  </select>
                                </div>
                              </div>

                              {/* Delete field button */}
                              <div class="flex justify-end sm:col-span-1">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveField(field.id)}
                                  aria-label={`${t.fields.removeField}: ${field.label}`}
                                  title={t.fields.removeField}
                                  class="rounded p-1.5 text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SNIPPETS */}
          {activeTab === 'snippets' && (
            <div class="space-y-6">
              <div class="border-b border-slate-200 pb-4 dark:border-slate-800">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                  {t.snippets.title}
                </h2>
                <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {t.snippets.description}
                </p>
              </div>

              <form
                onSubmit={handleSaveSnippet}
                aria-label={t.snippets.addSnippet}
                class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      for="snippet-trigger-input"
                      class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      {t.snippets.trigger} *
                    </label>
                    <input
                      id="snippet-trigger-input"
                      type="text"
                      required
                      value={snippetTrigger}
                      onInput={(e) => setSnippetTrigger((e.target as HTMLInputElement).value)}
                      placeholder={t.snippets.triggerPlaceholder}
                      class="w-full rounded-md border border-slate-300 bg-white p-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label
                      for="snippet-folder-input"
                      class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      {t.snippets.folder}
                    </label>
                    <input
                      id="snippet-folder-input"
                      type="text"
                      value={snippetFolder}
                      onInput={(e) => setSnippetFolder((e.target as HTMLInputElement).value)}
                      placeholder={t.snippets.folderPlaceholder}
                      class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label
                    for="snippet-content-input"
                    class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {t.snippets.content} *
                  </label>
                  <textarea
                    id="snippet-content-input"
                    rows={3}
                    required
                    value={snippetContent}
                    onInput={(e) => setSnippetContent((e.target as HTMLTextAreaElement).value)}
                    placeholder={t.snippets.contentPlaceholder}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div class="flex justify-end gap-2">
                  {editingSnippetId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSnippetId(null);
                        setSnippetTrigger('');
                        setSnippetContent('');
                        setSnippetFolder('');
                      }}
                      class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {t.actions.cancel}
                    </button>
                  )}
                  <button
                    type="submit"
                    class="rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    {t.actions.save}
                  </button>
                </div>
              </form>

              {snippets.length === 0 ? (
                <p class="py-6 text-center text-xs text-slate-600 dark:text-slate-300">
                  {t.snippets.emptyState}
                </p>
              ) : (
                <div role="list" class="space-y-2">
                  {snippets.map((snip) => (
                    <div
                      key={snip.id}
                      role="listitem"
                      class="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="rounded bg-brand-100 px-2 py-0.5 font-mono text-xs font-bold text-brand-900 dark:bg-brand-950 dark:text-brand-200">
                            {snip.trigger}
                          </span>
                          <span class="text-[11px] text-slate-600 dark:text-slate-400">
                            {snip.folder}
                          </span>
                        </div>
                        <p class="mt-1 text-xs text-slate-800 dark:text-slate-200">
                          {snip.content}
                        </p>
                      </div>
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditSnippet(snip)}
                          class="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300"
                        >
                          {t.actions.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSnippet(snip.id)}
                          class="rounded px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                        >
                          {t.actions.delete}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENCRYPTED VAULT (CARDS) */}
          {activeTab === 'vault' && (
            <div class="space-y-6">
              <div class="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                <div>
                  <h2 class="text-base font-bold text-slate-900 dark:text-white">
                    {t.vault.title}
                  </h2>
                  <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {t.vault.description}
                  </p>
                </div>

                <span
                  class={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    !vaultInitialized
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                      : vaultUnlocked
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {!vaultInitialized
                    ? t.vault.uninitializedBadge
                    : vaultUnlocked
                      ? t.vault.unlockedBadge
                      : t.vault.lockedBadge}
                </span>
              </div>

              {!vaultInitialized ? (
                <div class="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.vault.setupPassphrase}
                  </h3>
                  <div class="space-y-3">
                    <div>
                      <label for="new-vault-passphrase" class="sr-only">
                        {t.vault.passphrasePlaceholder}
                      </label>
                      <input
                        id="new-vault-passphrase"
                        type="password"
                        value={newVaultPassphrase}
                        onInput={(e) => setNewVaultPassphrase((e.target as HTMLInputElement).value)}
                        placeholder={t.vault.passphrasePlaceholder}
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label for="confirm-vault-passphrase" class="sr-only">
                        {t.vault.confirmPassphrasePlaceholder}
                      </label>
                      <input
                        id="confirm-vault-passphrase"
                        type="password"
                        value={confirmVaultPassphrase}
                        onInput={(e) =>
                          setConfirmVaultPassphrase((e.target as HTMLInputElement).value)
                        }
                        placeholder={t.vault.confirmPassphrasePlaceholder}
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    {vaultError && (
                      <p role="alert" class="text-xs font-medium text-rose-700 dark:text-rose-400">
                        {vaultError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleSetupVault}
                      class="w-full rounded-md bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      {t.actions.create}
                    </button>
                  </div>
                </div>
              ) : !vaultUnlocked ? (
                <div class="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/40">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {t.vault.enterPassphrase}
                  </h3>
                  <div class="space-y-3">
                    <div>
                      <label for="unlock-vault-passphrase" class="sr-only">
                        {t.vault.enterPassphrase}
                      </label>
                      <input
                        id="unlock-vault-passphrase"
                        type="password"
                        value={vaultPassphrase}
                        onInput={(e) => setVaultPassphrase((e.target as HTMLInputElement).value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnlockVault()}
                        placeholder={t.vault.enterPassphrase}
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    {vaultError && (
                      <p role="alert" class="text-xs font-medium text-rose-700 dark:text-rose-400">
                        {vaultError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleUnlockVault}
                      class="w-full rounded-md bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                    >
                      {t.actions.unlock}
                    </button>
                  </div>
                </div>
              ) : (
                <div class="space-y-6">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-slate-600 dark:text-slate-300">
                      {formatString(t.vault.autoLockNote, {
                        minutes: settings.vaultTimeoutMinutes,
                      })}
                    </p>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCard(null);
                          setIsAddingCard(true);
                        }}
                        class="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        + {t.vault.addCard}
                      </button>
                      <button
                        type="button"
                        onClick={handleLockVault}
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {t.actions.lock}
                      </button>
                    </div>
                  </div>

                  {/* Card Form with live Luhn validation, brand detection, expiry picker, optional CVV */}
                  {(isAddingCard || editingCard) && (
                    <CardForm
                      t={t}
                      initialCard={editingCard}
                      onSave={handleSaveCardData}
                      onCancel={() => {
                        setIsAddingCard(false);
                        setEditingCard(null);
                      }}
                    />
                  )}

                  {/* Cards List */}
                  {cards.length === 0 ? (
                    <div class="rounded-lg border border-dashed border-slate-300 py-10 text-center text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
                      {t.vault.noCardsYet}
                    </div>
                  ) : (
                    <div role="list" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {cards.map((c) => (
                        <div
                          key={c.id}
                          role="listitem"
                          class="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
                        >
                          <div class="flex items-start justify-between">
                            <div>
                              <div class="flex items-center gap-2">
                                <CardBrandIcon brand={c.brand} />
                                <span class="text-sm font-bold text-slate-900 dark:text-slate-100">
                                  {c.nickname}
                                </span>
                              </div>
                              <p class="mt-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                                {maskCardNumber(c.cardNumber)}
                              </p>
                            </div>
                            <div class="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCard(c);
                                  setIsAddingCard(false);
                                }}
                                class="rounded px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300"
                              >
                                {t.actions.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCardToDelete(c)}
                                class="rounded px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                              >
                                {t.actions.delete}
                              </button>
                            </div>
                          </div>
                          <div class="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-2 text-[11px] text-slate-600 dark:border-slate-700/60 dark:text-slate-300">
                            <span>{c.cardholderName || '—'}</span>
                            <span>
                              {c.expMonth}/{c.expYear}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SITE RULES */}
          {activeTab === 'siteRules' && (
            <div class="space-y-6">
              <div class="border-b border-slate-200 pb-4 dark:border-slate-800">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                  {t.siteRules.title}
                </h2>
                <p class="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {t.siteRules.description}
                </p>
              </div>

              <div class="rounded-lg border border-brand-200 bg-brand-50/50 p-3 text-xs text-slate-800 dark:border-brand-900 dark:bg-brand-950/30 dark:text-slate-200">
                {t.siteRules.placeholderNote}
              </div>

              <form
                onSubmit={handleSaveSiteRule}
                aria-label={t.siteRules.addRule}
                class="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 sm:grid-cols-4"
              >
                <div class="sm:col-span-2">
                  <label
                    for="rule-host-input"
                    class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {t.siteRules.host} *
                  </label>
                  <input
                    id="rule-host-input"
                    type="text"
                    required
                    value={ruleHost}
                    onInput={(e) => setRuleHost((e.target as HTMLInputElement).value)}
                    placeholder={t.siteRules.hostPlaceholder}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    for="rule-behavior-select"
                    class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
                  >
                    {t.siteRules.behavior}
                  </label>
                  <select
                    id="rule-behavior-select"
                    value={ruleBehavior}
                    onChange={(e) =>
                      setRuleBehavior(
                        (e.target as HTMLSelectElement).value as 'ask' | 'always' | 'never',
                      )
                    }
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ask">{t.siteRules.behaviorAsk}</option>
                    <option value="always">{t.siteRules.behaviorAlways}</option>
                    <option value="never">{t.siteRules.behaviorNever}</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button
                    type="submit"
                    class="w-full rounded-md bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    + {t.siteRules.addRule}
                  </button>
                </div>
              </form>

              {siteRules.length === 0 ? (
                <p class="py-6 text-center text-xs text-slate-600 dark:text-slate-300">
                  {t.siteRules.emptyState}
                </p>
              ) : (
                <div role="list" class="space-y-2">
                  {siteRules.map((rule) => (
                    <div
                      key={rule.id}
                      role="listitem"
                      class="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div>
                        <span class="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                          {rule.host}
                        </span>
                        <span class="ms-2 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {rule.autoFillRule}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSiteRule(rule.id)}
                        class="rounded px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                      >
                        {t.actions.delete}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div class="space-y-6">
              <div class="border-b border-slate-200 pb-4 dark:border-slate-800">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                  {t.settings.exportImportTitle}
                </h2>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Export Box */}
                <div class="flex flex-col justify-between rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                  <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t.actions.export}
                    </h3>
                    <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {t.settings.exportDesc}
                    </p>
                    <label class="flex cursor-pointer items-start gap-2 pt-2 text-xs text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={includeVaultInExport}
                        onChange={(e) =>
                          setIncludeVaultInExport((e.target as HTMLInputElement).checked)
                        }
                        class="mt-0.5 rounded border-slate-300 text-brand-600"
                      />
                      <span>{t.settings.exportWithVault}</span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    class="mt-6 w-full rounded-md bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    {t.actions.export}
                  </button>
                </div>

                {/* Import Box */}
                <div class="flex flex-col justify-between rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                  <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t.actions.import}
                    </h3>
                    <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {t.settings.importDesc}
                    </p>
                  </div>

                  <label class="mt-6 block w-full cursor-pointer rounded-md border border-slate-300 bg-slate-100 py-2 text-center text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                    <span>{t.actions.import}</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImport}
                      class="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div class="space-y-6">
              <div class="border-b border-slate-200 pb-4 dark:border-slate-800">
                <h2 class="text-base font-bold text-slate-900 dark:text-white">
                  {t.settings.title}
                </h2>
              </div>

              <div class="max-w-lg space-y-5">
                {/* Language */}
                <div>
                  <label
                    for="settings-language-select"
                    class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.settings.language}
                  </label>
                  <select
                    id="settings-language-select"
                    value={settings.language}
                    onChange={async (e) => {
                      const lang = (e.target as HTMLSelectElement).value as 'en' | 'bn';
                      const updated = await repo.updateSettings({ language: lang });
                      setSettings(updated);
                      document.documentElement.lang = lang;
                    }}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="en">{t.settings.languages.en}</option>
                    <option value="bn">{t.settings.languages.bn}</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label
                    for="settings-theme-select"
                    class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.settings.theme}
                  </label>
                  <select
                    id="settings-theme-select"
                    value={settings.theme}
                    onChange={async (e) => {
                      const theme = (e.target as HTMLSelectElement).value as
                        'system' | 'light' | 'dark';
                      const updated = await repo.updateSettings({ theme });
                      setSettings(updated);
                      applyTheme(theme);
                    }}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="system">{t.settings.themes.system}</option>
                    <option value="light">{t.settings.themes.light}</option>
                    <option value="dark">{t.settings.themes.dark}</option>
                  </select>
                </div>

                {/* Vault Auto-Lock Timeout */}
                <div>
                  <label
                    for="settings-timeout-select"
                    class="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {t.settings.vaultTimeout}
                  </label>
                  <select
                    id="settings-timeout-select"
                    value={settings.vaultTimeoutMinutes}
                    onChange={async (e) => {
                      const mins = Number((e.target as HTMLSelectElement).value);
                      const updated = await repo.updateSettings({ vaultTimeoutMinutes: mins });
                      setSettings(updated);
                    }}
                    class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {[5, 15, 30, 60].map((m) => (
                      <option key={m} value={m}>
                        {formatString(t.settings.vaultTimeoutMinutes, { minutes: m })}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Confirmation Toggle */}
                <div class="pt-2">
                  <label class="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
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
                      class="rounded border-slate-300 text-brand-600"
                    />
                    <span>{t.settings.confirmPaymentFill}</span>
                  </label>
                </div>

                {/* Re-open 3-Step Onboarding Wizard */}
                <div class="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOnboardingOpen(true)}
                    class="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    {t.settings.reopenOnboarding}
                  </button>
                </div>

                <div class="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-xs leading-relaxed text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                  {t.settings.privacyNote}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        t={t}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />

      {/* Delete Profile Confirmation */}
      <ConfirmModal
        isOpen={profileToDelete !== null}
        title={t.messages.confirmDeleteProfileTitle}
        message={
          profileToDelete
            ? formatString(t.messages.confirmDeleteProfileMsg, { name: profileToDelete.name })
            : ''
        }
        confirmLabel={t.actions.delete}
        cancelLabel={t.actions.cancel}
        isDestructive
        onConfirm={handleDeleteProfile}
        onCancel={() => setProfileToDelete(null)}
      />

      {/* Delete Card Confirmation */}
      <ConfirmModal
        isOpen={cardToDelete !== null}
        title={t.messages.confirmDeleteCardTitle}
        message={
          cardToDelete
            ? formatString(t.messages.confirmDeleteCardMsg, { name: cardToDelete.nickname })
            : ''
        }
        confirmLabel={t.actions.delete}
        cancelLabel={t.actions.cancel}
        isDestructive
        onConfirm={handleDeleteCard}
        onCancel={() => setCardToDelete(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} closeLabel={t.actions.close} />
    </div>
  );
}
