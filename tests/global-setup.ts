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
    // Write an empty session so unauthenticated tests still run.
    // Authenticated tests will redirect to /login and fail individually.
    fs.writeFileSync(STORAGE_STATE, JSON.stringify({ cookies: [], origins: [] }));
    console.warn("\n⚠️  TEST_USER_EMAIL / TEST_USER_PASSWORD not set — authenticated tests will fail.\n");
    return;
  }

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/home", { timeout: 15_000 });

  // Dismiss the onboarding overlay so it doesn't block test interactions.
  await page.evaluate(() => localStorage.setItem("onboarding_v1_done", "1"));

  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}
