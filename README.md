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
- and see what's running, what's drafted, and what's performing.

## Stack (suggested, not yet implemented)

- Next.js 15 + TypeScript + Tailwind + shadcn/ui
- Postgres (Neon) + Prisma
- Auth.js (email + Google)
- Anthropic Claude for AI assist
- Resend for transactional + marketing email
- Inngest for scheduled jobs
- Sentry + pino for observability
- Vercel for hosting

## Local development

```bash
cp .env.example .env
# fill in DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, RESEND_API_KEY

# with docker
docker compose up --build

# or natively (once package.json exists)
npm install
npm run dev
```

App runs at http://localhost:3000.

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
