/**
 * Home page — authenticated user sees their dashboard.
 */
import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home");
  });

  test("renders without crashing", async ({ page }) => {
    await expect(page).toHaveURL(/\/home/);
  });

  test("shows win / loss / win-rate stats", async ({ page }) => {
    // The three stat cards — we just check they exist and aren't empty
    const statCards = page.locator('[class*="rounded-2xl"]').filter({ hasText: /wins|losses|win rate/i });
    await expect(statCards.first()).toBeVisible();
  });

  test("shows quick action buttons", async ({ page }) => {
    await expect(page.getByRole("link", { name: /find battle/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /my crew/i })).toBeVisible();
  });

  test("bottom nav has Events tab", async ({ page }) => {
    await expect(page.getByRole("link", { name: /events/i })).toBeVisible();
  });

  test("bottom nav Events tab navigates to /events", async ({ page }) => {
    await page.getByRole("link", { name: /events/i }).first().click();
    await expect(page).toHaveURL(/\/events/);
  });
});
