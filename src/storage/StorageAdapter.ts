/**
 * StorageAdapter interface.
 * Abstracts local extension storage to ensure zero lock-in and enable
 * adding cloud sync, encrypted backup, or alternate storage backends in the future
 * without rewriting business logic.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAll(): Promise<Record<string, unknown>>;
  watch<T>(key: string, callback: (newValue: T | null) => void): () => void;
}
