import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { PgUsageRepository, createWorkspaceForUser } from "./usage";

/**
 * Repository tests for per-workspace AI token usage, run against pg-mem (an
 * in-memory Postgres-compatible SQL engine) so the real parameterized SQL is
 * exercised with no external database — this also runs in CI.
 */
type MemDb = ReturnType<typeof newDb>;

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
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
  // getPool() refuses to build a pool without DATABASE_URL; pg-mem's Pool
  // ignores the connection string, so a placeholder satisfies the guard.
  process.env.DATABASE_URL = "postgresql://mem:***@localhost/mission_control";
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

afterAll(() => {
  vi.clearAllMocks();
});

async function createUser(email: string, name: string | null): Promise<string> {
  const id = randomUUID();
  await pool.query("INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, 'x', $3)", [
    id,
    email,
    name,
  ]);
  return id;
}

describe("PgUsageRepository", () => {
  it("records a usage row with defaults for optional fields", async () => {
    const repo = new PgUsageRepository();
    const workspace = await repo.createWorkspace("Empyrean");

    const record = await repo.record({
      workspaceId: workspace.id,
      provider: "anthropic",
      model: "claude-test",
      inputTokens: 120,
      outputTokens: 45,
    });

    expect(record.id).toBeTruthy();
    expect(record.workspaceId).toBe(workspace.id);
    expect(record.cacheReadTokens).toBe(0);
    expect(record.latencyMs).toBeNull();
    expect(record.requestId).toBeNull();

    const { rows } = await pool.query("SELECT * FROM ai_usage WHERE id = $1", [record.id]);
    const row = rows[0] as {
      workspace_id: string;
      provider: string;
      model: string;
      input_tokens: number;
      output_tokens: number;
      cache_read_tokens: number;
    };
    expect(row.workspace_id).toBe(workspace.id);
    expect(row.provider).toBe("anthropic");
    expect(row.model).toBe("claude-test");
    expect(row.input_tokens).toBe(120);
    expect(row.output_tokens).toBe(45);
    expect(row.cache_read_tokens).toBe(0);
  });

  it("aggregates usage per workspace without crossing boundaries", async () => {
    const repo = new PgUsageRepository();
    const wsA = await repo.createWorkspace("Team A");
    const wsB = await repo.createWorkspace("Team B");

    await repo.record({
      workspaceId: wsA.id,
      provider: "anthropic",
      model: "m",
      inputTokens: 100,
      outputTokens: 10,
      cacheReadTokens: 50,
      latencyMs: 300,
      requestId: "req-1",
    });
    await repo.record({ workspaceId: wsA.id, provider: "anthropic", model: "m", inputTokens: 200, outputTokens: 20 });
    await repo.record({ workspaceId: wsB.id, provider: "anthropic", model: "m", inputTokens: 999, outputTokens: 999 });

    const a = await repo.getWorkspaceUsage(wsA.id);
    expect(a.totalRequests).toBe(2);
    expect(a.totalInputTokens).toBe(300);
    expect(a.totalOutputTokens).toBe(30);
    expect(a.totalCacheReadTokens).toBe(50);
    expect(a.lastRequestAt).not.toBeNull();

    const b = await repo.getWorkspaceUsage(wsB.id);
    expect(b.totalRequests).toBe(1);
    expect(b.totalInputTokens).toBe(999);
    expect(b.totalOutputTokens).toBe(999);

    // Unknown workspace → empty summary, not an error.
    const none = await repo.getWorkspaceUsage("does-not-exist");
    expect(none.totalRequests).toBe(0);
    expect(none.totalInputTokens).toBe(0);
  });

  it("respects the `since` window when aggregating", async () => {
    const repo = new PgUsageRepository();
    const ws = await repo.createWorkspace("Window Test");
    await repo.record({ workspaceId: ws.id, provider: "anthropic", model: "m", inputTokens: 10, outputTokens: 1 });

    const { rows } = await pool.query("SELECT id, created_at FROM ai_usage WHERE workspace_id = $1", [ws.id]);
    const row = rows[0] as { id: string; created_at: Date };
    const oldTime = new Date(new Date(row.created_at).getTime() - 60_000);
    await pool.query("UPDATE ai_usage SET created_at = $1 WHERE id = $2", [oldTime, row.id]);

    const since = new Date(oldTime.getTime() + 30_000);
    const summary = await repo.getWorkspaceUsage(ws.id, since);
    expect(summary.totalRequests).toBe(0);
  });

  it("lists recent usage newest-first with a limit", async () => {
    const repo = new PgUsageRepository();
    const ws = await repo.createWorkspace("Recent Test");

    for (let i = 1; i <= 3; i++) {
      await repo.record({ workspaceId: ws.id, provider: "anthropic", model: "m", inputTokens: i, outputTokens: i });
    }
    const { rows } = await pool.query("SELECT id, created_at FROM ai_usage WHERE workspace_id = $1", [ws.id]);
    const ordered = (rows as { id: string; created_at: Date }[]).sort(
      (x, y) => new Date(x.created_at).getTime() - new Date(y.created_at).getTime(),
    );
    const base = new Date(ordered[0]!.created_at).getTime();
    await pool.query("UPDATE ai_usage SET created_at = $1 WHERE id = $2", [new Date(base + 60_000), ordered[0]!.id]);
    await pool.query("UPDATE ai_usage SET created_at = $1 WHERE id = $2", [new Date(base + 120_000), ordered[1]!.id]);
    await pool.query("UPDATE ai_usage SET created_at = $1 WHERE id = $2", [new Date(base + 180_000), ordered[2]!.id]);

    const recent = await repo.listRecent(ws.id, 2);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.createdAt.getTime()).toBeGreaterThan(recent[1]!.createdAt.getTime());
  });

  it("creates a workspace and attaches a user to it", async () => {
    const userId = await createUser("ada@empyrean.com", "Ada Lovelace");
    const repo = new PgUsageRepository();

    const workspaceId = await createWorkspaceForUser(userId, "Ada Lovelace's workspace");

    expect(await repo.getWorkspaceIdForUser(userId)).toBe(workspaceId);

    const { rows } = await pool.query("SELECT name FROM workspaces WHERE id = $1", [workspaceId]);
    expect((rows[0] as { name: string }).name).toBe("Ada Lovelace's workspace");

    // A user with no workspace resolves to null.
    const stranger = await createUser("grace@empyrean.com", null);
    expect(await repo.getWorkspaceIdForUser(stranger)).toBeNull();
  });
});
