import { randomUUID } from "crypto";

import { getPool } from "../db";

/**
 * Postgres-backed queue for scheduled sends (`send_schedules` table) — the
 * "queue" half of the cron+queue runner (the roadmap's "inngest or cron+queue"
 * architecture choice; this repo uses the zero-dependency cron+queue option).
 * The worker claims rows whose scheduled_for has arrived, sends them through
 * an EmailSender, and settles them (sent / failed-with-retry / failed-permanent).
 *
 * Claiming is a SELECT of due ids followed by an UPDATE that re-checks
 * status = 'pending': under READ COMMITTED the second of two concurrent
 * workers re-evaluates after the first commits and skips already-claimed rows,
 * so double-sends cannot happen even with several workers polling the table.
 */

export type SendStatus = "pending" | "sending" | "sent" | "failed" | "cancelled";

export interface SendSchedule {
  id: string;
  workspaceId: string | null;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  fromEmail: string | null;
  scheduledFor: Date;
  status: SendStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date | null;
  lastError: string | null;
  resendMessageId: string | null;
  deliveryStatus: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface CreateScheduleInput {
  workspaceId: string | null;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  fromEmail?: string | null;
  scheduledFor: Date;
  maxAttempts?: number;
}

export interface ClaimedSend {
  id: string;
  workspaceId: string | null;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  fromEmail: string | null;
  scheduledFor: Date;
  attempts: number;
}

export interface SettleInput {
  retryable: boolean;
  backoffMs?: number;
}

interface ScheduleRow {
  id: string;
  workspaceId: string | null;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  fromEmail: string | null;
  scheduledFor: Date;
  status: SendStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date | null;
  lastError: string | null;
  resendMessageId: string | null;
  deliveryStatus: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

interface ClaimedRow {
  id: string;
  workspaceId: string | null;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  fromEmail: string | null;
  scheduledFor: Date;
  attempts: number;
}

const SCHEDULE_COLUMNS = `id, workspace_id AS "workspaceId",
  recipient_email AS "recipientEmail", subject, body_html AS "bodyHtml",
  from_email AS "fromEmail", scheduled_for AS "scheduledFor", status,
  attempts, max_attempts AS "maxAttempts", next_attempt_at AS "nextAttemptAt",
  last_error AS "lastError", resend_message_id AS "resendMessageId",
  delivery_status AS "deliveryStatus", sent_at AS "sentAt",
  created_at AS "createdAt"`;

export interface SendQueueRepository {
  createSchedule(input: CreateScheduleInput): Promise<SendSchedule>;
  claimDue(limit: number, now?: Date): Promise<ClaimedSend[]>;
  markSent(id: string, resendMessageId: string): Promise<SendSchedule>;
  markFailed(id: string, error: string, settle?: SettleInput): Promise<SendSchedule>;
  get(id: string): Promise<SendSchedule | null>;
  listForWorkspace(workspaceId: string, limit?: number): Promise<SendSchedule[]>;
}

/** Postgres-backed implementation used by the app and the worker. */
export class PgSendQueueRepository implements SendQueueRepository {
  async createSchedule(input: CreateScheduleInput): Promise<SendSchedule> {
    const id = randomUUID();
    const row: ScheduleRow = {
      id,
      workspaceId: input.workspaceId ?? null,
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      fromEmail: input.fromEmail ?? null,
      scheduledFor: input.scheduledFor,
      status: "pending",
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      nextAttemptAt: null,
      lastError: null,
      resendMessageId: null,
      deliveryStatus: null,
      sentAt: null,
      createdAt: new Date(),
    };
    await getPool().query(
      `INSERT INTO send_schedules (id, workspace_id, recipient_email, subject,
         body_html, from_email, scheduled_for, status, attempts, max_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 0, $8)`,
      [
        row.id,
        row.workspaceId,
        row.recipientEmail,
        row.subject,
        row.bodyHtml,
        row.fromEmail,
        row.scheduledFor,
        row.maxAttempts,
      ],
    );
    return row;
  }

