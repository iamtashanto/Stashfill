import { type StorageAdapter, StorageQuotaExceededError } from './StorageAdapter';

export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, unknown>();
  private listeners = new Map<string, Set<(val: unknown) => void>>();
  private maxByteSize = Infinity;

  setMaxByteSize(bytes: number) {
    this.maxByteSize = bytes;
  }

  async load<T>(key: string): Promise<T | null> {
    const val = this.store.get(key);
    if (val === undefined) return null;
    return JSON.parse(JSON.stringify(val)) as T;
  }

  async save<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    if (serialized.length > this.maxByteSize) {
      throw new StorageQuotaExceededError('QUOTA_BYTES quota exceeded in MemoryStorageAdapter');
    }

    const cloned = JSON.parse(serialized);
    this.store.set(key, cloned);

    const set = this.listeners.get(key);
    if (set) {
      set.forEach((fn) => fn(cloned));
    }
  }

  subscribe<T>(key: string, callback: (value: T | null) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    const set = this.listeners.get(key)!;
    const listener = callback as (val: unknown) => void;
    set.add(listener);

    return () => {
      set.delete(listener);
    };
  }

  // Raw helper to simulate corruption in tests
  setRawDirect(key: string, rawVal: unknown) {
    this.store.set(key, rawVal);
  }
}
