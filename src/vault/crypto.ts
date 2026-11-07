import type { EncryptedPayload } from '../types/vault';

export class VaultDecryptionError extends Error {
  constructor(message = 'Decryption failed: invalid passphrase or corrupted vault data') {
    super(message);
    this.name = 'VaultDecryptionError';
  }
}

const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
  usage: KeyUsage[],
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passBuffer = enc.encode(passphrase);

  const baseKey = await crypto.subtle.importKey('raw', passBuffer, { name: 'PBKDF2' }, false, [
    'deriveKey',
  ]);

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    usage,
  );
}

/**
 * Encrypt arbitrary JSON-serializable plaintext using AES-GCM 256-bit with PBKDF2 key derivation.
 */
export async function encryptVault(
  plaintext: string,
  passphrase: string,
): Promise<EncryptedPayload> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));

  const key = await deriveKey(passphrase, salt, PBKDF2_ITERATIONS, ['encrypt']);

  const enc = new TextEncoder();
  const encodedPlaintext = enc.encode(plaintext);

  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encodedPlaintext,
  );

  return {
    version: 1,
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Decrypt an AES-GCM encrypted payload using the provided passphrase.
 * Throws VaultDecryptionError if the passphrase is wrong or the ciphertext is tampered.
 */
export async function decryptVault(payload: EncryptedPayload, passphrase: string): Promise<string> {
  try {
    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const ciphertext = base64ToArrayBuffer(payload.ciphertext);

    const key = await deriveKey(passphrase, salt, payload.iterations, ['decrypt']);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext,
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    if (err instanceof VaultDecryptionError) throw err;
    throw new VaultDecryptionError();
  }
}
