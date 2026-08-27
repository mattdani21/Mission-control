import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * M4 a11y gate: axe scans (WCAG 2 A/AA) on the landing page and the
 * authenticated dashboard. CI fails on any serious or critical violation —
 * this is the machine-checkable proxy for the Lighthouse ≥ 90 target.
 */

test("landing page has no serious or critical accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious).toEqual([]);
});

test("dashboard has no serious or critical accessibility violations", async ({ page }) => {
  const email = `a11y-${Date.now()}@empyrean.test`;
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("A11yPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Marketing Mission Control/ })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious).toEqual([]);
});
