import crypto from "crypto";
import { BROKER_ENC_KEY } from "../config";

function getEncryptionKey(): Buffer {
  const rawKey = BROKER_ENC_KEY || process.env.BROKER_ENC_KEY;
  if (!rawKey) {
    throw new Error("BROKER_ENC_KEY environment variable is required for broker token encryption");
  }
  // If hex string of length 64 (32 bytes), parse directly, otherwise hash with sha256 to guarantee 32 bytes
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }
  return crypto.createHash("sha256").update(rawKey).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a ciphertext string created by encryptToken.
 */
export function decryptToken(encryptedString: string): string {
  if (!encryptedString) return "";
  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(cipherHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
