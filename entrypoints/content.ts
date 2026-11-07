import {
  fillFormWithProfile,
  fillElement,
  fillPaymentCard,
  extractFieldAttributes,
  isFillable,
  type FillableElement,
} from '../src/filler/domFiller';
import { matchProfileField } from '../src/filler/matcher';
import type { ExtensionMessage } from '../src/types/messages';
import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    let lastRightClickedElement: FillableElement | null = null;

    // Track context menu target
    document.addEventListener(
      'contextmenu',
      (ev) => {
        const target = ev.target as Element;
        if (target && isFillable(target)) {
          lastRightClickedElement = target as FillableElement;
        } else {
          lastRightClickedElement = null;
        }
      },
      true,
    );

    // Listen to messages from popup or background service worker
    browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
      const msg = message as ExtensionMessage;
      if (!msg || !msg.type) return;

      switch (msg.type) {
        case 'FILL_PAGE_FORM': {
          const result = fillFormWithProfile(document, msg.profile);
          sendResponse({ success: true, count: result.filledCount });
          return true;
        }

        case 'FILL_PAYMENT_CARD': {
          // Principle 6: explicit confirmation required
          if (!msg.confirmed) {
            sendResponse({ success: false, error: 'Confirmation required for payment card fill' });
            return true;
          }
          const result = fillPaymentCard(document, msg.card);
          sendResponse({ success: true, count: result.filledCount });
          return true;
        }

        case 'FILL_ACTIVE_FIELD': {
          const active =
            lastRightClickedElement ||
            (document.activeElement as FillableElement) ||
            document.querySelector('input:focus, textarea:focus, [contenteditable="true"]:focus');

          if (!active || !isFillable(active)) {
            sendResponse({ success: false, error: 'No active fillable field found' });
            return true;
          }

          if (msg.target.kind === 'profileField') {
            const ok = fillElement(active, msg.target.value);
            sendResponse({ success: ok });
          } else {
            sendResponse({ success: false, error: 'Unsupported target for single field' });
          }
          return true;
        }

        case 'GET_FOCUSED_INPUT_INFO': {
          const active = document.activeElement;
          if (active && isFillable(active)) {
            const attrs = extractFieldAttributes(active);
            const guess = matchProfileField(attrs);
            sendResponse({
              hasFocusedInput: true,
              fieldTypeGuess: guess ?? undefined,
            });
          } else {
            sendResponse({ hasFocusedInput: false });
          }
          return true;
        }
      }
    });
  },
});
