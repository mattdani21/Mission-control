# PR Summary — Unit tests on auth, AI proxy and channel send

Implements #27 · M4 milestone ("Quality gates") · task 13

## What changed

M4's first quality gate: unit tests covering the three areas the milestone
names. Most of the suite was already in place from earlier tasks (auth tests
landed with #17/#21, channel-send tests with #21/#24); this task audits that
coverage against the checklist, closes the one real gap, and checks off the
LAUNCH_CHECKLIST §5 item.

- **`lib/anthropic.test.ts`** (new, 9 tests) — direct unit tests for the AI
  proxy core (`parseSseUsage` / `withUsageCapture`), which previously had no
  standalone tests: only the happy path ran through the route-level tests.
  New coverage:
  - `parseSseUsage`: input/cache-read tally from `message_start`, output
    tally from `message_delta`, tolerance of deltas without a usage field,
    non-usage events (content deltas, stops, pings), and malformed /
    non-JSON payloads (including the `[DONE]` marker) leaving usage untouched.
  - `withUsageCapture`: byte-exact forwarding with `onComplete` firing
    exactly once; upstream error mid-stream still settles the usage record
    with every event tallied before the failure and propagates the error to
    the consumer; error before any event fires `onComplete` once with zero
    usage; client disconnect fires `onComplete` exactly once with usage so
    far and cancels the upstream reader. These are the paths that guarantee
    the `ai_usage` row survives provider failures and dropped connections.
- **`LAUNCH_CHECKLIST.md`** — §5 "Unit tests on auth, AI proxy, channel send"
  checked off (the other §5 items are separate tasks: Playwright smoke #14,
  Lighthouse/lint-in-CI #15).

## Why

M4's definition of done is "LAUNCH_CHECKLIST.md §5 (Quality) fully checked."
The unit-test bullet required (a) a suite that actually covers auth, the AI
proxy and channel send, and (b) proof it runs green in CI. Coverage audit
result: auth — password hashing, reset-token hashing, Zod validation, the
auth service, all three auth HTTP routes, and a full Auth.js session-flow
test; AI proxy — route integration against pg-mem with a canned SSE upstream
plus the new stream/usage edge cases; channel send — the Resend HTTP client,
the send-queue repository (pg-mem), the runner tick, the schedule/cron
routes. The only uncovered unit surface was the AI proxy's stream
forwarding/usage-tally helpers on non-happy paths, fixed by the new file.

## How it was tested

- `npm test` — **106 tests, 17 files, all passing** (was 97/16; +9 from
  `lib/anthropic.test.ts`).
- `npm run lint` — clean.
- `npm run typecheck` — clean (also exercised by `.github/workflows/ci.yml`
  on every PR).
- `bash scripts/launch/audit.sh` — **exit 0, 0 critical gaps, 32 passing**
  (the launch-readiness merge gate).
