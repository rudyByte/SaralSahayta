import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default_key_placeholder_change_me', 'salt', 32);

/**
 * Encrypts sensitive data strings.
 * Returns a string format: iv:authTag:encryptedData
 */
export function encryptSensitiveData(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data encrypted by encryptSensitiveData.
 */
export function decryptSensitiveData(encryptedData: string): string {
  const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Masks sensitive strings (e.g., Aadhaar, Account Number)
 * Shows only last 4 digits.
 */
export function maskSensitiveData(text: string, visibleDigits = 4): string {
  if (!text || text.length <= visibleDigits) return text;
  const maskedLength = text.length - visibleDigits;
  return 'X'.repeat(maskedLength) + text.slice(-visibleDigits);
}
