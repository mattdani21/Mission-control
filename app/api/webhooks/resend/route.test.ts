import { createHmac } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "./route";

type MemDb = ReturnType<typeof newDb>;

const SECRET_BYTES = Buffer.from("super-secret-webhook-key");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0003_send_schedules.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0005_resend_message_id_idx.sql", import.meta.url), "utf8"),
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
  process.env.RESEND_WEBHOOK_SECRET = SECRET;
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

beforeEach(async () => {
  await pool.query("TRUNCATE TABLE send_schedules");
});

afterAll(() => {
  vi.restoreAllMocks();
  delete process.env.RESEND_WEBHOOK_SECRET;
});

function sign(rawBody: string, id = "msg_1", timestamp = String(Math.floor(Date.now() / 1000))): string {
  const digest = createHmac("sha256", SECRET_BYTES).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  return `v1,${digest}`;
}

async function post(rawBody: string, headers: Record<string, string> = {}): Promise<Response> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return POST(
    new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "svix-id": "msg_1",
        "svix-timestamp": timestamp,
        "svix-signature": sign(rawBody, "msg_1", timestamp),
        ...headers,
      },
      body: rawBody,
    }),
  );
}

describe("POST /api/webhooks/resend", () => {
  it("rejects a missing or invalid signature with 401", async () => {
    const raw = JSON.stringify({ type: "email.delivered", data: { email_id: "re_1" } });
    const unsigned = await POST(
      new Request("http://localhost/api/webhooks/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: raw,
      }),
    );
    expect(unsigned.status).toBe(401);

    const bad = await post(raw, { "svix-signature": "v1,nope" });
    expect(bad.status).toBe(401);
  });

  it("updates delivery_status for a known Resend message id", async () => {
    await pool.query(
      `INSERT INTO send_schedules
         (id, recipient_email, subject, body_html, scheduled_for, status, resend_message_id, delivery_status)
       VALUES ('sch-1', 'ops@example.com', 'Hi', '<p>hi</p>', now(), 'sent', 're_abc', 'queued')`,
    );

    const raw = JSON.stringify({ type: "email.bounced", data: { email_id: "re_abc" } });
    const response = await post(raw);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string; deliveryStatus: string };
    expect(body).toEqual({ id: "sch-1", deliveryStatus: "bounced" });

    const { rows } = await pool.query(
      "SELECT delivery_status AS status FROM send_schedules WHERE id = 'sch-1'",
    );
    expect((rows[0] as { status: string }).status).toBe("bounced");
  });

  it("acknowledges unknown event types and unknown message ids", async () => {
    const opened = await post(JSON.stringify({ type: "email.opened", data: { email_id: "re_x" } }));
    expect(opened.status).toBe(200);
    expect(await opened.json()).toMatchObject({ ignored: true, type: "email.opened" });

    const unknown = await post(JSON.stringify({ type: "email.delivered", data: { email_id: "re_missing" } }));
    expect(unknown.status).toBe(200);
    expect(await unknown.json()).toMatchObject({ ignored: true, reason: "unknown_message" });
  });

  it("returns 503 when the webhook secret is unset", async () => {
    const previous = process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.RESEND_WEBHOOK_SECRET;
    const response = await post(JSON.stringify({ type: "email.delivered", data: { email_id: "re_1" } }));
    expect(response.status).toBe(503);
    process.env.RESEND_WEBHOOK_SECRET = previous;
  });
});
