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
- Anthropic Claude for AI assist — server-side proxy at `POST /api/ai/draft`
  (streaming, prompt caching; never called from the browser). Every request
  records one `ai_usage` row, attributed to the caller's workspace.
- Resend for transactional + marketing email
- Inngest for scheduled jobs
- Sentry + pino for observability
- Vercel for hosting

## Local development

```bash
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, RESEND_API_KEY
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
