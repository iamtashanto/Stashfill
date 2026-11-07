export class StashfillError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StashfillError';
  }
}

export class EncryptionRequiredError extends StashfillError {
  constructor(
    message = 'Refusing to save payment card: vault encryption is required but inactive',
  ) {
    super(message);
    this.name = 'EncryptionRequiredError';
  }
}

export class StorageQuotaExceededError extends StashfillError {
  constructor(message = 'Storage quota exceeded') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

export class VaultDecryptionError extends StashfillError {
  constructor(message = 'Decryption failed: invalid passphrase or corrupted vault data') {
    super(message);
    this.name = 'VaultDecryptionError';
  }
}
