import { randomUUID } from "crypto";

import { getPool } from "../db";

/**
 * Persistence boundary for auth. The service layer depends on this interface
 * (not on the database driver directly), so the full auth flow — signup,
 * sign-in, password reset — is unit-testable with an in-memory implementation.
 * The shipped implementation is parameterized SQL over Postgres (`pg`);
 * swapping in Prisma later is a one-file change.
 */

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
}

export interface ResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  createUser(input: { email: string; name: string | null; passwordHash: string }): Promise<UserRecord>;
  createResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findResetTokenByHash(tokenHash: string): Promise<ResetTokenRecord | null>;
  markResetTokenUsed(id: string): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
}

interface ResetTokenRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

const USER_COLUMNS = `id, email, name, password_hash AS "passwordHash"`;
const TOKEN_COLUMNS = `id, user_id AS "userId", token_hash AS "tokenHash", expires_at AS "expiresAt", used_at AS "usedAt"`;

/** Postgres-backed implementation used by the app. */
export class PgAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const { rows } = await getPool().query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [email]);
    return rows[0] ?? null;
  }

  async createUser(input: { email: string; name: string | null; passwordHash: string }): Promise<UserRecord> {
    const id = randomUUID();
    await getPool().query(
      `INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)`,
      [id, input.email, input.name, input.passwordHash],
    );
    return { id, email: input.email, name: input.name, passwordHash: input.passwordHash };
  }

  async createResetToken(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    const id = randomUUID();
    await getPool().query(
      `INSERT INTO password_reset_tokens (id, token_hash, user_id, expires_at) VALUES ($1, $2, $3, $4)`,
      [id, input.tokenHash, input.userId, input.expiresAt],
    );
  }

  async findResetTokenByHash(tokenHash: string): Promise<ResetTokenRecord | null> {
    const { rows } = await getPool().query<ResetTokenRow>(
      `SELECT ${TOKEN_COLUMNS} FROM password_reset_tokens WHERE token_hash = $1`,
      [tokenHash],
    );
    return rows[0] ?? null;
  }

  async markResetTokenUsed(id: string): Promise<void> {
    await getPool().query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [id]);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await getPool().query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`, [
      passwordHash,
      userId,
    ]);
  }
}
