import { expect, test } from "@playwright/test";

/**
 * M4 smoke: signup → create campaign → AI draft → send test email.
 * Runs fully offline (LLM_DEV_MODE + RESEND_DEV_MODE) against the real app.
 */

test("signup → campaign → AI draft → scheduled send", async ({ page }) => {
  const email = `smoke-${Date.now()}@empyrean.test`;

  // ── signup ──
  await page.goto("/signup");
  await page.getByLabel("Name (optional)").fill("Smoke Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("SmokePass123!");
  await page.getByRole("button", { name: "Create account" }).click();

  // Lands on the dashboard (brand context lives in the company dropdown).
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Marketing Mission Control/ })).toBeVisible();

  // ── create campaign (Send to Draft persists a real campaign row) ──
  await page.getByRole("button", { name: "Send to Draft →" }).click();
  await expect(page.getByText(/campaign saved ✓/)).toBeVisible();

  // The campaign landed in the pipeline Draft column.
  await expect(
    page.locator("section[aria-label='AI pipeline']").getByText(/The corseted column is the matric look/),
  ).toBeVisible();

  // ── AI draft (dev-mode canned stream through the real SSE path) ──
  await page.getByRole("button", { name: /AI-adapt for platform/ }).click();
  await expect(page.getByText(/adapted for 4 platforms ✓/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel("Composer")).toContainText("Draft for Envogue");

  // ── send test email (scheduled send with synthetic id) ──
  await page.getByLabel("Recipient email for scheduled send").fill("owner@envogue.example");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(page.getByText(/scheduled · /)).toBeVisible({ timeout: 20_000 });

  // The publish queue picked up the entry.
  await expect(page.getByText(/LIVE|✓/, { exact: false }).first()).toBeVisible();

  // ── claim + send path (regression: real Postgres rejects an unused $1 in
  // the claim UPDATE; pg-mem tolerated it and the UI never schedules due
  // sends, so only an explicit due-now send + cron tick exercises this) ──
  const due = new Date(Date.now() - 60_000).toISOString();
  const scheduled = await page.request.post("/api/sends/schedule", {
    data: {
      to: "owner@envogue.example",
      subject: "Due-now regression send",
      html: "<p>due now</p>",
      scheduledFor: due,
    },
  });
  expect(scheduled.ok()).toBeTruthy();

  const tick = await page.request.get("/api/cron/send", {
    headers: { "x-cron-secret": "e2e-cron-secret-do-not-use-in-prod" },
  });
  expect(tick.ok()).toBeTruthy();
  const result = (await tick.json()) as { claimed: number; sent: number };
  expect(result.sent).toBe(1);
});

test("theme toggle persists across reloads", async ({ page }) => {
  const email = `theme-${Date.now()}@empyrean.test`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("ThemePass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  const html = page.locator("html");
  await expect(html).not.toHaveClass(/light/);
  await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  await expect(html).toHaveClass(/light/);
  await page.reload();
  await expect(html).toHaveClass(/light/);
});
