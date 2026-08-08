-- 0003_send_schedules - background job queue for scheduled sends
-- Applied by npm run db:migrate in filename order
--
-- The "queue" half of the cron+queue scheduled-send runner: one row per
-- scheduled email. A worker (scripts/worker.ts, or any external cron hitting
-- GET /api/cron/send) claims rows whose scheduled_for has arrived, hands them
-- to the Resend API, and records the outcome back on the row. Delivery/bounce
-- events arrive later via webhook and update delivery_status.

CREATE TABLE IF NOT EXISTS send_schedules (
  id               text PRIMARY KEY,
  workspace_id     text REFERENCES workspaces(id) ON DELETE SET NULL,
  recipient_email  text NOT NULL,
  subject          text NOT NULL,
  body_html        text NOT NULL,
  from_email       text,
  scheduled_for    timestamptz NOT NULL,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
  attempts         integer NOT NULL DEFAULT 0,
  max_attempts     integer NOT NULL DEFAULT 3,
  next_attempt_at  timestamptz,
  last_error       text,
  resend_message_id text,
  delivery_status  text,
  sent_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- The worker's hot query: due, retryable rows in schedule order.
CREATE INDEX IF NOT EXISTS send_schedules_due_idx
  ON send_schedules (status, scheduled_for);

CREATE INDEX IF NOT EXISTS send_schedules_workspace_id_idx
  ON send_schedules (workspace_id);
