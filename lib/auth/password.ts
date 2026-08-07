import bcrypt from "bcryptjs";

// Cost factor for bcrypt. 12 is the current OWASP-recommended floor; bcryptjs
// is pure JS so this stays consistent across runtimes (no native build).
const BCRYPT_ROUNDS = 12;

/** Hash a plaintext password. Never log or store the plaintext. */
export function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/** Constant-time comparison of a plaintext password against a bcrypt hash. */
export function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
