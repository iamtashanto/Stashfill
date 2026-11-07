import type { StashRepository } from '../storage/StashRepository';
import {
  type PaymentCard,
  type VaultContent,
  VaultContentSchema,
  PaymentCardSchema,
} from '../types/vault';
import { encryptVault, decryptVault, VaultDecryptionError } from './crypto';

export class VaultManager {
  private unlockedContent: VaultContent | null = null;
  private currentPassphrase: string | null = null;
  private autoLockTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private onLockListeners = new Set<() => void>();

  constructor(private repo: StashRepository) {}

  async isInitialized(): Promise<boolean> {
    const payload = await this.repo.getEncryptedVault();
    return payload !== null;
  }

  isUnlocked(): boolean {
    return this.unlockedContent !== null && this.currentPassphrase !== null;
  }

  onLock(listener: () => void): () => void {
    this.onLockListeners.add(listener);
    return () => {
      this.onLockListeners.delete(listener);
    };
  }

  private resetAutoLockTimer(minutes: number) {
    if (this.autoLockTimeoutHandle) {
      clearTimeout(this.autoLockTimeoutHandle);
      this.autoLockTimeoutHandle = null;
    }

    if (minutes > 0) {
      this.autoLockTimeoutHandle = setTimeout(
        () => {
          this.lock();
        },
        minutes * 60 * 1000,
      );
    }
  }

  lock(): void {
    this.unlockedContent = null;
    this.currentPassphrase = null;
    if (this.autoLockTimeoutHandle) {
      clearTimeout(this.autoLockTimeoutHandle);
      this.autoLockTimeoutHandle = null;
    }
    this.onLockListeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // ignore listener errors
      }
    });
  }

  async initializeVault(passphrase: string): Promise<void> {
    if (!passphrase || passphrase.length < 6) {
      throw new Error('Master passphrase must be at least 6 characters');
    }

    const emptyContent: VaultContent = {
      cards: [],
      notes: [],
    };

    const payload = await encryptVault(JSON.stringify(emptyContent), passphrase);
    await this.repo.saveEncryptedVault(payload);

    this.unlockedContent = emptyContent;
    this.currentPassphrase = passphrase;

    const settings = await this.repo.getSettings();
    this.resetAutoLockTimer(settings.vaultTimeoutMinutes);
  }

  async unlock(passphrase: string): Promise<VaultContent> {
    const payload = await this.repo.getEncryptedVault();
    if (!payload) {
      throw new Error('Vault is not initialized');
    }

    const decryptedStr = await decryptVault(payload, passphrase);
    const parsed = VaultContentSchema.parse(JSON.parse(decryptedStr));

    this.unlockedContent = parsed;
    this.currentPassphrase = passphrase;

    const settings = await this.repo.getSettings();
    this.resetAutoLockTimer(settings.vaultTimeoutMinutes);

    return parsed;
  }

  private ensureUnlocked(): { content: VaultContent; passphrase: string } {
    if (!this.unlockedContent || !this.currentPassphrase) {
      throw new Error('Vault is locked. Unlock before accessing contents.');
    }
    return {
      content: this.unlockedContent,
      passphrase: this.currentPassphrase,
    };
  }

  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<void> {
    if (!newPassphrase || newPassphrase.length < 6) {
      throw new Error('New master passphrase must be at least 6 characters');
    }

    // Verify old passphrase by attempting unlock
    const currentContent = this.isUnlocked()
      ? this.unlockedContent!
      : await this.unlock(oldPassphrase);

    const newPayload = await encryptVault(JSON.stringify(currentContent), newPassphrase);
    await this.repo.saveEncryptedVault(newPayload);

    this.currentPassphrase = newPassphrase;
  }

  async getCards(): Promise<PaymentCard[]> {
    const { content } = this.ensureUnlocked();
    return content.cards;
  }

  async getCard(id: string): Promise<PaymentCard | null> {
    const { content } = this.ensureUnlocked();
    return content.cards.find((c) => c.id === id) ?? null;
  }

  async saveCard(card: PaymentCard): Promise<PaymentCard> {
    const { content, passphrase } = this.ensureUnlocked();
    const validated = PaymentCardSchema.parse(card);

    const index = content.cards.findIndex((c) => c.id === validated.id);
    let updatedCards: PaymentCard[];
    if (index >= 0) {
      updatedCards = [...content.cards];
      updatedCards[index] = validated;
    } else {
      updatedCards = [...content.cards, validated];
    }

    const newContent: VaultContent = {
      ...content,
      cards: updatedCards,
    };

    const payload = await encryptVault(JSON.stringify(newContent), passphrase);
    await this.repo.saveEncryptedVault(payload);

    this.unlockedContent = newContent;
    const settings = await this.repo.getSettings();
    this.resetAutoLockTimer(settings.vaultTimeoutMinutes);

    return validated;
  }

  async deleteCard(id: string): Promise<void> {
    const { content, passphrase } = this.ensureUnlocked();
    const filtered = content.cards.filter((c) => c.id !== id);

    const newContent: VaultContent = {
      ...content,
      cards: filtered,
    };

    const payload = await encryptVault(JSON.stringify(newContent), passphrase);
    await this.repo.saveEncryptedVault(payload);

    this.unlockedContent = newContent;
  }
}

export { VaultDecryptionError };
