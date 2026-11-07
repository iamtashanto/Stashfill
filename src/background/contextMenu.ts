import type { Profile, Field, Settings } from '../core/schemas/vault';
import type { PaymentCard } from '../types/vault';

export interface ContextMenuDescriptor {
  id: string;
  parentId?: string;
  title?: string;
  type?: 'normal' | 'separator';
  contexts: ('editable' | 'selection' | 'page' | 'action' | 'browser_action')[];
}

export interface BuildContextMenuInput {
  profiles: Profile[];
  settings: Settings;
  vaultInitialized: boolean;
  vaultUnlocked: boolean;
  cards: PaymentCard[];
  isHttpsPage?: boolean;
}

const MAX_FIELDS_PER_PROFILE = 12;
const MAX_PROFILES_IN_MENU = 5;

function sortFieldsByMostUsed(fields: Field[]): Field[] {
  return [...fields]
    .filter((f) => f.value && f.value.trim().length > 0)
    .sort((a, b) => {
      const countDiff = (b.useCount ?? 0) - (a.useCount ?? 0);
      if (countDiff !== 0) return countDiff;
      return (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0);
    });
}

function formatFieldMenuTitle(field: Field, showPreviews: boolean): string {
  // Never show value previews for sensitive fields
  if (!showPreviews || field.sensitive) {
    return field.label;
  }
  const preview = field.value.length > 22 ? `${field.value.slice(0, 22)}...` : field.value;
  return `${field.label} (${preview})`;
}

/**
 * Pure builder for Stashfill native right-click context menu items.
 * - Never replaces browser items; only adds a single top-level `Stashfill` item for editable contexts,
 *   `Save selection to Stashfill` for selection contexts, and `Open Stashfill` / `Settings` for page/action.
 * - Lists up to 12 most-used fields per profile.
 * - Value previews are off by default and NEVER shown for sensitive fields.
 * - Cards are shown only when vault is unlocked and page is https, under a separate `Fill card` submenu.
 * - If vault is encrypted and locked, shows a single `Unlock Stashfill` item.
 */
export function buildContextMenuDescriptors(input: BuildContextMenuInput): ContextMenuDescriptor[] {
  const { profiles, settings, vaultInitialized, vaultUnlocked, cards, isHttpsPage = true } = input;

  const items: ContextMenuDescriptor[] = [];
  const showPreviews = Boolean(settings.showMenuValuePreviews);

  // 1. Editable root
  items.push({
    id: 'stashfill-root',
    title: 'Stashfill',
    contexts: ['editable'],
  });

  // If vault is encrypted and locked, show a single Unlock Stashfill item
  if (vaultInitialized && !vaultUnlocked) {
    items.push({
      id: 'stashfill-unlock-vault',
      parentId: 'stashfill-root',
      title: 'Unlock Stashfill',
      contexts: ['editable'],
    });
  }

  // Profile submenus (up to MAX_PROFILES_IN_MENU, then fallback to More...)
  const visibleProfiles = profiles.slice(0, MAX_PROFILES_IN_MENU);
  for (const profile of visibleProfiles) {
    const profileMenuId = `stashfill-profile:${profile.id}`;
    items.push({
      id: profileMenuId,
      parentId: 'stashfill-root',
      title: profile.name,
      contexts: ['editable'],
    });

    const sortedFields = sortFieldsByMostUsed(profile.fields);
    const topFields = sortedFields.slice(0, MAX_FIELDS_PER_PROFILE);

    for (const field of topFields) {
      items.push({
        id: `stashfill-field:${profile.id}:${field.id}`,
        parentId: profileMenuId,
        title: formatFieldMenuTitle(field, showPreviews),
        contexts: ['editable'],
      });
    }

    if (sortedFields.length > MAX_FIELDS_PER_PROFILE) {
      items.push({
        id: `stashfill-more-profile:${profile.id}`,
        parentId: profileMenuId,
        title: 'More...',
        contexts: ['editable'],
      });
    }
  }

  items.push({
    id: 'stashfill-sep-actions',
    parentId: 'stashfill-root',
    type: 'separator',
    contexts: ['editable'],
  });

  items.push({
    id: 'stashfill-fill-form',
    parentId: 'stashfill-root',
    title: 'Fill this form with the default profile',
    contexts: ['editable'],
  });

  items.push({
    id: 'stashfill-fill-empty',
    parentId: 'stashfill-root',
    title: 'Fill empty fields only',
    contexts: ['editable'],
  });

  items.push({
    id: 'stashfill-map-field',
    parentId: 'stashfill-root',
    title: 'Map this field...',
    contexts: ['editable'],
  });

  items.push({
    id: 'stashfill-more',
    parentId: 'stashfill-root',
    title: 'More...',
    contexts: ['editable'],
  });

  items.push({
    id: 'stashfill-undo',
    parentId: 'stashfill-root',
    title: 'Undo last fill',
    contexts: ['editable'],
  });

  // Separate Fill card section (ONLY when vault is unlocked and page is https)
  if (vaultUnlocked && isHttpsPage && cards.length > 0) {
    items.push({
      id: 'stashfill-sep-cards',
      parentId: 'stashfill-root',
      type: 'separator',
      contexts: ['editable'],
    });

    for (const card of cards.slice(0, 5)) {
      const last4 = card.cardNumber.replace(/\D/g, '').slice(-4) || '0000';
      const brandLabel = card.brand.toUpperCase();
      items.push({
        id: `stashfill-card:${card.id}`,
        parentId: 'stashfill-root',
        title: `Fill card: ${brandLabel} •••• ${last4}`,
        contexts: ['editable'],
      });
    }
  }

  // 2. Selection context
  items.push({
    id: 'stashfill-save-selection',
    title: 'Save selection to Stashfill',
    contexts: ['selection'],
  });

  // 3. Page & Toolbar icon context
  items.push({
    id: 'stashfill-open-popup',
    title: 'Open Stashfill',
    contexts: ['page', 'action'],
  });

  items.push({
    id: 'stashfill-open-settings',
    title: 'Stashfill Settings',
    contexts: ['page', 'action'],
  });

  return items;
}
