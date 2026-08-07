import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

/**
 * HTTP-level integration tests for POST /api/sends/schedule. The `pg` module
 * is replaced with pg-mem and the Auth.js session is mocked, so the real
 * route handler and real repository SQL run end to end with no database.
 */
type MemDb = ReturnType<typeof newDb>;

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("../../../../auth", () => ({ auth: mockAuth }));

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0003_send_schedules.sql", import.meta.url), "utf8"),
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

afterAll(() => {
  vi.clearAllMocks();
});

async function seedUserAndWorkspace(): Promise<{ userId: string; workspaceId: string }> {
  const userId = randomUUID();
  const workspaceId = randomUUID();
  const email = `ops+${userId.slice(0, 8)}@empyrean.example`;
  await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", [workspaceId, "Empyrean"]);
  await pool.query(
    "INSERT INTO users (id, email, password_hash, workspace_id) VALUES ($1, $2, 'x', $3)",
    [userId, email, workspaceId],
  );
  return { userId, workspaceId };
}

const VALID_BODY = {
  to: "subscriber@example.com",
  subject: "Launch week is here",
  html: "<h1>Hello!</h1><p>Big news.</p>",
  scheduledFor: "2026-08-08T09:00:00.000Z",
};

describe("POST /api/sends/schedule", () => {
  it("rejects unauthenticated requests", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const response = await POST(new Request("http://localhost/api/sends/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    }));

    expect(response.status).toBe(401);
  });

  it("rejects accounts without a workspace", async () => {
    const { userId } = await seedUserAndWorkspace();
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    await pool.query("UPDATE users SET workspace_id = NULL WHERE id = $1", [userId]);

    const response = await POST(new Request("http://localhost/api/sends/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    }));

    expect(response.status).toBe(403);
  });

  it("rejects an invalid body", async () => {
    const { userId } = await seedUserAndWorkspace();
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const response = await POST(new Request("http://localhost/api/sends/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...VALID_BODY, to: "not-an-email" }),
    }));

    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toMatch(/email/i);
  });

  it("rejects a malformed scheduledFor timestamp", async () => {
    const { userId } = await seedUserAndWorkspace();
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const response = await POST(new Request("http://localhost/api/sends/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...VALID_BODY, scheduledFor: "next week-ish" }),
    }));

    expect(response.status).toBe(400);
  });

  it("enqueues a pending schedule row and returns it", async () => {
    const { userId, workspaceId } = await seedUserAndWorkspace();
    mockAuth.mockResolvedValueOnce({ user: { id: userId } });

    const response = await POST(new Request("http://localhost/api/sends/schedule", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(VALID_BODY),
    }));

    expect(response.status).toBe(201);
    const body = (await response.json()) as { id: string; status: string; scheduledFor: string };
    expect(body.status).toBe("pending");
    expect(body.scheduledFor).toBe("2026-08-08T09:00:00.000Z");

    const { rows } = await pool.query("SELECT * FROM send_schedules WHERE id = $1", [body.id]);
    expect(rows).toHaveLength(1);
    const row = rows[0] as {
      workspace_id: string;
      recipient_email: string;
      subject: string;
      status: string;
    };
    expect(row.workspace_id).toBe(workspaceId);
    expect(row.recipient_email).toBe("subscriber@example.com");
    expect(row.status).toBe("pending");
  });
});
