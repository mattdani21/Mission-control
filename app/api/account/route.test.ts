import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "./route";

type MemDb = ReturnType<typeof newDb>;

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("../../../auth", () => ({ auth: mockAuth }));

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../db/migrations/0003_send_schedules.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../db/migrations/0004_campaigns.sql", import.meta.url), "utf8"),
  ];
  const db = newDb();
  for (const sql of migrations) {
    for (const statement of sql.split(";")) {
      const trimmed = statement.trim();
      if (trimmed) await db.public.none(trimmed);
    }
  }
  (globalThis as unknown as { __pgMemDb: MemDb }).__pgMemDb = db;
  return db.adapters.createPg();
});

function memDb(): MemDb {
  return (globalThis as unknown as { __pgMemDb: MemDb }).__pgMemDb;
}

let pool: { query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }> };

beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://mem:***@localhost/mission_control";
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

beforeEach(() => {
  mockAuth.mockReset();
});

afterAll(() => {
  vi.clearAllMocks();
});

async function seedAccount(email: string): Promise<{ userId: string; workspaceId: string; campaignId: string }> {
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const campaignId = randomUUID();
  await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", [workspaceId, `${email} workspace`]);
  await pool.query("INSERT INTO users (id, email, password_hash, workspace_id) VALUES ($1, $2, 'x', $3)", [
    userId,
    email,
    workspaceId,
  ]);
  await pool.query(
    `INSERT INTO campaigns (id, workspace_id, title, brief, channel, status)
     VALUES ($1, $2, 'To delete', '', 'email', 'draft')`,
    [campaignId, workspaceId],
  );
  await pool.query(
    `INSERT INTO ai_usage (id, workspace_id, provider, model, input_tokens, output_tokens)
     VALUES ($1, $2, 'deepseek', 'deepseek-v4-flash', 10, 4)`,
    [randomUUID(), workspaceId],
  );
  await pool.query(
    `INSERT INTO send_schedules (id, workspace_id, recipient_email, subject, body_html, scheduled_for)
     VALUES ($1, $2, $3, 'Bye', '<p>bye</p>', now())`,
    [randomUUID(), workspaceId, email],
  );
  return { userId, workspaceId, campaignId };
}

describe("DELETE /api/account", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await DELETE()).status).toBe(401);
  });

  it("deletes the user, workspace, campaigns, usage and scheduled sends", async () => {
    const { userId, workspaceId } = await seedAccount("gone@empyrean.com");
    const other = await seedAccount("keep@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });

    const response = await DELETE();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ deleted: true });

    const users = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    expect(users.rows).toHaveLength(0);
    const workspaces = await pool.query("SELECT id FROM workspaces WHERE id = $1", [workspaceId]);
    expect(workspaces.rows).toHaveLength(0);
    const leftover = await pool.query("SELECT id FROM users WHERE id = $1", [other.userId]);
    expect(leftover.rows).toHaveLength(1);
  });
});
