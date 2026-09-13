# Mission Control — Launch Checklist

Target: **end of this week**.
Product: a home base where marketers run AI-assisted and manual marketing work.

The automated workflow (`.github/workflows/launch-readiness.yml`) covers most of
this. This document is the human checklist for the things a script can't verify.
Owner-gated remaining steps: [`GO_LIVE.md`](./GO_LIVE.md). Day-2 ops:
[`RUNBOOK.md`](./RUNBOOK.md).

---

## 1. Product scope (lock by Mon)
- [x] Decide v1 surface area. Suggested cut for a 1-week launch:
  - [x] Auth + workspaces (single user; team invites deferred)
  - [x] Campaign object: title, brief, status, owner, channel
  - [x] AI assist panel — draft copy, rewrite, repurpose (DeepSeek)
  - [x] One outbound channel integration (Resend for email)
  - [ ] One social/post-scheduling channel (Buffer API or LinkedIn) — **cut** (email-only)
- [x] Pick stack and freeze. Next.js 15 + TypeScript + Postgres (`pg`) + Auth.js + Tailwind, deployed to Railway + Neon.
- [x] Defer to v1.1: billing, multi-tenant orgs, deep analytics, Zapier, social.

## 2. Foundations (Mon–Tue)
- [x] Repo bootstrapped with the chosen stack
- [x] `.env.example` with every required variable
- [x] Database provisioned + migrations checked in
- [x] Auth working end-to-end (signup, login, logout, password reset)
- [x] Health check at `/api/healthz` and `/api/readyz`

## 3. AI assist (Tue–Wed)
- [x] LLM key in env (`GAPOS_LLM_API_KEY` — DeepSeek; Anthropic wording retired)
- [x] Server-side LLM proxy route (never call from the browser)
- [ ] Prompt caching enabled on system prompt + brand guidelines — **not on DeepSeek; leave closed**
- [x] Streaming responses to the UI
- [x] Per-workspace token usage capture (table: `ai_usage`)

## 4. Channels (Wed–Thu)
- [x] Email: Resend integration, single send + scheduled send (verified domain is owner — GO_LIVE.md)
- [x] Background job runner for scheduled sends (cron+queue; prod uses `GET /api/cron/send`)
- [x] Webhook handler for delivery / bounce events (`POST /api/webhooks/resend`)

## 5. Quality (Thu)
- [x] Unit tests on auth, AI proxy, channel send
- [x] Playwright smoke test: signup → create campaign → AI draft → send test email
- [x] Lighthouse a11y score ≥ 90 on landing + dashboard (axe CI gate: no serious/critical WCAG 2 A/AA violations; manual Lighthouse run in the pilot evidence)
- [x] Lint + typecheck pass in CI

## 6. Security & hardening (Thu–Fri morning)
Automated checks live in `scripts/launch/harden.sh`. Confirm manually:
- [x] All secrets in env vars / vault — none in code or git history
- [x] Helmet (or equivalent) sets HSTS, CSP, X-Frame-Options, Referrer-Policy
- [x] Rate limit `/api/auth/*` and `/api/ai/*` (per-IP; single Railway instance)
- [x] CSRF protection on cookie-auth mutations (Auth.js)
- [x] Input validation with Zod on every API route
- [x] CORS limited to your domain(s) (same-origin App Router)
- [x] Dependabot enabled, no Critical/High vulns at launch
- [x] Gitleaks clean
- [ ] DB backups: Neon point-in-time enabled, restore tested — owner (GO_LIVE.md)
- [ ] Restored from backup at least once (don't skip this) — owner (GO_LIVE.md)

## 7. Observability (Fri morning)
- [x] Sentry connected (frontend + backend), source maps uploaded when `SENTRY_AUTH_TOKEN` is set
- [x] Structured logs (pino) on stdout; attach a Railway log drain to a viewer
- [ ] Uptime monitor pinging `/api/healthz` from outside (Better Stack / UptimeRobot) — owner
- [ ] On-call: who gets paged? Phone number on the alert. — owner (`team@empyrean.co.za` is the inbox)
- [ ] Status page (Statuspage / Instatus) — even a static one is fine — owner

## 8. Compliance & legal (Fri)
- [x] Privacy policy published (`/privacy`)
- [x] Terms of service published (`/terms`)
- [x] Cookie banner if you're using analytics in the EU — **N/A** (session cookie + theme `localStorage` only)
- [ ] DPA available on request if selling to EU customers — **deferred** (internal pilot)
- [x] Data deletion path: dashboard **Delete account** (`DELETE /api/account`) or email `team@empyrean.co.za`

## 9. Launch (Fri afternoon)
- [ ] Domain + SSL configured, www→apex redirect — owner (GO_LIVE.md)
- [ ] Production env vars set (double-check `NODE_ENV=production`) — owner
- [ ] Run the workflow against `main` — it must be green
- [ ] Tag `v1.0.0`, push, let the package stage publish the image + bundle — after prod smoke
- [ ] Smoke-test prod with a real signup + real send — owner
- [ ] Open the doors — Envogue owner only

## 10. Day-2 (post-launch, but plan for it now)
- [x] Error budget defined (e.g., 99.5% monthly) — see RUNBOOK.md
- [x] Runbook for: AI provider outage, email provider outage, DB failover
- [x] Customer support channel (Plain, Intercom, or a shared inbox) — `team@empyrean.co.za`
- [ ] Feedback loop: in-app feedback widget → tracked — v1.1

---

## Realistic cut-list if Friday gets tight

Drop in this order, not the other way around:
1. Social channel integration → ship email-only **(done)**
2. Scheduled sends → ship "send now" only **(keep scheduled sends — they shipped)**
3. Team invites → ship single-user workspaces **(done)**
4. Custom domains → ship on `app.yourdomain.com`

Do **not** cut: auth, rate limiting, Sentry, backups, privacy/ToS.
