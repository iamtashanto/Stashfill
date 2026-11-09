import { render } from 'preact';
import { browser } from 'wxt/browser';
import { App } from './App';
import '../../src/styles/global.css';

// Automatically breakout from embedded modal (e.g. Brave extensions manager modal) to full browser tab
if (typeof window !== 'undefined' && window.self !== window.top) {
  try {
    const url = browser?.runtime?.getURL
      ? browser.runtime.getURL('/options.html')
      : '/options.html';
    if (browser?.tabs?.create) {
      void browser.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  } catch {
    // best-effort redirect
  }
}

const root = document.getElementById('root');
if (root) {
  render(<App />, root);
}
