import { createHash, randomBytes } from "crypto";

/**
 * Password reset tokens.
 *
 * Only the SHA-256 hash of a token is ever persisted; the raw token is shown
 * to the user (via the reset link) exactly once. A database leak therefore
 * does not expose usable reset links, and lookups happen by hash — no
 * timing-attackable comparison of raw tokens.
 */

export function generateResetToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("base64url");
  return { rawToken, tokenHash: hashResetToken(rawToken) };
}

export function hashResetToken(rawToken: string): string {
  return sha256Hex(rawToken);
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
