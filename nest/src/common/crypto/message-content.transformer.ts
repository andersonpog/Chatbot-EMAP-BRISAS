import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { ValueTransformer } from 'typeorm';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'enc:v1';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.MESSAGE_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error('MESSAGE_ENCRYPTION_KEY must be configured to encrypt message content.');
  }

  const trimmedKey = rawKey.trim();

  if (/^[a-f0-9]{64}$/i.test(trimmedKey)) {
    return Buffer.from(trimmedKey, 'hex');
  }

  const base64Key = Buffer.from(trimmedKey, 'base64');
  if (base64Key.length === 32) {
    return base64Key;
  }

  return createHash('sha256').update(trimmedKey).digest();
}

function isEncrypted(value: string): boolean {
  return value.startsWith(`${ENCRYPTED_PREFIX}:`);
}

export function encryptMessageContent(value: string | null | undefined): string | null | undefined {
  if (value == null || value === '' || isEncrypted(value)) {
    return value;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_PREFIX,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':');
}

export function decryptMessageContent(value: string | null | undefined): string | null | undefined {
  if (value == null || value === '' || !isEncrypted(value)) {
    return value;
  }

  const [, , ivBase64, authTagBase64, encryptedBase64] = value.split(':');

  if (!ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error('Encrypted message content has an invalid format.');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivBase64, 'base64'),
    { authTagLength: AUTH_TAG_LENGTH },
  );

  decipher.setAuthTag(Buffer.from(authTagBase64, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

export const messageContentTransformer: ValueTransformer = {
  to: encryptMessageContent,
  from: decryptMessageContent,
};
