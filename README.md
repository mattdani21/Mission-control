# Mission Control

Marketing mission control — a single home base where marketers run their
AI-assisted and manual marketing work: campaigns, copy, scheduled sends,
channel integrations.

## Status

Pre-launch. Target launch: this week. See
[`LAUNCH_CHECKLIST.md`](./LAUNCH_CHECKLIST.md) for the runbook and
[`.github/workflows/launch-readiness.yml`](./.github/workflows/launch-readiness.yml)
for the automated audit → harden → package pipeline.

## What it is

A web app where a marketer can:
- brief a campaign once,
- co-write copy with an AI assistant,
- send / schedule across email and social,
- track AI token usage per workspace,
- and see what's running, what's drafted, and what's performing.

## Stack

- Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Postgres (Neon) + `pg` with forward-only SQL migrations (`npm run db:migrate`).
  The persistence layer sits behind a repository interface
  (`lib/auth/repository.ts`); Prisma was the original freeze choice but its
  engine downloads are blocked in the offline orchestrator container, so the
  shipped implementation is plain parameterized SQL — swapping in Prisma later
  is a one-file change.
- Auth.js v5 — signup, login, logout, password reset (credentials + JWT
  sessions; one-time hashed reset tokens)
- DeepSeek v4-flash for AI assist — server-side proxy at `POST /api/ai/draft`
  (streaming via the shared `GAPOS_LLM_API_KEY`; the OpenAI-style upstream is
  converted to the same Anthropic-shaped SSE the client always consumed).
  Every request records one `ai_usage` row, attributed to the caller's
  workspace. `LLM_DEV_MODE=1` serves a canned stream when no key is set.
- Image generation — `POST /api/ai/image`: Gemini only (DeepInfra FLUX was
  removed per owner direction). Default/draft tier uses Gemini 2.5 Flash Image
  (`GOOGLE_API_KEY`); `hero: true` routes to gemini-3-pro-image with a
  hand-safe prompt suffix and an automatic vision-QA gate (PASS/FAIL on
  deformed hands/artifacts, up to 3 regeneration attempts) — only QA-passed
  images are returned. Returns a data URL to the browser.
- Resend for transactional + marketing email
- Scheduled sends — a Postgres-backed queue (`send_schedules`) with a cron+queue
  runner: `npm run worker` (long-running poller) or `GET /api/cron/send`
  (cron-triggered tick). No external queue service needed; see "Scheduled sends".
- Campaigns — `campaigns` table + `POST/GET /api/campaigns`; the pilot UI's
  "Send to Draft" persists a real campaign row.
- Sentry + pino for observability
- Railway for hosting (Dockerfile standalone build + `railway.json`)

## Local development

```bash
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, GAPOS_LLM_API_KEY, RESEND_API_KEY
# (GAPOS_LLM_API_KEY is the shared DeepSeek key; GOOGLE_API_KEY enables image
#  generation — Gemini 2.5 Flash Image for drafts, gemini-3-pro-image for
#  hero shots; LLM_DEV_MODE=1 + RESEND_DEV_MODE=1
#  run the whole AI/send flow offline without keys)
# generate a real AUTH_SECRET: openssl rand -base64 32

# 1) database — pick one:
docker compose up -d db     # Postgres on :5432, or:
npm run db:local            # embedded Postgres on :5433 (no Docker needed)

# 2) apply migrations
npm run db:migrate

# 3) run the app
npm install
npm run dev
```

App runs at http://localhost:3000. Auth flows live at `/signup`, `/login`,
`/forgot-password`, `/reset-password`; `/dashboard` is session-protected.

## Scheduled sends

Scheduled email sends are a cron+queue setup, so they work without an external
job service:

1. **Enqueue** — `POST /api/sends/schedule` (session-protected) with
   `{ to, subject, html, scheduledFor }` writes one `pending` row to the
   `send_schedules` table (`npm run db:migrate` creates it — migration 0003).
2. **Deliver** — a runner tick claims rows whose `scheduled_for` has arrived
   and sends them through Resend, then records the outcome back on the row
   (`sent` + Resend message id, `failed` with retries, or backoff-requeued).
   Any scheduler drives ticks:
   - locally / on a VM: `npm run worker` polls the queue (docker-compose runs
     a `worker` service for you),
   - serverless: point a cron (Vercel Cron, cron-job.org, …) at
     `GET /api/cron/send` with the `x-cron-secret` header set to `CRON_SECRET`
     (the endpoint is otherwise 401; it returns per-tick send counts).
3. **Watch** — delivery/bounce events will arrive via the webhook handler and
   update `delivery_status` (M3 roadmap).

For local development without a Resend account, set `RESEND_DEV_MODE=1`: with
no `RESEND_API_KEY` the runner returns synthetic message ids and the full
schedule → claim → send flow works offline. The same trick powers the AI
route: with `LLM_DEV_MODE=1` and no key, `POST /api/ai/draft` streams a canned
draft through the real SSE pipeline.

## End-to-end tests

`npm run test:e2e` runs Playwright against a fully offline stack: an embedded
Postgres (port 5433, all migrations) plus `next dev` with `LLM_DEV_MODE=1` and
`RESEND_DEV_MODE=1`. The suite covers the M4 smoke (signup → create campaign →
AI draft → scheduled send) and axe accessibility scans (WCAG 2 A/AA, no
serious/critical violations) on the landing page and dashboard. Browsers:
`npx playwright install chromium`.

## Production-readiness workflow

Every push runs three stages:

1. **Audit** — `scripts/launch/audit.sh` inventories what's missing
   (auth, tests, health checks, docs, etc.) and writes
   `launch-readiness-report.md`. PRs get the report as a comment.
2. **Harden** — Gitleaks (secrets), Trivy (deps + image vulns), Semgrep
   (OWASP Top 10), plus `scripts/launch/harden.sh` for in-repo controls
   (Dockerfile non-root, pinned actions, security headers, rate limiting,
   etc.). Results flow into the GitHub Security tab.
3. **Package** — Builds a multi-stage Docker image, generates a CycloneDX
   SBOM, scans the built image, and publishes both a container to GHCR
   and a versioned `.tar.gz` bundle.

The audit fails the workflow on `main` if any critical gap remains.

## Deployment

Built image is published to:

```
ghcr.io/mattdani21/mission-control:<version>
```

Release bundles are attached to the workflow run as artifacts.

## Security

See [`SECURITY.md`](./SECURITY.md).

## License

MIT — see [`LICENSE`](./LICENSE).
