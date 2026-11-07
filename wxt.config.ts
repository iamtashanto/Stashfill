import { defineConfig } from 'wxt';
import preact from '@preact/preset-vite';

// Permissions justification:
// - storage: Store user profiles and encrypted vault strictly locally on-device.
// - activeTab: Access the current tab when the user clicks extension icon, popup, or context menu.
// - scripting: Programmatically inject or execute scripts on demand for form filling and inline chip overlay.
// - contextMenus: Provide right-click quick-fill / copy shortcuts on inputs.
// Optional host permissions:
// - http://*/* and https://*/*: Requested at runtime only if the user enables the inline-chip overlay feature.
export default defineConfig({
  vite: () => ({
    plugins: [preact()],
  }),
  manifest: {
    name: 'Stashfill',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus'],
    optional_host_permissions: ['https://*/*', 'http://*/*'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; base-uri 'self';",
    },
    action: {
      default_title: 'Stashfill',
      default_popup: 'popup.html',
    },
    commands: {
      'open-quick-picker': {
        suggested_key: {
          default: 'Ctrl+Shift+Space',
          mac: 'Command+Shift+Space',
        },
        description: 'Open Stashfill Quick Picker overlay',
      },
      'fill-all-fields': {
        suggested_key: {
          default: 'Alt+Shift+F',
          mac: 'Alt+Shift+F',
        },
        description: 'Fill all matching fields with default profile',
      },
      'fill-payment-card': {
        suggested_key: {
          default: 'Alt+Shift+C',
          mac: 'Alt+Shift+C',
        },
        description: 'Fill payment card (with confirmation)',
      },
    },
    icons: {
      16: '/icons/icon-16.png',
      32: '/icons/icon-32.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png',
    },
    browser_specific_settings: {
      gecko: {
        id: 'stashfill@stashfill.org',
        strict_min_version: '109.0',
      },
    },
  },
});
