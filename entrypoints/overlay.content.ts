export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',
  async main() {
    // Stashfill content-injected overlay for quick picker / inline chip
    // Mounts an isolated container to display inline quick-actions
  },
});
