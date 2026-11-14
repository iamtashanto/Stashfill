import { describe, it, expect } from 'vitest';
import { buildContextMenuDescriptors } from './contextMenu';
import { DEFAULT_SETTINGS, type Profile } from '../core/schemas/vault';

describe('Context Menu Descriptors Builder', () => {
  const personalProfile: Profile = {
    id: 'prof_personal',
    name: 'Personal',
    icon: 'user',
    fields: [
      {
        id: 'f1',
        key: 'full_name',
        label: 'Full Name',
        type: 'text',
        category: 'personal',
        value: 'Md Tanvir Ahamed Shanto',
        tags: ['personal'],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 5,
        lastUsedAt: 2000,
      },
      {
        id: 'f2',
        key: 'email',
        label: 'Email Address',
        type: 'email',
        category: 'contact',
        value: 'hello@tashanto.com',
        tags: ['contact'],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 10,
        lastUsedAt: 3000,
      },
    ],
  };

  const workProfile: Profile = {
    id: 'prof_work',
    name: 'Work',
    icon: 'briefcase',
    fields: [
      {
        id: 'f3',
        key: 'email',
        label: 'Work Email',
        type: 'email',
        category: 'work',
        value: 'tanvir@work.com',
        tags: ['work'],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 3,
        lastUsedAt: 1500,
      },
      {
        id: 'f4',
        key: 'company',
        label: 'Company',
        type: 'text',
        category: 'work',
        value: 'Google',
        tags: ['work'],
        sensitive: false,
        createdAt: 1000,
        updatedAt: 1000,
        useCount: 2,
        lastUsedAt: 1200,
      },
    ],
  };

  const emptyProfile: Profile = {
    id: 'prof_empty',
    name: 'Empty Profile',
    icon: 'folder',
    fields: [],
  };

  it('builds direct 1-click fields under root for active profile', () => {
    const items = buildContextMenuDescriptors({
      profiles: [personalProfile, workProfile],
      settings: DEFAULT_SETTINGS,
      vaultInitialized: false,
      vaultUnlocked: false,
      cards: [],
      activeProfileId: 'prof_personal',
    });

    const root = items.find((i) => i.id === 'stashfill-root');
    expect(root).toBeDefined();

    // Active profile fields directly under root
    const emailField = items.find((i) => i.id === 'stashfill-field:prof_personal:f2');
    expect(emailField).toBeDefined();
    expect(emailField?.parentId).toBe('stashfill-root');
    expect(emailField?.title).toBe('Email Address');
  });

  it('creates nested submenus for other profiles that have data with fields first', () => {
    const items = buildContextMenuDescriptors({
      profiles: [personalProfile, workProfile, emptyProfile],
      settings: DEFAULT_SETTINGS,
      vaultInitialized: false,
      vaultUnlocked: false,
      cards: [],
      activeProfileId: 'prof_personal',
    });

    // Work has data: must create a submenu under root
    const workSubmenu = items.find((i) => i.id === 'stashfill-profile-sub:prof_work');
    expect(workSubmenu).toBeDefined();
    expect(workSubmenu?.parentId).toBe('stashfill-root');
    expect(workSubmenu?.title).toBe('Work');

    // Work fields must be parented under workSubmenu for 1-click paste
    const workEmail = items.find((i) => i.id === 'stashfill-field:prof_work:f3');
    expect(workEmail).toBeDefined();
    expect(workEmail?.parentId).toBe('stashfill-profile-sub:prof_work');
    expect(workEmail?.title).toBe('Work Email');

    const workCompany = items.find((i) => i.id === 'stashfill-field:prof_work:f4');
    expect(workCompany).toBeDefined();
    expect(workCompany?.parentId).toBe('stashfill-profile-sub:prof_work');

    // Submenu actions
    const fillWork = items.find((i) => i.id === 'stashfill-fill-profile:prof_work');
    expect(fillWork).toBeDefined();
    expect(fillWork?.parentId).toBe('stashfill-profile-sub:prof_work');

    // Profile without data: no submenu, listed as simple switcher
    const emptySubmenu = items.find((i) => i.id === 'stashfill-profile-sub:prof_empty');
    expect(emptySubmenu).toBeUndefined();

    const switchEmpty = items.find((i) => i.id === 'stashfill-switch-profile:prof_empty');
    expect(switchEmpty).toBeDefined();
    expect(switchEmpty?.parentId).toBe('stashfill-root');
  });
});
