import { browser } from 'wxt/browser';
import type { StorageAdapter } from './StorageAdapter';

/**
 * LocalStorageAdapter uses browser.storage.local.
 * Completely offline, zero network requests, local to user device.
 */
export class LocalStorageAdapter implements StorageAdapter {
  async get<T>(key: string): Promise<T | null> {
    const res = await browser.storage.local.get(key);
    return (res[key] as T) ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await browser.storage.local.remove(key);
  }

  async clear(): Promise<void> {
    await browser.storage.local.clear();
  }

  async getAll(): Promise<Record<string, unknown>> {
    return await browser.storage.local.get(null);
  }

  watch<T>(key: string, callback: (newValue: T | null) => void): () => void {
    const listener = (
      changes: { [k: string]: { oldValue?: unknown; newValue?: unknown } },
      areaName: string,
    ) => {
      if (areaName === 'local' && key in changes) {
        callback((changes[key]?.newValue as T) ?? null);
      }
    };
    browser.storage.onChanged.addListener(listener);
    return () => {
      browser.storage.onChanged.removeListener(listener);
    };
  }
}
