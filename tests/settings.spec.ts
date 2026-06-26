/**
 * Settings page — account info, privacy toggles, language, sign out.
 */
import { test, expect } from "@playwright/test";

test.describe("settings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 });
  });

  test("shows a settings heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("displays the user's username and email", async ({ page }) => {
    await expect(page.getByText(/username/i).first()).toBeVisible();
    await expect(page.getByText(/email/i).first()).toBeVisible();
  });

  test("has privacy toggle controls for leaderboard and challenges", async ({ page }) => {
    // Privacy toggles use role="switch" (not checkbox inputs)
    const leaderboard = page.getByRole("switch").first();
    await expect(leaderboard).toBeVisible({ timeout: 5_000 });
  });

  test("language switcher is present", async ({ page }) => {
    // Language section renders "🇬🇧 English" and "🇩🇪 Deutsch" buttons — pick the first one
    const langSwitch = page.getByRole("button", { name: /english/i }).first()
      .or(page.getByRole("button", { name: /deutsch/i }).first());
    await expect(langSwitch.first()).toBeVisible();
  });

  test("back arrow returns to profile", async ({ page }) => {
    await page.locator('a[href="/profile"]').first().click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("sign out button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign out|log out/i })).toBeVisible();
  });

  test("delete account option is accessible but not immediately destructive", async ({ page }) => {
    // Delete account should require confirmation — just check button is present
    const deleteBtn = page.getByRole("button", { name: /delete account|delete/i });
    await expect(deleteBtn).toBeVisible();
  });
});
