import { browser } from 'wxt/browser';
import { type StorageAdapter, StorageQuotaExceededError } from './StorageAdapter';

export class LocalStorageAdapter implements StorageAdapter {
  async load<T>(key: string): Promise<T | null> {
    try {
      const res = await browser.storage.local.get(key);
      return (res[key] as T) ?? null;
    } catch {
      return null;
    }
  }

  async save<T>(key: string, value: T): Promise<void> {
    try {
      await browser.storage.local.set({ [key]: value });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('QUOTA_BYTES') ||
        message.includes('quota exceeded') ||
        message.includes('QuotaExceededError')
      ) {
        throw new StorageQuotaExceededError(message);
      }
      throw err;
    }
  }

  subscribe<T>(key: string, callback: (value: T | null) => void): () => void {
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
