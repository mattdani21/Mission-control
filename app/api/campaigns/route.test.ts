import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

type MemDb = ReturnType<typeof newDb>;

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("../../../auth", () => ({ auth: mockAuth }));

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
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

async function postJson(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function createUserWithWorkspace(email: string): Promise<{ userId: string; workspaceId: string }> {
  const userId = randomUUID();
  await pool.query("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')", [userId, email]);
  const workspaceId = randomUUID();
  await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", [workspaceId, `${email} workspace`]);
  await pool.query("UPDATE users SET workspace_id = $1 WHERE id = $2", [workspaceId, userId]);
  return { userId, workspaceId };
}

describe("POST /api/campaigns", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await postJson({ title: "Matric hero carousel" });
    expect(response.status).toBe(401);
  });

  it("rejects invalid bodies with 400", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    expect((await postJson({})).status).toBe(400);
    expect((await postJson({ title: "" })).status).toBe(400);
    expect((await postJson({ title: "x".repeat(201) })).status).toBe(400);
    expect((await postJson({ title: "ok", channel: "carrier-pigeon" })).status).toBe(400);
  });

  it("creates a draft campaign in the caller's workspace", async () => {
    const { userId, workspaceId } = await createUserWithWorkspace("camp@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });

    const response = await postJson({ title: "Durban July teaser", brief: "Pinterest-first", channel: "pinterest" });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { id: string; workspaceId: string; title: string; brief: string; channel: string; status: string };
    expect(body.workspaceId).toBe(workspaceId);
    expect(body.title).toBe("Durban July teaser");
    expect(body.brief).toBe("Pinterest-first");
    expect(body.channel).toBe("pinterest");
    expect(body.status).toBe("draft");
  });

  it("defaults channel to multi and brief to empty", async () => {
    const { userId } = await createUserWithWorkspace("min@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    const response = await postJson({ title: "Minimal campaign" });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { brief: string; channel: string };
    expect(body.brief).toBe("");
    expect(body.channel).toBe("multi");
  });
});

describe("GET /api/campaigns", () => {
  it("lists only the caller's workspace campaigns, newest first", async () => {
    const a = await createUserWithWorkspace("list-a@empyrean.com");
    const b = await createUserWithWorkspace("list-b@empyrean.com");

    mockAuth.mockResolvedValue({ user: { id: a.userId } });
    await postJson({ title: "First" });
    await postJson({ title: "Second" });
    mockAuth.mockResolvedValue({ user: { id: b.userId } });
    await postJson({ title: "Other workspace" });

    mockAuth.mockResolvedValue({ user: { id: a.userId } });
    const response = await GET();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { campaigns: Array<{ title: string }> };
    expect(body.campaigns.map((c) => c.title)).toEqual(["Second", "First"]);
  });

  it("rejects unauthenticated requests with 401", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
});
