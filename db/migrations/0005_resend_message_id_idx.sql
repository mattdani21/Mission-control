-- 0005_resend_message_id_idx — webhook lookups by Resend message id
-- Applied by npm run db:migrate in filename order.

CREATE INDEX IF NOT EXISTS send_schedules_resend_message_id_idx
  ON send_schedules (resend_message_id);
