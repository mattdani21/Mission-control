# Mission Control — Launch Checklist

Target: **end of this week**.
Product: a home base where marketers run AI-assisted and manual marketing work.

The automated workflow (`.github/workflows/launch-readiness.yml`) covers most of
this. This document is the human checklist for the things a script can't verify.

---

## 1. Product scope (lock by Mon)
- [ ] Decide v1 surface area. Suggested cut for a 1-week launch:
  - [ ] Auth + workspaces (single user → invite teammates)
  - [ ] Campaign object: title, brief, status, owner, channel
  - [ ] AI assist panel (Claude) — draft copy, rewrite, repurpose
  - [ ] One outbound channel integration (Resend for email is the cheapest)
  - [ ] One social/post-scheduling channel (Buffer API or LinkedIn) — stretch
- [ ] Pick stack and freeze. Suggested: Next.js 15 + TypeScript + Postgres + Prisma + Auth.js + Tailwind + shadcn/ui, deployed to Vercel + Neon (fastest path).
- [ ] Defer to v1.1: billing, multi-tenant orgs, deep analytics, Zapier.

## 2. Foundations (Mon–Tue)
- [ ] Repo bootstrapped with the chosen stack
- [ ] `.env.example` with every required variable
- [ ] Database provisioned + migrations checked in
- [ ] Auth working end-to-end (signup, login, logout, password reset)
- [ ] Health check at `/api/healthz` and `/api/readyz`

## 3. AI assist (Tue–Wed)
- [ ] Anthropic API key in env (`ANTHROPIC_API_KEY`)
- [ ] Server-side LLM proxy route (never call from the browser)
- [ ] Prompt caching enabled on system prompt + brand guidelines
- [ ] Streaming responses to the UI
- [ ] Per-workspace token usage capture (table: `ai_usage`)

## 4. Channels (Wed–Thu)
- [ ] Email: Resend integration, verified domain, single send + scheduled send
- [ ] Background job runner for scheduled sends (Inngest, Trigger.dev, or a cron+queue)
- [ ] Webhook handler for delivery / bounce events

## 5. Quality (Thu)
- [ ] Unit tests on auth, AI proxy, channel send
- [ ] Playwright smoke test: signup → create campaign → AI draft → send test email
- [ ] Lighthouse a11y score ≥ 90 on landing + dashboard
- [ ] Lint + typecheck pass in CI

## 6. Security & hardening (Thu–Fri morning)
Automated checks live in `scripts/launch/harden.sh`. Confirm manually:
- [ ] All secrets in env vars / vault — none in code or git history
- [ ] Helmet (or equivalent) sets HSTS, CSP, X-Frame-Options, Referrer-Policy
- [ ] Rate limit `/api/auth/*` and `/api/ai/*` (per-IP and per-user)
- [ ] CSRF protection on cookie-auth mutations
- [ ] Input validation with Zod on every API route
- [ ] CORS limited to your domain(s)
- [ ] Dependabot enabled, no Critical/High vulns at launch
- [ ] Gitleaks clean
- [ ] DB backups: Neon point-in-time enabled, restore tested
- [ ] Restored from backup at least once (don't skip this)

## 7. Observability (Fri morning)
- [ ] Sentry connected (frontend + backend), source maps uploaded
- [ ] Structured logs (pino) shipping to a viewer (Axiom / Better Stack / Logtail)
- [ ] Uptime monitor pinging `/healthz` from outside (Better Stack / UptimeRobot)
- [ ] On-call: who gets paged? Phone number on the alert.
- [ ] Status page (Statuspage / Instatus) — even a static one is fine

## 8. Compliance & legal (Fri)
- [ ] Privacy policy published (`/privacy`)
- [ ] Terms of service published (`/terms`)
- [ ] Cookie banner if you're using analytics in the EU
- [ ] DPA available on request if selling to EU customers
- [ ] Data deletion path: how does a user delete their account + data?

## 9. Launch (Fri afternoon)
- [ ] Domain + SSL configured, www→apex redirect
- [ ] Production env vars set (double-check `NODE_ENV=production`)
- [ ] Run the workflow against `main` — it must be green
- [ ] Tag `v1.0.0`, push, let the package stage publish the image + bundle
- [ ] Smoke-test prod with a real signup + real send
- [ ] Open the doors

## 10. Day-2 (post-launch, but plan for it now)
- [ ] Error budget defined (e.g., 99.5% monthly)
- [ ] Runbook for: AI provider outage, email provider outage, DB failover
- [ ] Customer support channel (Plain, Intercom, or a shared inbox)
- [ ] Feedback loop: in-app feedback widget → tracked

---

## Realistic cut-list if Friday gets tight

Drop in this order, not the other way around:
1. Social channel integration → ship email-only
2. Scheduled sends → ship "send now" only
3. Team invites → ship single-user workspaces
4. Custom domains → ship on `app.yourdomain.com`

Do **not** cut: auth, rate limiting, Sentry, backups, privacy/ToS.
