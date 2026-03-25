import crypto from "crypto";

/**
 * Encryption utilities for AES-256-GCM encryption
 * Uses authenticated encryption to ensure file integrity
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits for PBKDF2

/**
 * Derives a 256-bit key from a user's encryption key using PBKDF2
 * @param userKey - The user's encryption key (password or generated key)
 * @param salt - Optional salt for key derivation
 * @returns Object with derived key and salt
 */
export function deriveKey(
  userKey: string,
  salt?: Buffer
): { key: Buffer; salt: Buffer } {
  const derivedSalt = salt || crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(userKey, derivedSalt, 100000, 32, "sha256");
  return { key, salt: derivedSalt };
}

/**
 * Encrypts data using AES-256-GCM
 * @param data - The data to encrypt (Buffer or string)
 * @param encryptionKey - The encryption key
 * @returns Encrypted data with IV, auth tag, and salt prepended
 */
export function encryptData(
  data: Buffer | string,
  encryptionKey: string
): Buffer {
  const dataBuffer = typeof data === "string" ? Buffer.from(data) : data;

  // Derive key with random salt
  const { key, salt } = deriveKey(encryptionKey);

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine: salt + iv + authTag + encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

/**
 * Decrypts data encrypted with encryptData
 * @param encryptedData - The encrypted data (with salt, IV, auth tag prepended)
 * @param encryptionKey - The encryption key
 * @returns Decrypted data as Buffer
 */
export function decryptData(
  encryptedData: Buffer,
  encryptionKey: string
): Buffer {
  // Extract components
  const salt = encryptedData.slice(0, SALT_LENGTH);
  const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = encryptedData.slice(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = encryptedData.slice(
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );

  // Derive key using extracted salt
  const { key } = deriveKey(encryptionKey, salt);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt data
  try {
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed: invalid key or corrupted data");
  }
}

/**
 * Generates a random encryption key (32 bytes = 256 bits)
 * @returns Base64-encoded encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Creates a hash of an encryption key for storage (to verify key without storing it)
 * @param key - The encryption key
 * @returns Base64-encoded hash
 */
export function hashEncryptionKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("base64");
}

/**
 * Generates a secure random token for file sharing
 * @returns URL-safe base64 token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
