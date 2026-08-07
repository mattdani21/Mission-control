import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PgSendQueueRepository } from "./send-queue";
import { runTick } from "./runner";
import { ResendClient } from "../resend";

/**
 * End-to-end pipeline test for the scheduled-send runner: real repository SQL
 * over pg-mem + the real tick logic + the real Resend client in dev mode.
 * This is the M3 "definition of done" in one test: a scheduled email that is
 * due gets claimed, "sent" through Resend (synthetic id in dev mode), and the
 * delivery outcome is recorded on the queue row.
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
  process.env.RESEND_DEV_MODE = "1";
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE send_schedules");
});

afterAll(() => {
  vi.clearAllMocks();
});

describe("scheduled-send pipeline (schedule → claim → send → settle)", () => {
  it("sends a due scheduled email and records the delivery outcome", async () => {
    const repo = new PgSendQueueRepository();
    const dueAt = new Date("2026-08-07T10:00:00Z");
    const now = new Date("2026-08-07T11:00:00Z");

    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "subscriber@example.com",
      subject: "Launch week is here",
      bodyHtml: "<h1>Hello!</h1>",
      scheduledFor: dueAt,
    });

    const result = await runTick(repo, new ResendClient(undefined, true), { now });

    expect(result).toEqual({ claimed: 1, sent: 1, retrying: 0, failed: 0 });

    const { rows } = await pool.query("SELECT * FROM send_schedules WHERE id = $1", [schedule.id]);
    const row = rows[0] as {
      status: string;
      attempts: number;
      resend_message_id: string;
      delivery_status: string;
      sent_at: Date | null;
    };
    expect(row.status).toBe("sent");
    expect(row.attempts).toBe(1);
    expect(row.resend_message_id).toMatch(/^dev_/);
    expect(row.delivery_status).toBe("queued");
    expect(row.sent_at).not.toBeNull();
  });

  it("leaves future sends pending — nothing sends early", async () => {
    const repo = new PgSendQueueRepository();
    await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "future@example.com",
      subject: "Not yet",
      bodyHtml: "<p>later</p>",
      scheduledFor: new Date("2026-08-07T12:00:00Z"),
    });

    const result = await runTick(repo, new ResendClient(undefined, true), {
      now: new Date("2026-08-07T11:00:00Z"),
    });

    expect(result.claimed).toBe(0);

    const { rows } = await pool.query("SELECT status FROM send_schedules");
    expect((rows[0] as { status: string }).status).toBe("pending");
  });

  it("retries transient failures and records the error", async () => {
    const repo = new PgSendQueueRepository();
    const schedule = await repo.createSchedule({
      workspaceId: null,
      recipientEmail: "flaky@example.com",
      subject: "Retry me",
      bodyHtml: "<p>r</p>",
      scheduledFor: new Date("2026-08-07T10:00:00Z"),
    });

    const failingSender = {
      send: vi.fn().mockRejectedValue(new Error("ECONNRESET")),
    };
    const result = await runTick(repo, failingSender, { now: new Date("2026-08-07T11:00:00Z") });

    expect(result).toEqual({ claimed: 1, sent: 0, retrying: 1, failed: 0 });

    const { rows } = await pool.query("SELECT status, last_error FROM send_schedules WHERE id = $1", [
      schedule.id,
    ]);
    const row = rows[0] as { status: string; last_error: string };
    expect(row.status).toBe("pending"); // back in the queue with backoff
    expect(row.last_error).toBe("ECONNRESET");
  });
});
