/**
 * Runs once before all authenticated tests.
 * Logs in with TEST_USER_EMAIL / TEST_USER_PASSWORD and saves the session.
 */
import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD must be set to run authenticated tests."
    );
  }

  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(email);
  await page.getByRole("textbox", { name: /password/i }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // window.location.href redirect — wait for navigation to /home
  await page.waitForURL("**/home", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/home/);

  await page.context().storageState({ path: STORAGE_STATE });
});
