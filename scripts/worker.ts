/**
 * Long-running scheduled-send worker — the "background job runner".
 *
 * Polls the `send_schedules` queue and delivers due sends through Resend,
 * exactly like the cron endpoint (GET /api/cron/send) but as a process:
 * intended for docker-compose / VM deploys that can keep a process alive.
 *
 * Usage: npm run worker
 *   SEND_QUEUE_POLL_MS  poll interval in ms (default 15_000)
 *   SEND_QUEUE_LIMIT    max sends per tick (default 50)
 *
 * Runs on Node >= 18 via tsx (dev dependency).
 */
import pino from "pino";

import { PgSendQueueRepository } from "../lib/queue/send-queue";
import { defaultSender, runTick } from "../lib/queue/runner";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const POLL_MS = Number(process.env.SEND_QUEUE_POLL_MS ?? 15_000);
const LIMIT = Number(process.env.SEND_QUEUE_LIMIT ?? 50);

async function tick(): Promise<void> {
  try {
    const result = await runTick(new PgSendQueueRepository(), defaultSender(), { limit: LIMIT });
    if (result.claimed > 0) {
      logger.info({ ...result }, "scheduled-send tick");
    }
  } catch (err) {
    logger.error({ err: err instanceof Error ? err.message : String(err) }, "scheduled-send tick failed");
  }
}

async function main(): Promise<void> {
  logger.info({ pollMs: POLL_MS, limit: LIMIT }, "scheduled-send worker started");
  await tick(); // run once immediately, then poll
  setInterval(tick, POLL_MS).unref();
}

main().catch((err: unknown) => {
  logger.error({ err: err instanceof Error ? err.message : String(err) }, "scheduled-send worker exited");
  process.exit(1);
});
