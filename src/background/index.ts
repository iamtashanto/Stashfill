import { browser } from 'wxt/browser';
import type { ExtensionMessage } from '../shared/messages';

/**
 * Sends a message to the currently active tab.
 */
export async function sendToActiveTab<T = unknown>(message: ExtensionMessage): Promise<T | null> {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = tabs[0]?.id;
    if (!tabId) return null;
    return (await browser.tabs.sendMessage(tabId, message)) as T;
  } catch {
    return null;
  }
}
