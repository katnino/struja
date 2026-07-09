import { encryptSecret, decryptSecret } from "./crypto";

// Set up test environment
const originalEnv = process.env;

describe("crypto utilities", () => {
  beforeEach(() => {
    // Set a known secret for testing
    process.env.API_KEY_ENCRYPTION_SECRET = "test-secret-key-32-chars-long!";
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe("encryptSecret", () => {
    it("should encrypt and decrypt a simple string", () => {
      const plaintext = "my-api-key-12345";
      const encrypted = encryptSecret(plaintext);

      // Should return a string with v1: prefix
      expect(encrypted).toMatch(/^v1:/);

      // Should be different from plaintext
      expect(encrypted).not.toBe(plaintext);

      // Should be able to decrypt
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt empty string", () => {
      const plaintext = "";
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt string with special characters", () => {
      const plaintext = "api-key!@#$%^&*()_+-=[]{}|;':\",./<>?";
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should encrypt string with unicode characters", () => {
      const plaintext = "ключ-api-ключ-ключ";
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should produce different ciphertexts for same plaintext", () => {
      const plaintext = "same-api-key";
      const encrypted1 = encryptSecret(plaintext);
      const encrypted2 = encryptSecret(plaintext);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same plaintext
      expect(decryptSecret(encrypted1)).toBe(plaintext);
      expect(decryptSecret(encrypted2)).toBe(plaintext);
    });

    it("should throw when API_KEY_ENCRYPTION_SECRET is not set", () => {
      delete process.env.API_KEY_ENCRYPTION_SECRET;
      expect(() => encryptSecret("test")).toThrow(
        "API_KEY_ENCRYPTION_SECRET is not set",
      );
    });
  });

  describe("decryptSecret", () => {
    it("should return plaintext as-is for backward compatibility", () => {
      const plaintext = "old-plaintext-key";
      const result = decryptSecret(plaintext);
      expect(result).toBe(plaintext);
    });

    it("should decrypt properly encrypted string", () => {
      const plaintext = "new-encrypted-key";
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("should handle malformed encrypted string gracefully", () => {
      // Test with invalid format - should return as-is for backward compatibility
      const result = decryptSecret("invalid:format");
      expect(result).toBe("invalid:format");

      // Test with v1: prefix but invalid hex - should throw
      expect(() =>
        decryptSecret("v1:invalid:hex:invalid:hex:invalid:hex"),
      ).toThrow();
    });
  });
});
