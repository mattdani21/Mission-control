# PR: GitHub Actions CI running Vitest + lint + `npm run build` on every PR

## What changed

Adds the orchestrator's merge gate — a dedicated CI workflow for the app
(M1, task 5), plus the small lint fix required to make it green:

- **`.github/workflows/ci.yml`** — new `CI` workflow with three parallel jobs,
  triggered on **every pull request targeting `main`**, on pushes to `main`,
  and via `workflow_dispatch`:
  - `test` — `npm ci` then `npm test` (Vitest, 7 tests)
  - `lint` — `npm ci` then `npm run lint` + `npm run typecheck`
  - `build` — `npm ci` then `npm run build` (production Next.js build)
  - Uses `actions/checkout@v7` (repo convention, matches
    `launch-readiness.yml`), `actions/setup-node@v4` pinned to Node 22
    (satisfies every `package-lock.json` engine requirement), with npm cache.
  - `permissions: contents: read` only — minimal privilege, unlike the
    launch-readiness workflow which needs write scopes for commenting.
- **`eslint.config.mjs`** — ignore generated output (`.next/**`, `out/**`,
  `build/**`, `coverage/**`) and the generated `next-env.d.ts`. Without this,
  `eslint .` fails: 1233 problems in `.next` build artifacts plus a
  `@typescript-eslint/triple-slash-reference` error on `next-env.d.ts` that
  would fail the CI lint job on a clean checkout even before any build.

This branch is based on `orch/10` (the app scaffold + Vitest framework PR,
#12) so the workflow could be exercised against the real app; this PR's own
delta on top of that state is the workflow plus the ESLint ignore fix.

## Why

The audit gate (`scripts/launch/audit.sh`) requires a test suite, and the M1
definition of done requires a launch-readiness workflow green on main. Up to
now the repo had no CI that actually exercised the application: nothing ran
`npm test`, lint, typecheck, or `npm run build` on PRs, so regressions could
merge unnoticed. This workflow makes Vitest + lint + build a required part of
every PR — the merge gate the orchestrator's task describes.

## How it was tested

All four commands pass in this container (Node 18.20, npm 10, full
`npm ci` from the committed lockfile — 700 packages):

- `npm test` — **7 tests pass** (5 `cn()` unit tests + 2 Home page component tests)
- `npm run lint` — **0 problems** (was 1233 before the eslint ignore fix)
- `npm run typecheck` — clean, verified both with and without a pre-existing
  `.next/` directory (fresh-checkout simulation for CI)
- `npm run build` — Next.js 15.5.23 production build completes, exit 0
- `bash scripts/launch/audit.sh` — critical gaps reduced to **1** (health
  endpoint, which is the next M1 task's deliverable: `/api/healthz` +
  `/api/readyz`); "CI workflow defined" and "Test suite present" pass.

## Notes

- No `.env` files touched, no secrets, no force-push, no changes to `main`
  (work is on `orch/15-...`).
- Two warnings remain that are outside this task's scope: the audit's
  "Linter configured" check only recognizes `.eslintrc.*` / `eslint.config.js`
  (not `eslint.config.mjs` — a false negative; the linter IS configured), and
  "Health check endpoint" is the next M1 task.
