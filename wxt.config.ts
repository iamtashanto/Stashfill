import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// Permissions justification:
// - storage: Store user profiles and encrypted vault strictly locally on-device.
// - activeTab: Access the current tab when the user clicks extension icon or popup to fill fields.
// - contextMenus: Provide right-click quick-fill / copy shortcuts on inputs.
// - clipboardWrite: Enable quick copy-to-clipboard for user stash items without pasting.
export default defineConfig({
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'activeTab', 'contextMenus', 'clipboardWrite'],
    action: {
      default_title: '__MSG_actionTitle__',
    },
    browser_specific_settings: {
      gecko: {
        id: 'stashfill@stashfill.org',
        strict_min_version: '109.0',
      },
    },
  },
});
