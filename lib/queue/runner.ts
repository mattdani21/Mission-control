import { ResendClient, ResendError, type EmailSender } from "../resend";
import type { SendQueueRepository } from "./send-queue";

/**
 * One tick of the scheduled-send runner — the unit both the long-running
 * worker (scripts/worker.ts) and the cron endpoint (GET /api/cron/send)
 * execute: claim due sends, deliver each through an EmailSender, and settle
 * the queue row (sent / retry / failed). All persistence goes through the
 * SendQueueRepository interface, so the flow is unit-testable with fakes.
 */

export interface TickOptions {
  /** Max rows to claim in this tick. */
  limit?: number;
  /** Clock override for tests. */
  now?: Date;
}

export interface TickResult {
  claimed: number;
  sent: number;
  retrying: number;
  failed: number;
}

/** Build the sender the runner uses in production (Resend, with dev mode). */
export function defaultSender(): EmailSender {
  return new ResendClient();
}

/**
 * A send failure is only retried when it looks transient: network errors,
 * HTTP 5xx, and rate limits (429). Validation-style 4xx errors from the
 * provider are permanent — retrying would just fail again.
 */
export function isRetryable(err: unknown): boolean {
  if (err instanceof ResendError) {
    if (err.status === null) return true; // network-level failure
    return err.status >= 500 || err.status === 429;
  }
  return true;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export async function runTick(
  queue: SendQueueRepository,
  sender: EmailSender,
  options: TickOptions = {},
): Promise<TickResult> {
  const limit = options.limit ?? 50;
  const now = options.now ?? new Date();

  const claimed = await queue.claimDue(limit, now);

  let sent = 0;
  let retrying = 0;
  let failed = 0;

  for (const item of claimed) {
    try {
      const result = await sender.send({
        from: item.fromEmail ?? process.env.EMAIL_FROM ?? "Mission Control <hello@yourdomain.com>",
        to: item.recipientEmail,
        subject: item.subject,
        html: item.bodyHtml,
      });
      await queue.markSent(item.id, result.id);
      sent += 1;
    } catch (err) {
      const settled = await queue.markFailed(item.id, errorMessage(err), {
        retryable: isRetryable(err),
      });
      if (settled.status === "failed") {
        failed += 1;
      } else {
        retrying += 1;
      }
    }
  }

  return { claimed: claimed.length, sent, retrying, failed };
}
