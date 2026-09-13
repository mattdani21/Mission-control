# Mission Control — Owner go-live

Code for M5/M6 is in the repo. These steps cannot be finished by a script.
Do them in order, then tag `v1.0.0`.

## 1. Accounts to confirm

- [ ] Railway project (Dockerfile builder, healthcheck `/api/healthz`)
- [ ] Neon Postgres (production branch + PITR enabled)
- [ ] Resend account with a **verified sending domain**
- [ ] Sentry project (org + project slugs)
- [ ] Domain + SSL (www → apex)
- [ ] External uptime check on `https://<prod>/api/healthz`
- [ ] One-page status URL

## 2. Production environment

Set these on the Railway **web** service (`NODE_ENV=production`):

```
NODE_ENV=production
APP_URL=https://<prod-host>
DATABASE_URL=           # Neon
AUTH_SECRET=            # openssl rand -base64 32
AUTH_TRUST_HOST=true
GAPOS_LLM_API_KEY=
GOOGLE_API_KEY=
RESEND_API_KEY=
EMAIL_FROM=Mission Control <hello@<verified-domain>>
RESEND_WEBHOOK_SECRET=  # whsec_… from Resend
CRON_SECRET=            # openssl rand -base64 32
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN= # same value as SENTRY_DSN
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=      # build-time, for source maps
```

Do **not** set `LLM_DEV_MODE` or `RESEND_DEV_MODE` in production.

## 3. Database

```
npm run db:migrate
```

against the Neon `DATABASE_URL` (migrations `0001`–`0005`).

- [ ] Neon PITR enabled
- [ ] One restore into a scratch branch verified (signup still works)
- Restore date: _______________

## 4. Cron (required)

The production image cannot run `npm run worker`. Add a cron that hits:

```
GET https://<prod-host>/api/cron/send
Header: x-cron-secret: <CRON_SECRET>
Schedule: every 1–5 minutes
```

Railway Cron, GitHub Actions `schedule`, or cron-job.org are all fine.

## 5. Resend webhook

In the Resend dashboard, point a webhook at:

```
https://<prod-host>/api/webhooks/resend
```

Events: `email.delivered`, `email.bounced`, `email.complained`,
`email.delivery_delayed`. Copy the signing secret into `RESEND_WEBHOOK_SECRET`.

## 6. Launch-readiness

- [ ] `.github/workflows/launch-readiness.yml` is green on `main`
- [ ] `scripts/launch/harden.sh` is green
- [ ] Production env vars double-checked (`NODE_ENV=production`)

## 7. Prod smoke (human)

On the live host, with real keys:

1. Sign up with a real inbox.
2. AI-adapt a draft (DeepSeek).
3. Schedule a send to that inbox; wait for the cron tick.
4. Confirm the message arrives and `delivery_status` becomes `delivered`
   (Resend webhook).
5. Trigger forgot-password and confirm the reset email arrives.
6. Open `/privacy` and `/terms`.

## 8. Tag and open the doors

After the smoke is green:

```
git tag v1.0.0
git push origin v1.0.0
```

The launch-readiness **package** stage publishes
`ghcr.io/mattdani21/mission-control:1.0.0` and the release bundle.

This is an **Envogue / Empyrean pilot**, not a public SaaS launch. Share the
URL with the Envogue owner only.

## 9. Close leftover GitHub issues

These M1–M3 issues were implemented on `main` but left open:

- #8, #11, #13, #18, #19, #22 — close as completed
- #25 — close only after the webhook is live and the smoke in §7 passed
