export const en = {
  appName: 'Stashfill',
  tagline: 'Offline, no-login, privacy-first autofill and quick-paste',

  // Common actions
  actions: {
    fillForm: 'Fill Form',
    fillField: 'Fill',
    copy: 'Copy',
    copied: 'Copied!',
    filled: 'Filled {count} fields!',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    add: 'Add',
    unlock: 'Unlock',
    lock: 'Lock Vault',
    confirm: 'Confirm',
    search: 'Search fields...',
    export: 'Export Data',
    import: 'Import Data',
    settings: 'Settings',
    options: 'Options & Profiles',
    close: 'Close',
  },

  // Field sections
  sections: {
    personal: 'Personal Information',
    contact: 'Contact Details',
    address: 'Address',
    links: 'Links & Social',
    custom: 'Custom Fields',
    vault: 'Secure Vault (Payment Cards)',
  },

  // Field labels
  fields: {
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    title: 'Title / Prefix',
    gender: 'Gender',
    email: 'Email',
    phone: 'Phone',
    altPhone: 'Alternate Phone',
    address1: 'Street Address',
    address2: 'Apartment, Suite, Unit',
    city: 'City',
    state: 'State / Province',
    postalCode: 'Postal / ZIP Code',
    country: 'Country',
    website: 'Website',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    twitter: 'Twitter / X',
    nickname: 'Nickname',
    cardholderName: 'Cardholder Name',
    cardNumber: 'Card Number',
    expiry: 'Expiry Date',
    expMonth: 'Month (MM)',
    expYear: 'Year (YY)',
    cvv: 'CVV / CVC',
    brand: 'Card Brand',
  },

  // Vault
  vault: {
    title: 'Encrypted Vault',
    description:
      'Payment cards are encrypted with AES-GCM 256-bit using your master passphrase. Never stored in plaintext, never auto-suggested.',
    unlockedBadge: 'Vault Unlocked',
    lockedBadge: 'Vault Locked',
    uninitializedBadge: 'Vault Not Setup',
    enterPassphrase: 'Enter master passphrase to unlock',
    setupPassphrase: 'Create a master passphrase to enable the encrypted vault',
    passphrasePlaceholder: 'Master passphrase (min 6 characters)',
    confirmPassphrasePlaceholder: 'Confirm master passphrase',
    passphraseMismatch: 'Passphrases do not match',
    invalidPassphrase: 'Incorrect passphrase or corrupted vault',
    autoLockNote: 'Vault automatically locks after {minutes} minutes of inactivity.',
    addCard: 'Add Payment Card',
    noCardsYet: 'No payment cards stored. Click Add to store your first card safely.',
    confirmFillTitle: 'Confirm Payment Card Autofill',
    confirmFillWarning:
      'You are about to autofill sensitive payment card details ({nickname} - {masked}) into this page. Please confirm you trust this website.',
    confirmFillButton: 'Yes, Fill Card',
  },

  // Settings
  settings: {
    title: 'Settings',
    profilesTitle: 'Manage Profiles',
    activeProfile: 'Active Profile',
    newProfile: 'New Profile',
    profileName: 'Profile Name',
    isDefaultProfile: 'Default Profile',
    theme: 'Theme',
    themes: {
      system: 'System Default',
      light: 'Light',
      dark: 'Dark',
    },
    language: 'Language',
    languages: {
      en: 'English',
      bn: 'বাংলা (Bangla)',
    },
    vaultTimeout: 'Vault Auto-Lock Timeout',
    vaultTimeoutMinutes: '{minutes} minutes',
    confirmPaymentFill: 'Require confirmation before filling payment cards',
    exportImportTitle: 'Backup & Restore',
    exportDesc: 'Download your saved profiles as an offline JSON file.',
    exportWithVault: 'Include encrypted vault in export (requires master passphrase to restore)',
    importDesc: 'Restore profiles from a previously exported JSON backup.',
    importSuccess: 'Successfully imported {count} profile(s)!',
    privacyNote:
      'Stashfill operates 100% offline. No analytics, no accounts, no tracking. Your data never leaves your device.',
  },

  // Status & errors
  messages: {
    noFormFound: 'No form fields detected on active page.',
    fillSuccess: 'Successfully filled {count} fields!',
    cardFilledSuccess: 'Payment card details filled.',
    profileSaved: 'Profile saved successfully.',
    profileDeleted: 'Profile deleted.',
    cardSaved: 'Payment card saved to vault.',
    cardDeleted: 'Payment card removed.',
  },
};

export type Translations = typeof en;
