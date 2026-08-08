import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { POST as forgotPasswordPOST } from "../../app/api/auth/forgot-password/route";
import { POST as resetPasswordPOST } from "../../app/api/auth/reset-password/route";
import { POST as signupPOST } from "../../app/api/auth/signup/route";
import { authenticateUser } from "./service";
import { hashResetToken } from "./tokens";

/**
 * HTTP-level integration tests for the auth API routes.
 *
 * The `pg` module is replaced with pg-mem — an in-memory Postgres-compatible
 * SQL engine — so the real repository SQL and the real route handlers run
 * against a real SQL engine with no external database required. This also runs
 * in CI (no DATABASE_URL needed).
 */
type MemDb = ReturnType<typeof newDb>;

vi.mock("pg", async () => {
  const sql = await readFile(new URL("../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8");
  const db = newDb();
  for (const statement of sql.split(";")) {
    const trimmed = statement.trim();
    if (trimmed) await db.public.none(trimmed);
  }
  (globalThis as unknown as { __pgMemDb: MemDb }).__pgMemDb = db;
  return db.adapters.createPg();
});

function memDb(): MemDb {
  return (globalThis as unknown as { __pgMemDb: MemDb }).__pgMemDb;
}

let pool: { query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }> };

beforeAll(async () => {
  // getPool() refuses to build a pool without DATABASE_URL; pg-mem's Pool
  // ignores the connection string, so a placeholder satisfies the guard.
  process.env.DATABASE_URL = "postgresql://mem:mem@localhost/mission_control";
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

afterAll(() => {
  vi.clearAllMocks();
});

async function postJson(handler: (request: Request) => Promise<Response>, body: unknown): Promise<Response> {
  return handler(
    new Request("http://localhost/api/auth/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function postRaw(handler: (request: Request) => Promise<Response>, raw: string): Promise<Response> {
  return handler(
    new Request("http://localhost/api/auth/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    }),
  );
}

const validSignup = { email: "Ada@Empyrean.com", password: "hunter2-s3cret", name: "Ada Lovelace" };

describe("POST /api/auth/signup (HTTP)", () => {
  it("creates an account and returns the normalized user", async () => {
    const response = await postJson(signupPOST, validSignup);
    expect(response.status).toBe(201);
    const body = (await response.json()) as { user: { email: string; name: string } };
    expect(body.user.email).toBe("ada@empyrean.com");
    expect(body.user.name).toBe("Ada Lovelace");
  });

  it("stores a bcrypt hash — never the plaintext password", async () => {
    const { rows } = await pool.query(
      "SELECT password_hash AS hash FROM users WHERE email = $1",
      ["ada@empyrean.com"],
    );
    const hash = (rows[0] as { hash: string }).hash;
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    expect(hash).not.toContain("hunter2");
  });

  it("rejects duplicate signups with 409", async () => {
    const response = await postJson(signupPOST, { email: "ADA@empyrean.com", password: "another-pass-1" });
    expect(response.status).toBe(409);
  });

  it("rejects invalid payloads with 400", async () => {
    expect((await postJson(signupPOST, { email: "nope", password: "hunter2-s3cret" })).status).toBe(400);
    expect((await postJson(signupPOST, { email: "a@b.com", password: "short" })).status).toBe(400);
    expect((await postRaw(signupPOST, "not json")).status).toBe(400);
  });
});

describe("POST /api/auth/forgot-password (HTTP)", () => {
  it("issues a reset link for a known account and persists only its hash", async () => {
    const response = await postJson(forgotPasswordPOST, { email: "ada@empyrean.com" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { message: string; devResetUrl?: string | null };
    expect(body.devResetUrl).toContain("/reset-password?token=");

    const rawToken = body.devResetUrl!.split("token=")[1];
    const { rows } = await pool.query(
      "SELECT token_hash AS hash FROM password_reset_tokens WHERE user_id = (SELECT id FROM users WHERE email = $1)",
      ["ada@empyrean.com"],
    );
    expect((rows[0] as { hash: string }).hash).toBe(hashResetToken(rawToken));
  });

  it("responds identically for unknown emails (no enumeration)", async () => {
    const response = await postJson(forgotPasswordPOST, { email: "nobody@empyrean.com" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { devResetUrl?: string | null };
    expect(body.devResetUrl ?? null).toBeNull();
  });

  it("rejects invalid emails with 400", async () => {
    expect((await postJson(forgotPasswordPOST, { email: "nope" })).status).toBe(400);
  });
});

describe("POST /api/auth/reset-password (HTTP)", () => {
  it("sets a new password, invalidates the token, and replays are rejected", async () => {
    const forgot = (await (await postJson(forgotPasswordPOST, { email: "ada@empyrean.com" })).json()) as {
      devResetUrl: string;
    };
    const rawToken = forgot.devResetUrl.split("token=")[1];

    const reset = await postJson(resetPasswordPOST, { token: rawToken, password: "brand-new-pass-2" });
    expect(reset.status).toBe(200);

    // Old password fails, new password works.
    const repo = new (await import("./repository")).PgAuthRepository();
    await expect(authenticateUser(repo, "ada@empyrean.com", "hunter2-s3cret")).resolves.toBeNull();
    await expect(authenticateUser(repo, "ada@empyrean.com", "brand-new-pass-2")).resolves.not.toBeNull();

    // Token is single-use.
    const replay = await postJson(resetPasswordPOST, { token: rawToken, password: "third-pass-3" });
    expect(replay.status).toBe(400);
  });

  it("rejects unknown and malformed tokens", async () => {
    expect((await postJson(resetPasswordPOST, { token: "garbage", password: "brand-new-pass-2" })).status).toBe(
      400,
    );
    expect((await postJson(resetPasswordPOST, { token: "", password: "brand-new-pass-2" })).status).toBe(400);
    expect((await postJson(resetPasswordPOST, { token: "tok", password: "short" })).status).toBe(400);
  });
});
