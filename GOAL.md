# Goal

Launch Mission Control as the live marketing-operations hub for Empyrean (target: launch this week)

## Roadmap

### M1 — Bootstrap the v1 application
- [ ] Freeze the v1 stack and surface (LAUNCH_CHECKLIST.md §1) — suggested cut: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Postgres/Prisma + Auth.js
- [ ] Add package.json + lockfile and scaffold the app so `npm run dev` boots on :3000
- [ ] Add a test framework (Vitest) with the first passing tests — audit.sh requires a test suite
- [ ] Implement `/api/healthz` and `/api/readyz` (Dockerfile HEALTHCHECK probes /api/healthz)
- [ ] Complete `.env.example` and the real Dockerfile build steps so the image builds
*Definition of done:* `scripts/launch/audit.sh` reports 0 critical gaps and the launch-readiness workflow is green on main.

### M2 — Auth, campaigns and AI assist
- [ ] Auth.js end-to-end: signup, login, logout, password reset
- [ ] Campaign object: title, brief, status, owner, channel
- [ ] Server-side Anthropic proxy route (never called from the browser) with streaming and prompt caching
- [ ] Per-workspace token usage capture (`ai_usage` table)
*Definition of done:* signup → create campaign → AI draft works locally; usage is recorded per workspace.

### M3 — Channel integrations
- [ ] Resend integration: verified domain, single send + scheduled send
- [ ] Background job runner for scheduled sends (Inngest or cron+queue)
- [ ] Webhook handler for delivery / bounce events
*Definition of done:* a scheduled campaign email sends on time and delivery events are recorded.

### M4 — Quality gates
- [ ] Unit tests on auth, AI proxy and channel send
- [ ] Playwright smoke: signup → create campaign → AI draft → send test email
- [ ] Lint + typecheck in CI; Lighthouse a11y ≥ 90 on landing + dashboard
*Definition of done:* LAUNCH_CHECKLIST.md §5 (Quality) fully checked.

### M5 — Security, hardening and observability
- [ ] `scripts/launch/harden.sh` green: secrets in env only, security headers, rate limiting, CSRF, Zod validation, CORS
- [ ] Sentry (frontend + backend) with source maps; structured pino logs shipping to a viewer
- [ ] Uptime monitor on /healthz, status page, on-call contact
- [ ] DB backups: Neon point-in-time enabled and one verified restore
*Definition of done:* LAUNCH_CHECKLIST.md §6–§7 fully checked; hardening report has no failures.

### M6 — Compliance and launch
- [ ] Publish /privacy and /terms; data deletion path
- [ ] Domain + SSL, www→apex redirect, NODE_ENV=production
- [ ] Tag v1.0.0 and let the package stage publish the GHCR image + release bundle
- [ ] Smoke-test prod with a real signup + real send, then open the doors
*Definition of done:* launch-readiness workflow green on main, v1.0.0 tagged, real signup + send verified in prod (LAUNCH_CHECKLIST.md §9).
