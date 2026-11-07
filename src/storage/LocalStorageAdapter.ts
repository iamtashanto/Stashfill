import { browser } from 'wxt/browser';
import { type StorageAdapter, StorageQuotaExceededError } from './StorageAdapter';

function getStorageApi() {
  try {
    if (
      typeof browser !== 'undefined' &&
      browser &&
      (browser as unknown as { storage?: unknown }).storage
    ) {
      return browser;
    }
  } catch {
    // fallback to globalThis in unit tests
  }
  const g = globalThis as unknown as {
    chrome?: {
      storage: {
        local: {
          get: (k: string) => Promise<Record<string, unknown>>;
          set: (obj: Record<string, unknown>) => Promise<void>;
        };
        onChanged: {
          addListener: (
            fn: (changes: Record<string, { newValue: unknown }>, area: string) => void,
          ) => void;
          removeListener: (
            fn: (changes: Record<string, { newValue: unknown }>, area: string) => void,
          ) => void;
        };
      };
    };
    browser?: {
      storage: {
        local: {
          get: (k: string) => Promise<Record<string, unknown>>;
          set: (obj: Record<string, unknown>) => Promise<void>;
        };
        onChanged: {
          addListener: (
            fn: (changes: Record<string, { newValue: unknown }>, area: string) => void,
          ) => void;
          removeListener: (
            fn: (changes: Record<string, { newValue: unknown }>, area: string) => void,
          ) => void;
        };
      };
    };
  };
  return g.browser?.storage ? g.browser : g.chrome;
}

export class LocalStorageAdapter implements StorageAdapter {
  async load<T>(key: string): Promise<T | null> {
    try {
      const api = getStorageApi();
      if (!api) return null;
      const res = await api.storage.local.get(key);
      return (res[key] as T) ?? null;
    } catch {
      return null;
    }
  }

  async save<T>(key: string, value: T): Promise<void> {
    try {
      const api = getStorageApi();
      if (!api) return;
      await api.storage.local.set({ [key]: value });
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

    const api = getStorageApi();
    if (api) {
      api.storage.onChanged.addListener(listener);
    }
    return () => {
      if (api) {
        api.storage.onChanged.removeListener(listener);
      }
    };
  }
}
