import { describe, it, expect, beforeEach, vi } from 'vitest';
import { encryptVault, decryptVault, VaultDecryptionError, PBKDF2_ITERATIONS } from './crypto';
import { VaultManager, CardReauthRequiredError } from './vaultManager';
import { StashRepository } from '../storage/StashRepository';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter';
import { maskCardNumber, detectCardBrand, type PaymentCard } from '../types/vault';
import { copyCardNumberWithAutoClear, fillPaymentCard } from '../fill/domFiller';

describe('Web Crypto Vault & Encryption', () => {
  it('encrypts and decrypts string payloads with >= 600,000 PBKDF2-SHA256 iterations', async () => {
    const secret = JSON.stringify({ message: 'ultra confidential user secret' });
    const pass = 'SuperSecretPassphrase123!';

    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600_000);
    const payload = await encryptVault(secret, pass);
    expect(payload.version).toBe(1);
    expect(payload.ciphertext).toBeTypeOf('string');
    expect(payload.iv).toBeTypeOf('string');
    expect(payload.salt).toBeTypeOf('string');
    expect(payload.iterations).toBeGreaterThanOrEqual(600_000);

    const decrypted = await decryptVault(payload, pass);
    expect(decrypted).toBe(secret);
  });

  it('generates unique salt and IV for every encryption call', async () => {
    const text = 'identical text';
    const pass = 'samePassphrase';

    const p1 = await encryptVault(text, pass);
    const p2 = await encryptVault(text, pass);

    expect(p1.iv).not.toBe(p2.iv);
    expect(p1.salt).not.toBe(p2.salt);
    expect(p1.ciphertext).not.toBe(p2.ciphertext);
  });

  it('rejects wrong passphrase with VaultDecryptionError', async () => {
    const payload = await encryptVault('secret', 'correct-password');
    await expect(decryptVault(payload, 'wrong-password')).rejects.toThrow(VaultDecryptionError);
  });

  it('rejects tampered ciphertext, IV, or salt', async () => {
    const payload = await encryptVault('secret', 'password');
    const tamperedCipher = {
      ...payload,
      ciphertext: payload.ciphertext.slice(0, -4) + 'AAAA',
    };
    await expect(decryptVault(tamperedCipher, 'password')).rejects.toThrow(VaultDecryptionError);

    const tamperedIv = {
      ...payload,
      iv: payload.iv.slice(0, -4) + 'BBBB',
    };
    await expect(decryptVault(tamperedIv, 'password')).rejects.toThrow(VaultDecryptionError);
  });

  it('rejects iteration downgrade attacks (< 600,000 iterations)', async () => {
    const payload = await encryptVault('secret', 'password');
    const downgraded = {
      ...payload,
      iterations: 1000,
    };
    await expect(decryptVault(downgraded, 'password')).rejects.toThrow(VaultDecryptionError);
  });
});

