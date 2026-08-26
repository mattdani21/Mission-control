import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { PgCampaignRepository } from "./campaigns";

type MemDb = ReturnType<typeof newDb>;

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
    await readFile(new URL("../db/migrations/0004_campaigns.sql", import.meta.url), "utf8"),
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

describe("PgCampaignRepository", () => {
  it("creates and lists campaigns for a workspace, newest first", async () => {
    const repo = new PgCampaignRepository();
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", ["ws-campaign-test", "test ws"]);
    const workspaceId = "ws-campaign-test";

    const first = await repo.create({ workspaceId, title: "First campaign", brief: "Brief A", channel: "email" });
    const second = await repo.create({ workspaceId, title: "Second campaign", channel: "ig" });

    expect(first.status).toBe("draft");
    expect(second.channel).toBe("ig");

    const campaigns = await repo.listForWorkspace(workspaceId);
    expect(campaigns.map((c) => c.title)).toEqual(["Second campaign", "First campaign"]);
    expect(campaigns[1]!.brief).toBe("Brief A");
  });

  it("scopes lists to the workspace", async () => {
    const repo = new PgCampaignRepository();
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2), ($3, $4)", ["ws-a", "a", "ws-b", "b"]);
    await repo.create({ workspaceId: "ws-a", title: "A's campaign" });
    await repo.create({ workspaceId: "ws-b", title: "B's campaign" });

    const a = await repo.listForWorkspace("ws-a");
    expect(a.map((c) => c.title)).toEqual(["A's campaign"]);
  });

  it("updates status and returns the refreshed row", async () => {
    const repo = new PgCampaignRepository();
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2), ($3, $4)", ["ws-update", "u", "ws-other", "o"]);
    const campaign = await repo.create({ workspaceId: "ws-update", title: "Move me" });

    const updated = await repo.updateStatus("ws-update", campaign.id, "scheduled");
    expect(updated?.status).toBe("scheduled");

    const missing = await repo.updateStatus("ws-update", "no-such-id", "sent");
    expect(missing).toBeNull();

    // Cross-workspace updates are refused (returns null).
    const cross = await repo.updateStatus("ws-other", campaign.id, "sent");
    expect(cross).toBeNull();
  });

  it("get returns the campaign only for the owning workspace", async () => {
    const repo = new PgCampaignRepository();
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2), ($3, $4)", ["ws-get", "g", "ws-get-other", "o"]);
    const campaign = await repo.create({ workspaceId: "ws-get", title: "Fetch me" });
    expect((await repo.get("ws-get", campaign.id))?.title).toBe("Fetch me");
    expect(await repo.get("ws-get-other", campaign.id)).toBeNull();
  });
});
