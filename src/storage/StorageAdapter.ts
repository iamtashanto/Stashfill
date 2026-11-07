export class StorageQuotaExceededError extends Error {
  constructor(message = 'Storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

/**
 * StorageAdapter interface.
 * Decouples storage backend (local extension storage, memory, future sync)
 * from application repository and business logic.
 */
export interface StorageAdapter {
  load<T>(key: string): Promise<T | null>;
  save<T>(key: string, value: T): Promise<void>;
  subscribe<T>(key: string, callback: (value: T | null) => void): () => void;
}
