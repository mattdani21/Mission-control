import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { backoffFor, PgSendQueueRepository } from "./send-queue";

/**
 * Repository tests for the scheduled-send queue, run against pg-mem (an
 * in-memory Postgres-compatible SQL engine) so the real parameterized SQL —
 * including the claim statement's status transition — is exercised with no
 * external database, exactly like the auth and usage repositories.
 */
type MemDb = ReturnType<typeof newDb>;

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../db/migrations/0003_send_schedules.sql", import.meta.url), "utf8"),
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

beforeEach(async () => {
  // The pg-mem database is shared across tests in this file; clear the queue
  // so each test starts from an empty send_schedules table.
  await pool.query("TRUNCATE TABLE send_schedules");
});

afterAll(() => {
  vi.clearAllMocks();
});

const NOW = new Date("2026-08-07T12:00:00Z");

describe("PgSendQueueRepository", () => {
  it("creates a pending schedule with defaults", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "ops@empyrean.example",
      subject: "Launch week",
      bodyHtml: "<p>Hello!</p>",
      scheduledFor: NOW,
    });

    expect(schedule.id).toBeTruthy();
    expect(schedule.status).toBe("pending");
    expect(schedule.attempts).toBe(0);
    expect(schedule.maxAttempts).toBe(3);
    expect(schedule.workspaceId).toBeNull();

    const { rows } = await pool.query("SELECT * FROM send_schedules WHERE id = $1", [schedule.id]);
    expect(rows).toHaveLength(1);
    expect((rows[0] as { status: string }).status).toBe("pending");
  });

  it("claims due rows in schedule order and transitions them to sending", async () => {
    const repo = new PgSendQueueRepository();
    const earlier = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "a@example.com",
      subject: "First",
      bodyHtml: "<p>a</p>",
      scheduledFor: new Date("2026-08-07T11:00:00Z"),
    });
    const later = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "b@example.com",
      subject: "Second",
      bodyHtml: "<p>b</p>",
      scheduledFor: new Date("2026-08-07T11:30:00Z"),
    });

    const claimed = await repo.claimDue(10, NOW);
    expect(claimed.map((c) => c.id)).toEqual([earlier.id, later.id]);
    expect(claimed[0].recipientEmail).toBe("a@example.com");
    expect(claimed[1].attempts).toBe(1);

    const { rows } = await pool.query("SELECT status FROM send_schedules WHERE id = $1", [earlier.id]);
    expect((rows[0] as { status: string }).status).toBe("sending");
  });

  it("does not claim future rows", async () => {
    const repo = new PgSendQueueRepository();
    await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "future@example.com",
      subject: "Later",
      bodyHtml: "<p>later</p>",
      scheduledFor: new Date("2026-08-07T13:00:00Z"),
    });

    const claimed = await repo.claimDue(10, NOW);
    expect(claimed).toHaveLength(0);
  });

  it("respects the claim limit", async () => {
    const repo = new PgSendQueueRepository();
    for (let i = 0; i < 3; i += 1) {
      await repo.createSchedule({
        workspaceId: null,
        recipientEmail: `n${i}@example.com`,
        subject: `S${i}`,
        bodyHtml: "<p>x</p>",
        scheduledFor: new Date("2026-08-07T10:00:00Z"),
      });
    }

    const claimed = await repo.claimDue(2, NOW);
    expect(claimed).toHaveLength(2);
  });

  it("never claims the same row twice (concurrent-worker safety)", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "once@example.com",
      subject: "Once",
      bodyHtml: "<p>once</p>",
      scheduledFor: new Date("2026-08-07T10:00:00Z"),
    });

    const first = await repo.claimDue(10, NOW);
    const second = await repo.claimDue(10, NOW);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);

    const { rows } = await pool.query("SELECT attempts FROM send_schedules WHERE id = $1", [schedule.id]);
    expect((rows[0] as { attempts: number }).attempts).toBe(1);
  });

  it("does not re-claim a retried row before next_attempt_at", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "retry@example.com",
      subject: "Retry",
      bodyHtml: "<p>r</p>",
      scheduledFor: new Date("2026-08-07T10:00:00Z"),
    });

    await repo.claimDue(10, NOW);
    await repo.markFailed(schedule.id, "upstream 500", { retryable: true });
    const { rows } = await pool.query(
      "SELECT status, next_attempt_at AS \"nextAttemptAt\" FROM send_schedules WHERE id = $1",
      [schedule.id],
    );
    const row = rows[0] as { status: string; nextAttemptAt: Date };
    expect(row.status).toBe("pending");
    expect(row.nextAttemptAt.getTime()).toBeGreaterThan(NOW.getTime());

    const beforeBackoff = await repo.claimDue(10, new Date(NOW.getTime() + 10_000));
    expect(beforeBackoff).toHaveLength(0);

    const afterBackoff = await repo.claimDue(10, new Date(row.nextAttemptAt.getTime() + 1_000));
    expect(afterBackoff).toHaveLength(1);
  });

  it("marks a successful send with the Resend message id", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "ok@example.com",
      subject: "OK",
      bodyHtml: "<p>ok</p>",
      scheduledFor: new Date("2026-08-07T10:00:00Z"),
    });
    await repo.claimDue(10, NOW);

    const settled = await repo.markSent(schedule.id, "resend_123");
    expect(settled.status).toBe("sent");
    expect(settled.resendMessageId).toBe("resend_123");
    expect(settled.deliveryStatus).toBe("queued");
    expect(settled.sentAt).not.toBeNull();
  });

  it("fails permanently when attempts are exhausted", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "exhaust@example.com",
      subject: "Exhaust",
      bodyHtml: "<p>e</p>",
      scheduledFor: new Date("2026-08-07T10:00:00Z"),
      maxAttempts: 2,
    });

    await repo.claimDue(10, NOW);
    let settled = await repo.markFailed(schedule.id, "boom 1", { retryable: true });
    expect(settled.status).toBe("pending");

    await repo.claimDue(10, new Date(Date.now() + 3_600_000));
    settled = await repo.markFailed(schedule.id, "boom 2", { retryable: true });
    expect(settled.status).toBe("failed");
    expect(settled.lastError).toBe("boom 2");
  });

  it("fails immediately on non-retryable errors", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "bad@example.com",
      subject: "Bad",
      bodyHtml: "<p>b</p>",
      scheduledFor: new Date("2026-08-07T10:00:00Z"),
    });
    await repo.claimDue(10, NOW);

    const settled = await repo.markFailed(schedule.id, "invalid recipient", { retryable: false });
    expect(settled.status).toBe("failed");
    expect(settled.lastError).toBe("invalid recipient");
  });

  it("lists schedules for a workspace, newest first", async () => {
    const repo = new PgSendQueueRepository();
    const wsId = "ws-1";
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", [wsId, "Team A"]);
    await pool.query("INSERT INTO workspaces (id, name) VALUES ($1, $2)", ["ws-other", "Team B"]);
    const old = await repo.createSchedule({
      workspaceId: wsId,
      recipientEmail: "w1@example.com",
      subject: "Old",
      bodyHtml: "<p>1</p>",
      scheduledFor: new Date("2026-08-07T09:00:00Z"),
    });
    const newer = await repo.createSchedule({
      workspaceId: wsId,
      recipientEmail: "w2@example.com",
      subject: "New",
      bodyHtml: "<p>2</p>",
      scheduledFor: new Date("2026-08-07T11:00:00Z"),
    });
    await repo.createSchedule({
      workspaceId: "ws-other",
      recipientEmail: "other@example.com",
      subject: "Other",
      bodyHtml: "<p>3</p>",
      scheduledFor: new Date("2026-08-07T11:00:00Z"),
    });

    const list = await repo.listForWorkspace(wsId);
    expect(list.map((s) => s.id)).toEqual([newer.id, old.id]);
  });
});

describe("backoffFor", () => {
  it("grows exponentially and caps at one hour", () => {
    expect(backoffFor(1)).toBe(60_000);
    expect(backoffFor(2)).toBe(120_000);
    expect(backoffFor(3)).toBe(240_000);
    expect(backoffFor(10)).toBe(3_600_000);
  });
});
