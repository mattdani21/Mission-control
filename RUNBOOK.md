# Mission Control — Operations runbook

Pilot on-call: **team@empyrean.co.za** (Empyrean Consult, Cape Town).

This is the day-2 list from `LAUNCH_CHECKLIST.md` §10. Production credentials
and the go-live sequence live in [`GO_LIVE.md`](./GO_LIVE.md).

## Logs

The app and the send worker emit **JSON pino** on stdout (`LOG_LEVEL`, default
`info`). Railway captures that stream.

To ship logs to a viewer (Axiom / Better Stack / Logtail):

1. Leave the app as-is — do not add a second logging SDK.
2. Attach a log drain on the Railway service to the viewer of choice.
3. Filter on `msg` fields such as `scheduled-send tick`, `resend-webhook`,
   `password-reset-sent`, `password-reset-send-failed`.

## Errors

Sentry is wired for the Next.js server, edge, and browser. Set `SENTRY_DSN`
and `NEXT_PUBLIC_SENTRY_DSN` (same value) in the host. Source maps upload
during `next build` only when `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and
`SENTRY_PROJECT` are present. Browser events tunnel through `/monitoring` so
the production CSP can stay `connect-src 'self'`.

## Uptime and status

- Probe `GET /api/healthz` from an external monitor (Better Stack / UptimeRobot)
  every minute. `/api/readyz` additionally checks the database.
- A one-page status URL (Instatus / Statuspage / a static doc) is enough for
  this pilot. Point it at the same on-call inbox.
- Page **team@empyrean.co.za** (and a phone number the owner keeps off-repo).

## Backups

Neon point-in-time recovery must be enabled on the production branch. After
the first deploy, perform one restore into a scratch branch and confirm a
signup still works. Record the date in `GO_LIVE.md`.

## Incidents

### AI provider outage (DeepSeek / Gemini)

- Text drafts: `POST /api/ai/draft` will 502. Do **not** set `LLM_DEV_MODE=1`
  in production (that serves canned copy).
- Images: `POST /api/ai/image` will fail without `GOOGLE_API_KEY`.
- Mitigation: tell the owner to write copy by hand in the composer; scheduled
  email still works. Resume when the provider is back.

### Email provider outage (Resend)

- New schedules still enqueue in Postgres. The cron tick will retry with
  backoff and then mark rows `failed`.
- Password reset will log `password-reset-send-failed` and the user will not
  receive a link.
- Mitigation: pause cron if Resend is looping 5xx; resume when Resend is
  healthy. Do **not** set `RESEND_DEV_MODE=1` in production.

### Database failover (Neon)

- `/api/readyz` fails; Railway healthcheck on `/api/healthz` stays up unless
  you add a DB probe there.
- Mitigation: fail over to the Neon replica / restore from PITR. Re-run
  `npm run db:migrate` only if the restored branch is empty.

## Scheduled sends in production

The Docker image is Next standalone (`node server.js`). It **cannot** run
`npm run worker`. Production delivery is:

```
GET /api/cron/send
Header: x-cron-secret: $CRON_SECRET
Every 1–5 minutes
```

Wire that as a Railway cron (or cron-job.org) against the public app URL.

## Error budget (pilot)

Target **99.5%** monthly availability on `/api/healthz`, excluding planned
Neon maintenance windows.
