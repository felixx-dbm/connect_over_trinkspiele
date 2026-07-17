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

  // Log Supabase errors and browser console errors to help diagnose CI failures
  page.on("response", (res) => {
    if (res.url().includes("supabase") && res.status() >= 400) {
      console.error(`   [supabase] ${res.status()} ${res.url()}`);
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") console.error(`   [browser] ${msg.text()}`);
  });

  try {
    await page.goto(`${baseURL}/login`);

    // fill() waits for the element to be visible and interactive — no extra
    // waitForLoadState needed. (networkidle never fires in Next.js 16 because
    // of persistent prefetch/SSE connections.)
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // 45 s gives Supabase room on CI even without sleeping.
    await page.waitForURL("**/home", { timeout: 45_000 });

    await page.evaluate(() => localStorage.setItem("onboarding_v1_done", "1"));
    await page.context().storageState({ path: STORAGE_STATE });
  } catch (err) {
    // Capture any visible error message on the login page before saving screenshot
    const loginError = await page.locator("text=/network error|invalid|not confirmed|incorrect/i").first().textContent().catch(() => null);
    if (loginError) console.error(`   Login page error: "${loginError.trim()}"`);

    fs.mkdirSync("test-results", { recursive: true });
    await page.screenshot({ path: "test-results/global-setup-failure.png", fullPage: true });
    console.error("\n🔴 Global setup failed. Screenshot saved to test-results/global-setup-failure.png");
    console.error("   Current URL:", page.url());
    throw err;
  } finally {
    await browser.close();
  }
}
