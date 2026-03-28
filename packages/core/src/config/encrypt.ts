import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH =16;
const KEY_LENGTH = 32;

export function encrypt(plaintext: string, secret: string): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, encrypted]).toString('base64');
}

export function decrypt(cipherText: string, secret: string): string {
  const key = deriveKey(secret);
  const combined = Buffer.from(cipherText, 'base64');
  const iv = combined.subarray(0, IV_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export function encryptObject(obj: Record<string, unknown>, secret: string): string {
  return encrypt(JSON.stringify(obj), secret);
}

export function decryptObject<T>(cipherText: string, secret: string): T {
  return JSON.parse(decrypt(cipherText, secret)) as T;
}

function deriveKey(secret: string): Buffer {
  if (secret.length >= KEY_LENGTH) {
    return Buffer.from(secret.slice(0, KEY_LENGTH));
  }
  const key = Buffer.alloc(KEY_LENGTH);
  Buffer.from(secret).copy(key);
  return key;
}
