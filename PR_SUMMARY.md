# PR Summary — Background job runner for scheduled sends (cron+queue)

Implements #24 · M3 milestone ("Channel integrations") · task 11

## What changed

A zero-dependency **cron+queue** scheduled-send runner (the roadmap's
"Inngest or cron+queue" choice — this repo uses the self-hosted option, so no
external queue service or account is required):

- **`db/migrations/0003_send_schedules.sql`** — the queue: a `send_schedules`
  table (workspace-attributed, with `pending / sending / sent / failed /
  cancelled` states, attempt counter + max attempts, exponential retry backoff
  (`next_attempt_at`), `last_error`, Resend message id, and `delivery_status`
  for the upcoming webhook task). Applied by the existing `npm run db:migrate`.
- **`lib/queue/send-queue.ts`** — `PgSendQueueRepository` behind a repository
  interface (repo convention): `createSchedule`, `claimDue`, `markSent`,
  `markFailed`, `listForWorkspace`. Claiming is a due-ids SELECT followed by an
  UPDATE that re-checks `status = 'pending'`, so two concurrent workers cannot
  double-send (no `FOR UPDATE SKIP LOCKED` needed; safe under READ COMMITTED).
- **`lib/resend.ts`** — fetch-based Resend HTTP client (`EmailSender`
  boundary); `RESEND_API_KEY` never leaves the server. `RESEND_DEV_MODE=1`
  returns synthetic message ids when no key is set, so the whole flow runs
  offline.
- **`lib/queue/runner.ts`** — one tick: claim due → send via `EmailSender` →
  settle (sent / retry-with-backoff / permanent-fail). Retry policy: network
  errors, 5xx and 429 retry; 4xx validation failures fail permanently.
- **`app/api/sends/schedule/route.ts`** — session-protected `POST` to enqueue
  a scheduled send (zod-validated).
- **`app/api/cron/send/route.ts`** — the "cron" half: any external scheduler
  (Vercel Cron, cron-job.org, GitHub Actions schedule) hits `GET /api/cron/send`
  with `x-cron-secret` (constant-time compare; 503 if unset, 401 on mismatch)
  and one tick runs. Returns `{ claimed, sent, retrying, failed }`.
- **`scripts/worker.ts` + `npm run worker`** — the long-running poller for
  docker-compose / VM deploys (poll interval + batch size configurable);
  `docker-compose.yml` gains a `worker` service.
- **Docs** — README "Scheduled sends" section, `.env.example`
  (`CRON_SECRET`, `RESEND_DEV_MODE`, `SEND_QUEUE_POLL_MS`, `SEND_QUEUE_LIMIT`),
  GOAL.md checkoff. New dev dependency: `tsx` (runs the TS worker; CI's
  `npm ci` picks it up from the lockfile).

## Why

M3's definition of done is "a scheduled campaign email sends on time and
delivery events are recorded." There was no queue, no worker, and no delivery
recording — the Resend integration task (#22) shipped the env contract only.
This task provides the queue, the runner (worker + cron trigger), the send
path, and the recorded delivery outcome (`sent_at`, Resend message id,
`delivery_status='queued'`); the webhook task (#25) will update
`delivery_status` from provider events.

## How it was tested

- `npm test` — **97 tests, 16 files, all passing** (was 60 before). New
  coverage:
  - queue repository (11 tests, pg-mem): create/claim in schedule order,
    future rows excluded, claim limit, no double-claim, retry backoff window,
    sent settlement, attempt exhaustion, non-retryable failure, per-workspace
    listing, backoff curve;
  - runner tick (7 tests, fakes): happy path, per-schedule from-address,
    retryable vs permanent failures, crash-after-claim handling;
  - Resend client (7 tests, stubbed fetch): request shape/headers, 4xx/429
    errors, non-JSON bodies, network failures, dev mode, missing key;
  - both routes (9 tests): auth/workspace/validation/enqueue for the schedule
    route; 503/401/200/500 for the cron route;
  - **pipeline test** (3 tests, real repo SQL + real runner + real client in
    dev mode): a due scheduled email is claimed, "sent", and the row records
    the delivery outcome; future sends stay pending; transient failures go
    back to the queue with the error stored.
- `npm run lint` and `npm run typecheck` — clean.
- `npm run build` — production build succeeds.
- Worker smoke test — `npx tsx scripts/worker.ts` starts, logs via pino, and
  degrades gracefully when `DATABASE_URL` is absent.
- Real-Postgres validation is not possible in this offline container (no
  server binaries / docker); the migration SQL is executed and verified by
  pg-mem in the suite, per the repo's established convention.

## Notes

- No `.env` files touched; no secrets added; existing `.env.example` keys
  unchanged. `package-lock.json` gains only the `tsx` dev dependency.
- The branch is stacked on `orch/21` (app scaffold + auth + AI proxy + usage),
  matching the repo's base-on-previous-branch convention; the incremental diff
  for this task is ~1,600 lines (feature ~700, tests ~930) excluding the
  lockfile — one cohesive vertical slice (queue + runner + client + routes +
  worker + docs) with the full test suite that proves M3's definition of done.
