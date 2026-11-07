import { describe, it, expect, beforeEach } from 'vitest';
import { encryptVault, decryptVault, VaultDecryptionError } from './crypto';
import { VaultManager } from './vaultManager';
import { StashRepository } from '../storage/StashRepository';
import { MemoryStorageAdapter } from '../storage/MemoryStorageAdapter';
import { maskCardNumber, detectCardBrand, type PaymentCard } from '../types/vault';

describe('Web Crypto Vault & Encryption', () => {
  it('encrypts and decrypts string payloads correctly', async () => {
    const secret = JSON.stringify({ message: 'ultra confidential user secret' });
    const pass = 'SuperSecretPassphrase123!';

    const payload = await encryptVault(secret, pass);
    expect(payload.version).toBe(1);
    expect(payload.ciphertext).toBeTypeOf('string');
    expect(payload.iv).toBeTypeOf('string');
    expect(payload.salt).toBeTypeOf('string');
    expect(payload.iterations).toBeGreaterThanOrEqual(100000);

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

  it('rejects tampered ciphertext', async () => {
    const payload = await encryptVault('secret', 'password');
    // Tamper ciphertext
    const tampered = {
      ...payload,
      ciphertext: payload.ciphertext.slice(0, -4) + 'AAAA',
    };
    await expect(decryptVault(tampered, 'password')).rejects.toThrow(VaultDecryptionError);
  });
});

describe('VaultManager', () => {
  let storage: MemoryStorageAdapter;
  let repo: StashRepository;
  let vaultManager: VaultManager;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    repo = new StashRepository(storage);
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
