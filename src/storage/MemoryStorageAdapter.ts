import type { StorageAdapter } from './StorageAdapter';

/**
 * In-memory storage adapter for unit tests and non-browser environments.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, unknown>();
  private listeners = new Map<string, Set<(newValue: unknown) => void>>();

  async get<T>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    if (val === undefined) return null;
    return JSON.parse(JSON.stringify(val)) as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const cloned = JSON.parse(JSON.stringify(value));
    this.store.set(key, cloned);
    const setListeners = this.listeners.get(key);
    if (setListeners) {
      setListeners.forEach((fn) => fn(cloned));
    }
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
    const setListeners = this.listeners.get(key);
    if (setListeners) {
      setListeners.forEach((fn) => fn(null));
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.listeners.forEach((setListeners) => {
      setListeners.forEach((fn) => fn(null));
    });
  }

  async getAll(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of this.store.entries()) {
      result[k] = JSON.parse(JSON.stringify(v));
    }
    return result;
  }

  watch<T>(key: string, callback: (newValue: T | null) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const setListeners = this.listeners.get(key)!;
    const listener = callback as (newValue: unknown) => void;
    setListeners.add(listener);
    return () => {
      setListeners.delete(listener);
    };
  }
}
