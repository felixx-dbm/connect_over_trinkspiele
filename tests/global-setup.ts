import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

export const STORAGE_STATE = path.join(__dirname, ".auth/user.json");

export default async function globalSetup() {
  const email    = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const baseURL  = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  if (!email || !password) {
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    console.warn("\n⚠️  TEST_USER_EMAIL / TEST_USER_PASSWORD not set — authenticated tests will fail.\n");
    return;
  }

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  try {
    await page.goto(`${baseURL}/login`);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();

    // 45 s gives Supabase room on CI even without sleeping.
    // If this times out the screenshot below will show what's on screen
    // (wrong credentials → error message, misconfigured secrets → blank page, etc.).
    await page.waitForURL("**/home", { timeout: 45_000 });

    await page.evaluate(() => localStorage.setItem("onboarding_v1_done", "1"));
    await page.context().storageState({ path: STORAGE_STATE });
  } catch (err) {
    fs.mkdirSync("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/global-setup-failure.png", fullPage: true });
    console.error("\n🔴 Global setup failed. Screenshot saved to test-results/global-setup-failure.png");
    console.error("   Current URL:", page.url());
    throw err;
  } finally {
    await browser.close();
  }
}
