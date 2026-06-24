/**
 * Profile page — stats, achievements, challenge QR.
 */
import { test, expect } from "@playwright/test";

test.describe("profile page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
  });

  test("renders profile page without crashing", async ({ page }) => {
    await expect(page).toHaveURL(/\/profile/);
  });

  test("shows wins, losses, and win rate stats", async ({ page }) => {
    await expect(page.getByText(/wins/i).first()).toBeVisible();
    await expect(page.getByText(/losses/i).first()).toBeVisible();
    await expect(page.getByText(/win rate/i)).toBeVisible();
  });

  test("shows Challenge Me / QR button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /challenge/i })).toBeVisible();
  });

  test("QR expands and shows copy link button", async ({ page }) => {
    await page.getByRole("button", { name: /challenge/i }).click();
    await expect(page.getByRole("button", { name: /copy link/i })).toBeVisible({ timeout: 3_000 });
  });

  test("shows leaderboard quick link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /leaderboard/i })).toBeVisible();
  });

  test("sign out button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });
});
