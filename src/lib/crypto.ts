import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Encrypts small secrets (like a user's AI API key) before they're stored
// in the database, so a DB dump/backup/leaked service-role key doesn't
// expose plaintext keys. This is NOT a replacement for RLS — it's a
// second layer, specifically against "someone with raw DB access".
//
// Requires API_KEY_ENCRYPTION_SECRET in the environment (server-only,
// never NEXT_PUBLIC_*). Generate one with:
//   openssl rand -base64 32
//
// Format stored in the DB: "v1:<ivHex>:<authTagHex>:<ciphertextHex>"
// The "v1:" prefix lets us change the scheme later without breaking
// old rows.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET is not set. Generate one with `openssl rand -base64 32` and add it to your environment."
    );
  }
  // Derive a fixed 32-byte key from whatever-length secret is provided.
  return scryptSync(secret, "struja-api-key-salt", 32);
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
}

export function decryptSecret(stored: string): string {
  // Backward-compat: if a row was saved before encryption existed
  // (plaintext, no "v1:" prefix), return it as-is rather than crashing.
  if (!stored.startsWith("v1:")) return stored;

  const [, ivHex, authTagHex, ciphertextHex] = stored.split(":");
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, "hex")),
    decipher.final(),
  ]);
  return plaintext.toString("utf8");
}