describe('VaultManager', () => {
  let storage: MemoryStorageAdapter;
  let repo: StashRepository;
  let vaultManager: VaultManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    repo = new StashRepository(storage, 0);
    vaultManager = new VaultManager(repo);
  });

  it('handles initialization, unlock, and lock lifecycle', async () => {
    expect(await vaultManager.isInitialized()).toBe(false);
    expect(vaultManager.isUnlocked()).toBe(false);

    await vaultManager.initializeVault('master1234');
    expect(await vaultManager.isInitialized()).toBe(true);
    expect(vaultManager.isUnlocked()).toBe(true);

    vaultManager.lock();
    expect(vaultManager.isUnlocked()).toBe(false);

    await vaultManager.unlock('master1234');
    expect(vaultManager.isUnlocked()).toBe(true);
  });

  it('auto-locks after configurable timeout', async () => {
    vi.useFakeTimers();
    try {
      await repo.updateSettings({ vaultTimeoutMinutes: 5 });
      await vaultManager.initializeVault('master1234');
      expect(vaultManager.isUnlocked()).toBe(true);

      // Advance 4 minutes -> still unlocked
      vi.advanceTimersByTime(4 * 60 * 1000);
      expect(vaultManager.isUnlocked()).toBe(true);

      // Advance past 5 minutes -> automatically locked
      vi.advanceTimersByTime(2 * 60 * 1000);
      expect(vaultManager.isUnlocked()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('enforces step-up re-authentication for cards when last unlock was > N minutes ago (default 5)', async () => {
    await vaultManager.initializeVault('master1234');
    const card: PaymentCard = {
      id: 'card_reauth',
      nickname: 'StepUp Visa',
      cardholderName: 'Ada Lovelace',
      cardNumber: '4242424242424242',
      expMonth: '06',
      expYear: '29',
      brand: 'visa',
      createdAt: Date.now(),
    };
    await vaultManager.saveCard(card);

    const unlockedAt = vaultManager.getLastUnlockedAt()!;
    expect(vaultManager.requiresCardReauth(5, unlockedAt + 2 * 60 * 1000)).toBe(false);

    // 6 minutes later -> requires re-auth even though vault is still unlocked
    const sixMinsLater = unlockedAt + 6 * 60 * 1000;
    expect(vaultManager.requiresCardReauth(5, sixMinsLater)).toBe(true);
    await expect(vaultManager.getCardWithFreshAuth('card_reauth', 5, sixMinsLater)).rejects.toThrow(
      CardReauthRequiredError,
    );

    // Re-authenticating refreshes the unlock timestamp
    await vaultManager.reauthenticate('master1234');
    const freshNow = vaultManager.getLastUnlockedAt()!;
    expect(vaultManager.requiresCardReauth(5, freshNow + 1000)).toBe(false);
    const fetched = await vaultManager.getCardWithFreshAuth('card_reauth', 5, freshNow + 1000);
    expect(fetched?.nickname).toBe('StepUp Visa');
  });

  it('never persists CVV unless explicitly provided, and supports ephemeral one-time CVV at fill time', async () => {
    await vaultManager.initializeVault('master1234');

    const cardNoCvv: PaymentCard = {
      id: 'card_nocvv',
      nickname: 'No CVV Card',
      cardholderName: 'Grace Hopper',
      cardNumber: '4532015112830366',
      expMonth: '11',
      expYear: '28',
      brand: 'visa',
      createdAt: Date.now(),
    };
    await vaultManager.saveCard(cardNoCvv);

    const stored = await vaultManager.getCard('card_nocvv');
    expect(stored?.cvv).toBeUndefined();

    // Fill with ephemeral CVV in memory
    document.body.innerHTML = `
      <form>
        <input id="c-num" autocomplete="cc-number" />
        <input id="c-cvv" autocomplete="cc-csc" />
      </form>
    `;
    const fillRes = fillPaymentCard(document, stored!, {
      protocol: 'https:',
      confirmed: true,
      ephemeralCvv: '789',
    });
    expect(fillRes.filledCount).toBe(2);
    expect((document.getElementById('c-cvv') as HTMLInputElement).value).toBe('789');

    // Verify CVV is STILL not persisted in the vault after fill
    const afterFill = await vaultManager.getCard('card_nocvv');
    expect(afterFill?.cvv).toBeUndefined();
  });

  it('auto-clears copied card number from clipboard after 15 seconds', async () => {
    vi.useFakeTimers();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    });

    try {
      const ok = await copyCardNumberWithAutoClear('4532015112830366');
      expect(ok).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('4532015112830366');

      // At 14 seconds -> not cleared yet
      vi.advanceTimersByTime(14_000);
      expect(writeTextMock).toHaveBeenCalledTimes(1);

      // At 15 seconds -> overwritten with empty string
      vi.advanceTimersByTime(1_000);
      expect(writeTextMock).toHaveBeenCalledTimes(2);
      expect(writeTextMock).toHaveBeenLastCalledWith('');
    } finally {
      vi.useRealTimers();
    }
  });

  it('prevents accessing or saving cards when locked', async () => {
    await vaultManager.initializeVault('master1234');
    vaultManager.lock();

    await expect(vaultManager.getCards()).rejects.toThrow(/locked/i);

    const dummyCard: PaymentCard = {
      id: 'card_1',
      nickname: 'Personal Debit',
      cardholderName: 'Alice Doe',
      cardNumber: '4111111111111111',
      expMonth: '12',
      expYear: '28',
      cvv: '123',
      brand: 'visa',
      createdAt: Date.now(),
    };

    await expect(vaultManager.saveCard(dummyCard)).rejects.toThrow(/locked/i);
  });

  it('manages card CRUD operations when unlocked', async () => {
    await vaultManager.initializeVault('master1234');

    const card: PaymentCard = {
      id: 'card_1',
      nickname: 'Main Visa',
      cardholderName: 'John Doe',
      cardNumber: '4242424242424242',
      expMonth: '05',
      expYear: '29',
      cvv: '987',
      brand: 'visa',
      createdAt: Date.now(),
    };

    await vaultManager.saveCard(card);
    const cards = await vaultManager.getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]?.nickname).toBe('Main Visa');

    // Lock and unlock to verify persistence in encrypted store
    vaultManager.lock();
    await vaultManager.unlock('master1234');

    const reloadedCards = await vaultManager.getCards();
    expect(reloadedCards).toHaveLength(1);
    expect(reloadedCards[0]?.id).toBe('card_1');

    await vaultManager.deleteCard('card_1');
    const afterDelete = await vaultManager.getCards();
    expect(afterDelete).toHaveLength(0);
  });

  it('allows changing master passphrase and verifies new passphrase', async () => {
    await vaultManager.initializeVault('oldPassphrase123');

    const card: PaymentCard = {
      id: 'card_1',
      nickname: 'Amex Gold',
      cardholderName: 'John Doe',
      cardNumber: '378282246310005',
      expMonth: '08',
      expYear: '27',
      cvv: '1234',
      brand: 'amex',
      createdAt: Date.now(),
    };
    await vaultManager.saveCard(card);

    await vaultManager.changePassphrase('oldPassphrase123', 'newPassphrase456');

    vaultManager.lock();
    await expect(vaultManager.unlock('oldPassphrase123')).rejects.toThrow(VaultDecryptionError);

    await vaultManager.unlock('newPassphrase456');
    expect(vaultManager.isUnlocked()).toBe(true);
    const cards = await vaultManager.getCards();
    expect(cards).toHaveLength(1);
    expect(cards[0]?.nickname).toBe('Amex Gold');
  });

  it('masks card numbers properly for security', () => {
    expect(maskCardNumber('4111 2222 3333 4444')).toBe('•••• •••• •••• 4444');
    expect(maskCardNumber('378282246310005')).toBe('•••• •••• •••• 0005');
    expect(maskCardNumber('12')).toBe('••••');
  });

  it('detects card brands correctly', () => {
    expect(detectCardBrand('4111111111111111')).toBe('visa');
    expect(detectCardBrand('5100000000000000')).toBe('mastercard');
    expect(detectCardBrand('378282246310005')).toBe('amex');
    expect(detectCardBrand('6011000000000000')).toBe('discover');
    expect(detectCardBrand('9999000000000000')).toBe('other');
  });
});
