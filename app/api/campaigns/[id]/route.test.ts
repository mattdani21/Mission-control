import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "./route";

type MemDb = ReturnType<typeof newDb>;

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("../../../../auth", () => ({ auth: mockAuth }));

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0004_campaigns.sql", import.meta.url), "utf8"),
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

async function createUserWithWorkspace(email: string): Promise<{ userId: string; workspaceId: string }> {
  const userId = randomUUID();
  await pool.query("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')", [userId, email]);
  const workspaceId = randomUUID();
  await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", [workspaceId, `${email} workspace`]);
  await pool.query("UPDATE users SET workspace_id = $1 WHERE id = $2", [workspaceId, userId]);
  return { userId, workspaceId };
}

async function patch(id: string, body: unknown): Promise<Response> {
  return PATCH(
    new Request(`http://localhost/api/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("PATCH /api/campaigns/:id", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await patch("camp-1", { status: "in_progress" })).status).toBe(401);
  });

  it("rejects invalid statuses with 400", async () => {
    const { userId } = await createUserWithWorkspace("bad-status@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    expect((await patch("camp-1", { status: "published" })).status).toBe(400);
  });

  it("updates a campaign in the caller's workspace", async () => {
    const { userId, workspaceId } = await createUserWithWorkspace("patch@empyrean.com");
    const campaignId = randomUUID();
    await pool.query(
      `INSERT INTO campaigns (id, workspace_id, title, brief, channel, status)
       VALUES ($1, $2, 'Hero', '', 'email', 'draft')`,
      [campaignId, workspaceId],
    );
    mockAuth.mockResolvedValue({ user: { id: userId } });

    const response = await patch(campaignId, { status: "scheduled" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string; status: string; workspaceId: string };
    expect(body.id).toBe(campaignId);
    expect(body.status).toBe("scheduled");
    expect(body.workspaceId).toBe(workspaceId);
  });

  it("does not update another workspace's campaign", async () => {
    const owner = await createUserWithWorkspace("owner@empyrean.com");
    const other = await createUserWithWorkspace("other@empyrean.com");
    const campaignId = randomUUID();
    await pool.query(
      `INSERT INTO campaigns (id, workspace_id, title, brief, channel, status)
       VALUES ($1, $2, 'Secret', '', 'email', 'draft')`,
      [campaignId, owner.workspaceId],
    );
    mockAuth.mockResolvedValue({ user: { id: other.userId } });

    const response = await patch(campaignId, { status: "sent" });
    expect(response.status).toBe(404);
  });
});
