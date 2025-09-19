import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Generate a random salt for encryption
 */
export function generateSalt(): string {
  return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Derive encryption key from master key and salt
 */
function deriveKey(masterKey: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encrypt sensitive data (like API keys)
 * @param plaintext - The data to encrypt
 * @param userSalt - Unique salt for the user
 * @returns Encrypted data with format: salt:iv:tag:ciphertext
 */
export function encryptApiKey(plaintext: string, userSalt?: string): string {
  try {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Use provided salt or generate new one
    const salt = userSalt || generateSalt();
    const key = deriveKey(masterKey, salt);

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(salt, 'hex')); // Use salt as additional authenticated data

    // Encrypt
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get authentication tag
    const tag = cipher.getAuthTag();

    // Return format: salt:iv:tag:ciphertext
    return [
      salt,
      iv.toString('hex'),
      tag.toString('hex'),
      ciphertext
    ].join(':');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypt sensitive data (like API keys)
 * @param encryptedData - Data in format: salt:iv:tag:ciphertext
 * @returns Decrypted plaintext
 */
export function decryptApiKey(encryptedData: string): string {
  try {
    const masterKey = process.env.ENCRYPTION_KEY;
    if (!masterKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    // Parse encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [salt, ivHex, tagHex, ciphertext] = parts;

    // Derive key
    const key = deriveKey(masterKey, salt);

    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    decipher.setAAD(Buffer.from(salt, 'hex'));

    // Decrypt
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Hash sensitive data for comparison (one-way)
 * @param data - Data to hash
 * @param salt - Salt for hashing
 * @returns Hashed data
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || generateSalt();
  const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
  return `${actualSalt}:${hash.toString('hex')}`;
}

/**
 * Verify hashed data
 * @param data - Original data
 * @param hashedData - Hashed data to verify against
 * @returns True if data matches
 */
export function verifyHashedData(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':');
    const verification = hashData(data, salt);
    return verification === hashedData;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a secure random token
 * @param length - Length of token in bytes (default: 32)
 * @returns Random token as hex string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data for logging
 * @param data - Sensitive data to mask
 * @param visibleChars - Number of characters to show at start/end
 * @returns Masked string
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 8);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(Math.max(4, data.length - visibleChars * 2));

  return `${start}${middle}${end}`;
}

/**
 * Validate that encryption/decryption is working correctly
 */
export function validateEncryption(): boolean {
  try {
    const testData = 'test-api-key-12345';
    const encrypted = encryptApiKey(testData);
    const decrypted = decryptApiKey(encrypted);
    return testData === decrypted;
  } catch (error) {
    console.error('Encryption validation failed:', error);
    return false;
  }
}

// Validate encryption on module load
if (process.env.NODE_ENV !== 'test') {
  const isValid = validateEncryption();
  if (!isValid) {
    console.error('WARNING: Encryption system validation failed!');
  }
}