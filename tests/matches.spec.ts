/**
 * Match creation and lobby flow.
 */
import { test, expect } from "@playwright/test";

test.describe("new match page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/matches/new");
  });

  test("renders game type picker", async ({ page }) => {
    // Game types are fetched from Supabase — wait for at least one to appear
    await expect(page.locator('[class*="rounded"]').filter({ hasText: /beer pong|bierpong|ring of fire|bier/i }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("has a submit / challenge button", async ({ page }) => {
    // Button present (may be disabled until game selected)
    const btn = page.getByRole("button").filter({ hasText: /challenge|post|find/i });
    await expect(btn).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("matches list navigation", () => {
  test("bottom nav + CTA navigates to /matches/new", async ({ page }) => {
    await page.goto("/home");
    // The gold CTA button in the nav
    await page.getByRole("link", { name: /new match/i }).click();
    await expect(page).toHaveURL(/\/matches\/new/);
  });
});
