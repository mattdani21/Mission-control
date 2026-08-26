// Lighthouse helper: sign up a throwaway user and print the session cookie,
// so the Lighthouse a11y run can scan the authenticated dashboard.
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto("http://localhost:3100/signup");
await page.getByLabel("Email").fill(`lh-${Date.now()}@empyrean.test`);
await page.getByLabel("Password").fill("LighthousePass123!");
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL(/dashboard/);
const cookies = await ctx.cookies();
await browser.close();
console.log(cookies.map((c) => `${c.name}=${c.value}`).join("; "));
