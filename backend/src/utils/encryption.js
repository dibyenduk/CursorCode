const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Gets the encryption key from environment variables
 * In production, use Azure Key Vault or secure key management
 */
function getEncryptionKey() {
  const key = process.env.EncryptionKey;
  if (!key || key.length !== 32) {
    throw new Error('Encryption key must be exactly 32 characters long');
  }
  return Buffer.from(key, 'utf8');
}

/**
 * Encrypts a string value using AES-256-GCM
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text as a hex string
 */
function encrypt(text) {
  if (!text) {
    throw new Error('Text to encrypt cannot be empty');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ]);

  const tag = cipher.getAuthTag();

  // Combine salt + iv + tag + encrypted data
  const combined = Buffer.concat([
    salt,
    iv,
    tag,
    encrypted
  ]);

  return combined.toString('hex');
}

/**
 * Decrypts an encrypted hex string
 * @param {string} encryptedHex - The encrypted text as a hex string
 * @returns {string} - The decrypted text
 */
function decrypt(encryptedHex) {
  if (!encryptedHex) {
    throw new Error('Encrypted text cannot be empty');
  }

  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedHex, 'hex');

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = combined.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = combined.subarray(ENCRYPTED_POSITION);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

module.exports = {
  encrypt,
  decrypt
};
