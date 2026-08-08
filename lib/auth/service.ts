import type { AuthRepository, UserRecord } from "./repository";
import { hashPassword, verifyPassword } from "./password";
import { generateResetToken, hashResetToken } from "./tokens";

/**
 * Auth orchestration, independent of Next.js and Prisma so the whole flow is
 * unit-testable. Callers (route handlers, the Auth.js Credentials provider)
 * pass in a repository and validated input.
 */

export class AuthError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
}

/** Create an account. Throws AuthError(EMAIL_TAKEN, 409) on duplicates. */
export async function signupUser(repo: AuthRepository, input: SignupInput): Promise<UserRecord> {
  const email = normalizeEmail(input.email);
  const existing = await repo.findByEmail(email);
  if (existing) {
    throw new AuthError("EMAIL_TAKEN", "An account with this email already exists.", 409);
  }
  const passwordHash = await hashPassword(input.password);
  const name = input.name && input.name.trim().length > 0 ? input.name.trim() : null;
  return repo.createUser({ email, name, passwordHash });
}

/**
 * Credentials check used by the Auth.js Credentials provider. Returns the user
 * on success and null on any failure (unknown email, wrong password) — never
 * leaks which one.
 */
export async function authenticateUser(
  repo: AuthRepository,
  email: string,
  password: string,
): Promise<UserRecord | null> {
  const user = await repo.findByEmail(normalizeEmail(email));
  if (!user) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PasswordResetRequest {
  user: UserRecord;
  resetUrl: string;
}

/**
 * Issue a one-time password reset token for an account. Account-enumeration
 * safe: unknown emails resolve to `null` (caller responds identically either
 * way). The raw token is returned to the caller only so it can be delivered
 * via the reset link; only its hash is persisted.
 */
export async function requestPasswordReset(
  repo: AuthRepository,
  email: string,
  buildResetUrl: (rawToken: string) => string,
): Promise<PasswordResetRequest | null> {
  const user = await repo.findByEmail(normalizeEmail(email));
  if (!user) return null;

  const { rawToken, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await repo.createResetToken({ userId: user.id, tokenHash, expiresAt });

  return { user, resetUrl: buildResetUrl(rawToken) };
}

/**
 * Redeem a reset token: validates it (exists, unused, unexpired), sets the new
 * password and marks the token used so it cannot be replayed.
 */
export async function resetPasswordWithToken(
  repo: AuthRepository,
  rawToken: string,
  newPassword: string,
): Promise<void> {
  const record = await repo.findResetTokenByHash(hashResetToken(rawToken));
  const now = Date.now();
  if (!record || record.usedAt !== null || record.expiresAt.getTime() < now) {
    throw new AuthError("INVALID_TOKEN", "This reset link is invalid or has expired.", 400);
  }
  const passwordHash = await hashPassword(newPassword);
  await repo.updatePassword(record.userId, passwordHash);
  await repo.markResetTokenUsed(record.id);
}
