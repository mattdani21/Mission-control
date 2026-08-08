import { createHash, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";
import pino from "pino";

import { PgSendQueueRepository } from "../../../../lib/queue/send-queue";
import { defaultSender, runTick } from "../../../../lib/queue/runner";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// GET /api/cron/send — the "cron" half of the cron+queue scheduled-send
// runner. Any external scheduler (Vercel Cron, cron-job.org, GitHub Actions
// schedule, or a plain curl in a docker-compose worker) hits this endpoint on
// an interval; each call runs one tick: claim due sends, deliver through
// Resend, settle the queue rows. The long-running alternative is
// `npm run worker`, which calls the same runTick in a loop.
//
// The endpoint is guarded by CRON_SECRET (constant-time compare) so an
// unauthenticated caller cannot drain the queue.

function secretMatches(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "The cron endpoint is not configured (CRON_SECRET is unset)." }, { status: 503 });
  }
  if (!secretMatches(request.headers.get("x-cron-secret"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await runTick(new PgSendQueueRepository(), defaultSender());
    if (result.claimed > 0) {
      logger.info({ ...result }, "scheduled-send tick");
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err: message }, "scheduled-send tick failed");
    return NextResponse.json({ error: "The send queue could not be processed." }, { status: 500 });
  }
}
