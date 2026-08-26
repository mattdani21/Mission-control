import { defineConfig } from "@playwright/test";

/**
 * E2E + accessibility suite for Mission Control.
 *
 * The webServer boots a fully-offline stack (embedded Postgres on :5433 with
 * all migrations, then `next dev` with LLM_DEV_MODE=1 and RESEND_DEV_MODE=1),
 * so the smoke test exercises the real HTTP routes end-to-end without any
 * external provider: signup writes a real user row, campaigns persist, the
 * AI draft route streams its canned response through the real SSE pipeline,
 * and scheduled sends use synthetic message ids.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "bash scripts/e2e/start-stack.sh",
    url: "http://localhost:3100/api/healthz",
    reuseExistingServer: false,
    timeout: 300_000,
  },
});