  /**
   * Atomically claim up to `limit` due rows: pending, scheduled_for <= now,
   * and (if a retry is scheduled) next_attempt_at <= now. Claimed rows move to
   * 'sending' and their attempt counter increments. The UPDATE re-checks
   * status = 'pending', so under READ COMMITTED a second concurrent worker
   * re-evaluates after the first commits and skips already-claimed rows —
   * double-sends cannot happen even with several workers polling the table.
   */
  async claimDue(limit: number, now: Date = new Date()): Promise<ClaimedSend[]> {
    const { rows: candidates } = await getPool().query<{ id: string }>(
      `SELECT id FROM send_schedules
       WHERE status = 'pending'
         AND scheduled_for <= $1
         AND (next_attempt_at IS NULL OR next_attempt_at <= $1)
       ORDER BY scheduled_for ASC
       LIMIT $2`,
      [now, limit],
    );
    if (candidates.length === 0) return [];

    // Dynamic IN list: ids are server-generated UUIDs, so interpolating the
    // placeholders is safe — and pg-mem (used in tests) matches `IN ($2, $3, …)`
    // reliably, unlike `= ANY($1)` with an array parameter.
    const placeholders = candidates.map((_, i) => `$${i + 2}`).join(", ");
    const { rows } = await getPool().query<ClaimedRow>(
      `UPDATE send_schedules
       SET status = 'sending', attempts = attempts + 1, updated_at = now()
       WHERE id IN (${placeholders}) AND status = 'pending'
       RETURNING id, workspace_id AS "workspaceId",
         recipient_email AS "recipientEmail", subject, body_html AS "bodyHtml",
         from_email AS "fromEmail", scheduled_for AS "scheduledFor", attempts`,
      [now, ...candidates.map((c) => c.id)],
    );
    return rows;
  }

  async markSent(id: string, resendMessageId: string): Promise<SendSchedule> {
    const { rows } = await getPool().query<ScheduleRow>(
      `UPDATE send_schedules
       SET status = 'sent', sent_at = now(), delivery_status = 'queued',
           resend_message_id = $2, last_error = NULL, next_attempt_at = NULL,
           updated_at = now()
       WHERE id = $1
       RETURNING ${SCHEDULE_COLUMNS}`,
      [id, resendMessageId],
    );
    const row = rows[0];
    if (!row) throw new Error(`send_schedules row ${id} not found`);
    return row;
  }

  /**
   * Settle a failed send. Retryable failures (transient network/5xx) go back
   * to 'pending' with an exponential backoff; permanent failures (4xx
   * validation) or exhausted attempts become 'failed' with the error stored.
   */
  async markFailed(id: string, error: string, settle: SettleInput = { retryable: true }): Promise<SendSchedule> {
    const { rows } = await getPool().query<{ status: string; attempts: number; maxAttempts: number }>(
      `SELECT status, attempts, max_attempts AS "maxAttempts" FROM send_schedules WHERE id = $1`,
      [id],
    );
    const current = rows[0];
    if (!current) throw new Error(`send_schedules row ${id} not found`);

    const canRetry = settle.retryable && current.attempts < current.maxAttempts;
    const backoffMs = settle.retryable ? (settle.backoffMs ?? backoffFor(current.attempts)) : 0;
    const nextAttemptAt = canRetry ? new Date(Date.now() + backoffMs) : null;

    const { rows: updated } = await getPool().query<ScheduleRow>(
      `UPDATE send_schedules
       SET status = $2, last_error = $3, next_attempt_at = $4, updated_at = now()
       WHERE id = $1
       RETURNING ${SCHEDULE_COLUMNS}`,
      [id, canRetry ? "pending" : "failed", error, nextAttemptAt],
    );
    return updated[0];
  }

  async get(id: string): Promise<SendSchedule | null> {
    const { rows } = await getPool().query<ScheduleRow>(
      `SELECT ${SCHEDULE_COLUMNS} FROM send_schedules WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async listForWorkspace(workspaceId: string, limit = 20): Promise<SendSchedule[]> {
    const { rows } = await getPool().query<ScheduleRow>(
      `SELECT ${SCHEDULE_COLUMNS} FROM send_schedules
       WHERE workspace_id = $1
       ORDER BY scheduled_for DESC
       LIMIT $2`,
      [workspaceId, limit],
    );
    return rows;
  }
}

/** Exponential backoff for retry n (attempts already incremented at claim). */
export function backoffFor(attempt: number): number {
  // attempt 1 → 60s, 2 → 2m, 3 → 4m, ... capped at 1h.
  const ms = 30_000 * 2 ** Math.min(attempt, 7);
  return Math.min(ms, 3_600_000);
}
