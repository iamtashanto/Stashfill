import { useState, useEffect, useMemo } from 'preact/hooks';
import { browser } from 'wxt/browser';
import { LocalStorageAdapter } from '../../src/storage/LocalStorageAdapter';
import { StashRepository, type LocalBackupSnapshot } from '../../src/storage/StashRepository';
import {
  exportPlainJson,
  exportCsv,
  exportEncryptedBackup,
  decryptEncryptedBackup,
  previewImport,
  applyImportWithStrategy,
  type ImportFormat,
  type MergeStrategy,
  type ImportDryRunPreview,
} from '../../src/storage/importExport';
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
import { StashfillLogo } from '../../src/components/StashfillLogo';

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
  const [ruleDisableSnippets, setRuleDisableSnippets] = useState(false);

  // Vault state
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassphrase, setVaultPassphrase] = useState('');
  const [newVaultPassphrase, setNewVaultPassphrase] = useState('');
  const [confirmVaultPassphrase, setConfirmVaultPassphrase] = useState('');
  const [vaultError, setVaultError] = useState('');
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [revealedCardIds, setRevealedCardIds] = useState<Record<string, boolean>>({});

  // Change Passphrase state
  const [isChangingPassphrase, setIsChangingPassphrase] = useState(false);
  const [oldPassphraseInput, setOldPassphraseInput] = useState('');
  const [nextPassphraseInput, setNextPassphraseInput] = useState('');
  const [confirmNextPassphraseInput, setConfirmNextPassphraseInput] = useState('');
  const [changePassphraseError, setChangePassphraseError] = useState('');

  // Card form state
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [editingCard, setEditingCard] = useState<PaymentCard | null>(null);

  // Delete modal
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [cardToDelete, setCardToDelete] = useState<PaymentCard | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    const checkEmbedded = () => {
      const inIframe = typeof window !== 'undefined' && window.self !== window.top;
      const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768;
      setIsEmbedded(inIframe || isNarrow);
    };
    checkEmbedded();
    window.addEventListener('resize', checkEmbedded);
    return () => window.removeEventListener('resize', checkEmbedded);
  }, []);

  const handleOpenInTab = () => {
    const optionsUrl =
      browser?.runtime?.getURL ? browser.runtime.getURL('/options.html') : '/options.html';
    if (browser?.tabs?.create) {
      void browser.tabs.create({ url: optionsUrl });
    } else {
      window.open(optionsUrl, '_blank');
    }
  };

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

      const [activeId, isInit, allSnippets, allRules, history] = await Promise.all([
        repo.getActiveProfileId(),
        vaultManager.isInitialized(),
        repo.getSnippets(),
        repo.getSiteRules(),
        repo.getLocalBackupHistory(),
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
      setLocalBackups(history);

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

  const totalSavedFields = useMemo(() => {
    return profiles.reduce(
      (sum, p) => sum + p.fields.filter((f) => f.value && f.value.trim().length > 0).length,
      0,
    );
  }, [profiles]);

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
    const hostClean = ruleHost.trim().toLowerCase();
    const existing = siteRules.find((r) => r.host.toLowerCase() === hostClean);
    const rule: SiteRule = {
      id: existing?.id ?? `rule_${Date.now()}`,
      host: hostClean,
      autoFillRule: ruleBehavior,
      profileId: ruleProfileId || null,
      disabledFields: existing?.disabledFields ?? [],
      snippetsDisabled: ruleDisableSnippets,
      fieldMappings: existing?.fieldMappings ?? [],
    };
    await repo.upsertSiteRule(rule);
    const updated = await repo.getSiteRules();
    setSiteRules(updated);
    setRuleHost('');
    setRuleProfileId('');
    setRuleDisableSnippets(false);
    showToast(t.siteRules.saved, 'success');
  };

  const handleRemoveFieldMapping = async (rule: SiteRule, mappingId: string) => {
    const updatedRule: SiteRule = {
      ...rule,
      fieldMappings: (rule.fieldMappings || []).filter((m) => m.id !== mappingId),
    };
    await repo.upsertSiteRule(updatedRule);
    const updated = await repo.getSiteRules();
    setSiteRules(updated);
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
    setRevealedCardIds({});
    setIsChangingPassphrase(false);
  };

  const handleChangeMasterPassphrase = async (e: Event) => {
    e.preventDefault();
    setChangePassphraseError('');
    if (nextPassphraseInput.length < 6) {
      setChangePassphraseError(t.vault.passphraseMinLength);
      return;
    }
    if (nextPassphraseInput !== confirmNextPassphraseInput) {
      setChangePassphraseError(t.vault.passphraseMismatch);
      return;
    }
    try {
      await vaultManager.changePassphrase(oldPassphraseInput, nextPassphraseInput);
      setOldPassphraseInput('');
      setNextPassphraseInput('');
      setConfirmNextPassphraseInput('');
      setIsChangingPassphrase(false);
      showToast(t.vault.passphraseChangedSuccess, 'success');
    } catch {
      setChangePassphraseError(t.vault.invalidPassphrase);
    }
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

  // Export, Import (with Dry-Run Preview & Merge Strategy), and Automatic Local Backups
  const [exportFormat, setExportFormat] = useState<'plainJson' | 'csv' | 'encrypted'>('plainJson');
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [importFormat, setImportFormat] = useState<ImportFormat>('json');
  const [importStrategy, setImportStrategy] = useState<MergeStrategy>('skip');
  const [importPreview, setImportPreview] = useState<ImportDryRunPreview | null>(null);
  const [importRawText, setImportRawText] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [localBackups, setLocalBackups] = useState<LocalBackupSnapshot[]>([]);

  const handleExport = async () => {
    try {
      const vault = await repo.loadVault();
      const dateStr = new Date().toISOString().slice(0, 10);

      if (exportFormat === 'csv') {
        const csvStr = exportCsv(vault);
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stashfill-export-${dateStr}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'encrypted') {
        if (exportPassphrase.length < 6) {
          showToast(t.vault.passphraseMinLength, 'error');
          return;
        }
        const encryptedVaultPayload = await repo.getEncryptedVault();
        const envelope = await exportEncryptedBackup(
          vault,
          encryptedVaultPayload,
          exportPassphrase,
        );
        const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stashfill-encrypted-backup-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setExportPassphrase('');
      } else {
        const plainEnvelope = exportPlainJson(vault);
        const blob = new Blob([JSON.stringify(plainEnvelope, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stashfill-backup-${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      const updatedSettings = await repo.updateSettings({ lastBackupExportedAt: Date.now() });
      setSettings(updatedSettings);
      showToast(t.messages.exportDownloaded, 'success');
    } catch {
      showToast(t.messages.importInvalid, 'error');
    }
  };

  const handleFileSelectedForPreview = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportRawText(text);
      const ext = file.name.toLowerCase().endsWith('.csv')
        ? 'csv'
        : file.name.toLowerCase().endsWith('.txt')
          ? 'txt'
          : importFormat;
      setImportFormat(ext);
      const preview = previewImport(text, ext, profiles);
      setImportPreview(preview);
      if (!preview.valid) {
        showToast(preview.error || t.messages.importInvalid, 'error');
      }
    } catch {
      showToast(t.messages.importInvalid, 'error');
    } finally {
      input.value = '';
    }
  };

  const handleApplyImport = async () => {
    if (!importPreview || !importPreview.valid) return;

    try {
      await repo.createLocalBackupSnapshot();

      if (importPreview.format === 'encrypted') {
        const decrypted = await decryptEncryptedBackup(importRawText, importPassphrase);
        await repo.importData({
          vault: decrypted.vault,
          encryptedPayload: decrypted.encryptedPayload,
        });
      } else {
        const mergedProfiles = applyImportWithStrategy(importPreview, profiles, importStrategy);
        for (const prof of mergedProfiles) {
          await repo.upsertProfile(prof);
        }
        if (importPreview.encryptedPayload) {
          await repo.saveEncryptedVault(importPreview.encryptedPayload);
        }
      }

      const [allProfiles, activeId, curSettings, isInit, allSnips, allRules, history] =
        await Promise.all([
          repo.getProfiles(),
          repo.getActiveProfileId(),
          repo.getSettings(),
          vaultManager.isInitialized(),
          repo.getSnippets(),
          repo.getSiteRules(),
          repo.getLocalBackupHistory(),
        ]);

      setProfiles(allProfiles);
      setSelectedProfileId(activeId);
      const sel = allProfiles.find((p) => p.id === activeId) ?? allProfiles[0]!;
      setProfileForm({ ...sel });
      setSettings(curSettings);
      setVaultInitialized(isInit);
      setSnippets(allSnips);
      setSiteRules(allRules);
      setLocalBackups(history);
      setImportPreview(null);
      setImportRawText('');
      setImportPassphrase('');

      showToast(formatString(t.settings.importSuccess, { count: allProfiles.length }), 'success');
    } catch {
      showToast(t.messages.importInvalid, 'error');
    }
  };

  const handleCreateLocalSnapshot = async () => {
    await repo.createLocalBackupSnapshot();
    const history = await repo.getLocalBackupHistory();
    setLocalBackups(history);
    showToast(t.messages.exportDownloaded, 'success');
  };

  const handleRestoreLocalSnapshot = async (snapshotId: string) => {
    const ok = await repo.restoreLocalBackupSnapshot(snapshotId);
    if (!ok) return;
    const [allProfiles, activeId, curSettings, isInit, allSnips, allRules, history] =
      await Promise.all([
        repo.getProfiles(),
        repo.getActiveProfileId(),
        repo.getSettings(),
        vaultManager.isInitialized(),
        repo.getSnippets(),
        repo.getSiteRules(),
        repo.getLocalBackupHistory(),
      ]);
    setProfiles(allProfiles);
    setSelectedProfileId(activeId);
    const sel = allProfiles.find((p) => p.id === activeId) ?? allProfiles[0]!;
    setProfileForm({ ...sel });
    setSettings(curSettings);
    setVaultInitialized(isInit);
    setSnippets(allSnips);
    setSiteRules(allRules);
    setLocalBackups(history);
    showToast(t.settings.snapshotRestored, 'success');
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
      {/* Embedded View Alert / Shortcut Banner */}
      {isEmbedded && (
        <aside
          aria-label="Embedded dialog notice"
          class="sticky top-0 z-40 flex items-center justify-between border-b border-indigo-500/20 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 px-4 py-2 text-white shadow-xs"
        >
          <div class="flex items-center gap-2">
            <span class="flex h-5 w-5 items-center justify-center rounded-md bg-white/20 text-xs font-bold">
              ⚡
            </span>
            <span class="text-xs font-semibold">Stashfill Full Dashboard</span>
            <span class="hidden sm:inline text-[11px] text-white/80">
              — For the best experience, open as a full browser tab
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenInTab}
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-brand-700 shadow-xs transition hover:bg-brand-50 hover:shadow"
          >
            <span>Open Full Tab</span>
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
        </aside>
      )}

      {/* Top Bar */}
      <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div class="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
          <div class="flex items-center gap-2.5 sm:gap-3">
            <StashfillLogo size={36} hasGlow />
            <div>
              <div class="flex items-center gap-1.5 sm:gap-2">
                <h1 class="text-sm sm:text-base font-bold leading-none text-slate-900 dark:text-white">
                  {t.appName}
                </h1>
                <span class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                  v1.0.0
                </span>
              </div>
              <p class="hidden sm:block mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.tagline}</p>
            </div>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2.5">
            {!settings.onboardingCompleted && (
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                class="hidden md:inline-flex cursor-pointer rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-950 dark:text-brand-200"
              >
                {t.settings.reopenOnboarding}
              </button>
            )}

            {/* Language Switcher */}
            <button
              type="button"
              onClick={handleToggleLanguage}
              title={t.settings.language}
              aria-label={t.settings.language}
              class="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {settings.language === 'en' ? 'বাংলা' : 'EN'}
            </button>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={handleToggleTheme}
              title={t.settings.theme}
              aria-label={t.settings.theme}
              class="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {settings.theme === 'dark' ? (
                <svg
                  class="h-4 w-4 text-amber-400"
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

            {/* Offline Assurance Badge */}
            <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span class="hidden sm:inline">{t.settings.privacyNote.split('.')[0]}</span>
              <span class="sm:hidden">Offline</span>
            </span>

            {/* Open In Tab icon button */}
            <button
              type="button"
              onClick={handleOpenInTab}
              title="Open Dashboard in New Tab"
              class="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div class="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-6">
        {/* Top Stats Overview: Shown on desktop tabs, hidden on narrow/modal to preserve space */}
        <div class="mb-6 hidden md:grid md:grid-cols-4 gap-3">
          <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.settings.activeProfile}
            </span>
            <div class="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <span>{profileForm?.name || 'Personal'}</span>
              <span class="text-amber-500">★</span>
            </div>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {profileForm?.fields?.length || 0} fields configured
            </p>
          </div>

          <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.vault.title}
            </span>
            <div class="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <span
                class={`h-2 w-2 rounded-full ${
                  vaultInitialized
                    ? vaultUnlocked
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              ></span>
              <span>
                {vaultInitialized
                  ? vaultUnlocked
                    ? t.actions.unlock
                    : t.actions.lock
                  : 'Unconfigured'}
              </span>
            </div>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {cards.length} cards protected
            </p>
          </div>

          <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.snippets.title}
            </span>
            <div class="mt-1 text-sm font-bold text-slate-900 dark:text-white">
              {snippets.length} Triggers
            </div>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Prefix: <span class="font-mono font-semibold">{settings.snippetTriggerPrefix || ';'}</span>
            </p>
          </div>

          <div class="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Privacy Mode
            </span>
            <div class="mt-1 flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>100% Offline</span>
            </div>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Zero network requests
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-4">
          {/* Navigation: Horizontal scroll on narrow/modal, vertical sidebar on desktop */}
          <nav
            aria-label={t.settings.title}
            class="flex md:flex-col overflow-x-auto no-scrollbar gap-1.5 pb-2 md:pb-0 md:col-span-1 border-b md:border-b-0 border-slate-200 dark:border-slate-800"
          >
            <button
              type="button"
              onClick={() => setActiveTab('profiles')}
              aria-current={activeTab === 'profiles' ? 'page' : undefined}
              class={`flex shrink-0 cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 md:px-3.5 md:py-2.5 text-start text-xs md:text-sm font-medium transition-all ${
                activeTab === 'profiles'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <div class="flex items-center gap-2 md:gap-2.5">
                <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{t.settings.profilesTitle}</span>
              </div>
              <span
                class={`ms-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'profiles'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {profiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('snippets')}
              aria-current={activeTab === 'snippets' ? 'page' : undefined}
              class={`flex shrink-0 cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 md:px-3.5 md:py-2.5 text-start text-xs md:text-sm font-medium transition-all ${
                activeTab === 'snippets'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <div class="flex items-center gap-2 md:gap-2.5">
                <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{t.snippets.title}</span>
              </div>
              <span
                class={`ms-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'snippets'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {snippets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              aria-current={activeTab === 'vault' ? 'page' : undefined}
              class={`flex shrink-0 cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 md:px-3.5 md:py-2.5 text-start text-xs md:text-sm font-medium transition-all ${
                activeTab === 'vault'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <div class="flex items-center gap-2 md:gap-2.5">
                <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{t.vault.title}</span>
              </div>
              <span
                class={`ms-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'vault'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {cards.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('siteRules')}
              aria-current={activeTab === 'siteRules' ? 'page' : undefined}
              class={`flex shrink-0 cursor-pointer items-center justify-between rounded-xl px-3 py-1.5 md:px-3.5 md:py-2.5 text-start text-xs md:text-sm font-medium transition-all ${
                activeTab === 'siteRules'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <div class="flex items-center gap-2 md:gap-2.5">
                <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{t.siteRules.title}</span>
              </div>
              <span
                class={`ms-1.5 rounded-full px-1.5 md:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === 'siteRules'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {siteRules.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              aria-current={activeTab === 'backup' ? 'page' : undefined}
              class={`flex shrink-0 cursor-pointer items-center gap-2 md:gap-2.5 rounded-xl px-3 py-1.5 md:px-3.5 md:py-2.5 text-start text-xs md:text-sm font-medium transition-all ${
                activeTab === 'backup'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>{t.settings.exportImportTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              class={`flex shrink-0 cursor-pointer items-center gap-2 md:gap-2.5 rounded-xl px-3 py-1.5 md:px-3.5 md:py-2.5 text-start text-xs md:text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <svg class="h-4 w-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{t.settings.title}</span>
            </button>
          </nav>

          {/* Content Pane */}
          <main class="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 md:col-span-3">
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
                  <div class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    {t.vault.passphraseIrrecoverableWarning}
                  </div>
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
                  <div class="flex flex-wrap items-center justify-between gap-2">
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
                        onClick={() => setIsChangingPassphrase((prev) => !prev)}
                        class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {t.vault.changePassphraseTitle}
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

                  {/* Change Passphrase Form */}
                  {isChangingPassphrase && (
                    <form
                      onSubmit={handleChangeMasterPassphrase}
                      aria-label={t.vault.changePassphraseTitle}
                      class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                    >
                      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {t.vault.changePassphraseTitle}
                      </h3>
                      <p class="text-xs text-amber-800 dark:text-amber-300">
                        {t.vault.passphraseIrrecoverableWarning}
                      </p>
                      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="password"
                          required
                          value={oldPassphraseInput}
                          onInput={(e) =>
                            setOldPassphraseInput((e.target as HTMLInputElement).value)
                          }
                          placeholder={t.vault.currentPassphrasePlaceholder}
                          aria-label={t.vault.currentPassphrasePlaceholder}
                          class="rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <input
                          type="password"
                          required
                          value={nextPassphraseInput}
                          onInput={(e) =>
                            setNextPassphraseInput((e.target as HTMLInputElement).value)
                          }
                          placeholder={t.vault.newPassphrasePlaceholder}
                          aria-label={t.vault.newPassphrasePlaceholder}
                          class="rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <input
                          type="password"
                          required
                          value={confirmNextPassphraseInput}
                          onInput={(e) =>
                            setConfirmNextPassphraseInput((e.target as HTMLInputElement).value)
                          }
                          placeholder={t.vault.confirmPassphrasePlaceholder}
                          aria-label={t.vault.confirmPassphrasePlaceholder}
                          class="rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      {changePassphraseError && (
                        <p
                          role="alert"
                          class="text-xs font-medium text-rose-700 dark:text-rose-400"
                        >
                          {changePassphraseError}
                        </p>
                      )}
                      <div class="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsChangingPassphrase(false)}
                          class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {t.actions.cancel}
                        </button>
                        <button
                          type="submit"
                          class="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          {t.actions.save}
                        </button>
                      </div>
                    </form>
                  )}

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
                      {cards.map((c) => {
                        const isRevealed = Boolean(revealedCardIds[c.id]);
                        return (
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
                                <div class="mt-2 flex items-center gap-2 font-mono text-xs text-slate-700 dark:text-slate-300">
                                  <span>
                                    {isRevealed ? c.cardNumber : maskCardNumber(c.cardNumber)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRevealedCardIds((prev) => ({
                                        ...prev,
                                        [c.id]: !prev[c.id],
                                      }))
                                    }
                                    aria-label={`${
                                      isRevealed ? t.vault.hideCardNumber : t.vault.revealCardNumber
                                    }: ${c.nickname}`}
                                    class="font-sans text-[11px] font-semibold text-brand-700 hover:underline dark:text-brand-300"
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
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div class="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                {t.vault.walletDisclaimer}
              </div>
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
                class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
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
                      for="rule-profile-select"
                      class="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      {t.siteRules.defaultProfile}
                    </label>
                    <select
                      id="rule-profile-select"
                      value={ruleProfileId}
                      onChange={(e) => setRuleProfileId((e.target as HTMLSelectElement).value)}
                      class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">{t.siteRules.useGlobalDefault}</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
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
                </div>
                <div class="flex items-center justify-between pt-1">
                  <label class="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={ruleDisableSnippets}
                      onChange={(e) =>
                        setRuleDisableSnippets((e.target as HTMLInputElement).checked)
                      }
                      class="rounded border-slate-300 text-brand-600"
                    />
                    <span>{t.siteRules.disableSnippets}</span>
                  </label>
                  <button
                    type="submit"
                    class="rounded-md bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
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
                      class="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                    >
                      <div class="flex items-center justify-between">
                        <div>
                          <span class="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {rule.host}
                          </span>
                          <span class="ms-2 rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {rule.autoFillRule}
                          </span>
                          {rule.snippetsDisabled && (
                            <span class="ms-2 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                              {t.siteRules.disableSnippets}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSiteRule(rule.id)}
                          class="rounded px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                        >
                          {t.actions.delete}
                        </button>
                      </div>
                      {rule.fieldMappings && rule.fieldMappings.length > 0 && (
                        <div class="space-y-1 border-t border-slate-200 pt-2 dark:border-slate-800">
                          <span class="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400">
                            {t.siteRules.mappingsTitle}
                          </span>
                          {rule.fieldMappings.map((m) => (
                            <div
                              key={m.id}
                              class="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-xs dark:bg-slate-800/50"
                            >
                              <span class="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                                {m.signature.name ||
                                  m.signature.id ||
                                  m.signature.domPath ||
                                  'field'}{' '}
                                → {m.label || m.targetKey}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFieldMapping(rule, m.id)}
                                aria-label={`${t.siteRules.removeMapping}: ${m.targetKey}`}
                                class="text-xs font-bold text-rose-700 hover:underline dark:text-rose-400"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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

              <div class="rounded-lg border border-amber-300 bg-amber-50/70 p-3 text-xs text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
                {t.settings.exportPlainExclusionNotice}
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

                    <div>
                      <label
                        for="export-format-select"
                        class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {t.settings.exportFormatLabel}
                      </label>
                      <select
                        id="export-format-select"
                        value={exportFormat}
                        onChange={(e) =>
                          setExportFormat(
                            (e.target as HTMLSelectElement).value as
                              'plainJson' | 'csv' | 'encrypted',
                          )
                        }
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="plainJson">{t.settings.exportFormatPlainJson}</option>
                        <option value="csv">{t.settings.exportFormatCsv}</option>
                        <option value="encrypted">{t.settings.exportFormatEncrypted}</option>
                      </select>
                    </div>

                    {exportFormat === 'encrypted' && (
                      <div>
                        <label for="export-passphrase-input" class="sr-only">
                          {t.settings.exportPassphrasePlaceholder}
                        </label>
                        <input
                          id="export-passphrase-input"
                          type="password"
                          value={exportPassphrase}
                          onInput={(e) => setExportPassphrase((e.target as HTMLInputElement).value)}
                          placeholder={t.settings.exportPassphrasePlaceholder}
                          class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    class="mt-6 w-full rounded-md bg-brand-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
                  >
                    {t.actions.export}
                  </button>
                </div>

                {/* Import Box with Dry-Run Preview & Merge Strategy */}
                <div class="flex flex-col justify-between rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                  <div class="space-y-3">
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t.actions.import}
                    </h3>
                    <p class="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {t.settings.importDesc}
                    </p>

                    <div>
                      <label
                        for="import-merge-strategy"
                        class="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                      >
                        {t.settings.importMergeStrategyLabel}
                      </label>
                      <select
                        id="import-merge-strategy"
                        value={importStrategy}
                        onChange={(e) =>
                          setImportStrategy((e.target as HTMLSelectElement).value as MergeStrategy)
                        }
                        class="w-full rounded-md border border-slate-300 bg-white p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="skip">{t.settings.mergeSkip}</option>
                        <option value="replace">{t.settings.mergeReplace}</option>
                        <option value="keepBoth">{t.settings.mergeKeepBoth}</option>
                      </select>
                    </div>

                    {importPreview && (
                      <div class="space-y-2 rounded-lg border border-brand-200 bg-brand-50/50 p-3 text-xs dark:border-brand-800 dark:bg-brand-950/40">
                        <div class="font-bold text-slate-900 dark:text-slate-100">
                          {t.settings.dryRunTitle} ({importPreview.format.toUpperCase()})
                        </div>
                        {importPreview.valid ? (
                          <div class="space-y-2">
                            <p class="text-slate-700 dark:text-slate-300">
                              {formatString(t.settings.dryRunSummary, {
                                newCount: importPreview.newCount,
                                duplicateCount: importPreview.duplicateCount,
                                invalidCount: importPreview.invalidCount,
                              })}
                            </p>
                            {importPreview.format === 'encrypted' && (
                              <input
                                type="password"
                                value={importPassphrase}
                                onInput={(e) =>
                                  setImportPassphrase((e.target as HTMLInputElement).value)
                                }
                                placeholder={t.vault.enterPassphrase}
                                aria-label={t.vault.enterPassphrase}
                                class="w-full rounded border border-slate-300 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            )}
                            <button
                              type="button"
                              onClick={handleApplyImport}
                              class="w-full rounded bg-emerald-700 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                            >
                              {t.settings.applyImportBtn}
                            </button>
                          </div>
                        ) : (
                          <p role="alert" class="font-medium text-rose-700 dark:text-rose-400">
                            {importPreview.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <label class="mt-6 block w-full cursor-pointer rounded-md border border-slate-300 bg-slate-100 py-2 text-center text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                    <span>{t.actions.import}</span>
                    <input
                      type="file"
                      accept=".json,.csv,.txt,application/json,text/csv,text/plain"
                      onChange={handleFileSelectedForPreview}
                      class="sr-only"
                    />
                  </label>
                </div>
              </div>

              {/* Automatic Local Backups & Restore Screen */}
              <div class="space-y-4 rounded-xl border border-slate-200 p-5 dark:border-slate-800">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {t.settings.localBackupsTitle}
                    </h3>
                    <p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                      {formatString(t.settings.localBackupsDesc, {
                        max: settings.maxLocalBackups ?? 5,
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateLocalSnapshot}
                    class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    + {t.settings.createSnapshotBtn}
                  </button>
                </div>

                {localBackups.length === 0 ? (
                  <p class="py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                    {t.settings.noLocalBackups}
                  </p>
                ) : (
                  <div role="list" class="space-y-2">
                    {localBackups.map((snap) => (
                      <div
                        key={snap.id}
                        role="listitem"
                        class="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div>
                          <div class="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {new Date(snap.timestamp).toLocaleString()}
                          </div>
                          <div class="text-[11px] text-slate-600 dark:text-slate-300">
                            {snap.profileCount} profiles · {snap.fieldCount} fields
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreLocalSnapshot(snap.id)}
                          class="rounded bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          {t.settings.restoreSnapshotBtn}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                <div class="space-y-3 pt-2">
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

                  <label class="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.showMenuValuePreviews)}
                      onChange={async (e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        const updated = await repo.updateSettings({
                          showMenuValuePreviews: checked,
                        });
                        setSettings(updated);
                      }}
                      class="rounded border-slate-300 text-brand-600"
                    />
                    <span>{t.settings.showMenuPreviews}</span>
                  </label>

                  <div>
                    <label class="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(settings.enableInlineChips)}
                        onChange={async (e) => {
                          const checked = (e.target as HTMLInputElement).checked;
                          if (checked && browser?.permissions?.request) {
                            try {
                              await browser.permissions.request({
                                origins: ['https://*/*', 'http://*/*'],
                              });
                            } catch {
                              // continue in test environment
                            }
                          }
                          const updated = await repo.updateSettings({
                            enableInlineChips: checked,
                          });
                          setSettings(updated);
                        }}
                        class="rounded border-slate-300 text-brand-600"
                      />
                      <span>{t.settings.enableInlineChips}</span>
                    </label>
                    <p class="ms-6 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                      {t.settings.inlineChipsExplanation}
                    </p>
                  </div>

                  <label class="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.allowSensitiveInInlineChips)}
                      onChange={async (e) => {
                        const checked = (e.target as HTMLInputElement).checked;
                        const updated = await repo.updateSettings({
                          allowSensitiveInInlineChips: checked,
                        });
                        setSettings(updated);
                      }}
                      class="rounded border-slate-300 text-brand-600"
                    />
                    <span>{t.settings.allowSensitiveInChips}</span>
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
