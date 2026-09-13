# State

Pre-launch. Target: ship the Empyrean / Envogue pilot (GOAL.md M5–M6).

## Current state

Mission Control is a Next.js 15 app with Auth.js, Postgres (`pg` + SQL
migrations), DeepSeek draft assist, Gemini image generation, Resend email,
a cron+queue scheduled-send runner, Sentry, and published `/privacy` +
`/terms` plus `DELETE /api/account`.

Automated audit (`scripts/launch/audit.sh`) reports 0 critical gaps. The
human go-live remaining is owner infrastructure: see `GO_LIVE.md`.

## Broken / incomplete

- Owner-gated: Neon PITR + verified restore, domain/SSL, Resend verified
  domain, Sentry DSN in prod, uptime/status page, prod smoke, `v1.0.0` tag.
- Dashboard KPIs / calendar / social chips / most pipeline cards are seeded
  demo data (`lib/slots.ts`) plus `localStorage`. Real backends: campaigns,
  AI draft, AI image, schedule email, campaign status PATCH.
- Prompt caching (M2 wording) is not implemented on the DeepSeek path —
  leave it; do not reopen M2.
- In-memory rate limit is enough for a single Railway instance. Upstash
  env vars are unused.

## Blockers

Production credentials and the checklist in `GO_LIVE.md`.

## Test command

`npm test` (Vitest). E2E: `npm run test:e2e` (Playwright + embedded Postgres).

## Run command

`cp .env.example .env` then `npm run db:migrate && npm run dev`.
App: http://localhost:3000.
