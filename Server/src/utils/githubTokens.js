
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

function getEncryptionKey() {
  const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;

  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY must be a valid 64-character hexadecimal key."
    );
  }

  return Buffer.from(key, "hex");
}

export function encryptToken(token) {
  if (!token || typeof token !== "string") {
    throw new Error("A valid token is required for encryption.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptedToken: encrypted.toString("hex"),
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

export function decryptToken(encryptedToken, iv, authTag) {
  if (!encryptedToken || !iv || !authTag) {
    throw new Error("Encrypted token data is incomplete.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedToken, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
