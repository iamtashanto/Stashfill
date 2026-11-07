export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    // Stashfill content script
    // Listens for fill actions on active page
  },
});
