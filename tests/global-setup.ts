import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

export const STORAGE_STATE = path.join(__dirname, ".auth/user.json");

export default async function globalSetup() {
  const email    = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const baseURL  = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

  if (!email || !password) {
    throw new Error("TEST_USER_EMAIL and TEST_USER_PASSWORD must be set.");
  }

  // Ensure the directory exists
  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });

  const browser = await chromium.launch();
  const page    = await browser.newPage();

  await page.goto(`${baseURL}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/home", { timeout: 15_000 });

  await page.context().storageState({ path: STORAGE_STATE });
  await browser.close();
}
