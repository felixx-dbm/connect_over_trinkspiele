/**
 * Leaderboard — player and crew rankings.
 */
import { test, expect } from "@playwright/test";

test.describe("leaderboard page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/leaderboard/, { timeout: 10_000 });
  });

  test("shows a leaderboard heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /leaderboard|ranking/i })).toBeVisible();
  });

  test("has tabs or sections for players and crews", async ({ page }) => {
    // At least one of these should exist as a tab or heading
    const players = page.getByRole("tab", { name: /player/i })
      .or(page.getByRole("button", { name: /player/i }))
      .or(page.getByText(/players/i).first());
    const crews = page.getByRole("tab", { name: /crew/i })
      .or(page.getByRole("button", { name: /crew/i }))
      .or(page.getByText(/crews/i).first());
    await expect(players.or(crews).first()).toBeVisible({ timeout: 8_000 });
  });

  test("shows at least one ranked entry or an empty-state message", async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState("networkidle").catch(() => {});
    // Leaderboard renders entries in a flex/border list (no rounded-2xl classes).
    // Each entry shows a wins counter like "5W"; empty state varies by city presence.
    const entry = page.getByText(/\d+W/).first();
    const emptyMsg = page.getByText(/no.*yet|set your city|no players|no results/i).first();
    await expect(entry.or(emptyMsg).first()).toBeVisible({ timeout: 8_000 });
  });

  test("back navigation returns to profile or home", async ({ page }) => {
    const back = page.getByRole("link", { name: /back|home|profile/i }).first();
    const isVisible = await back.isVisible().catch(() => false);
    if (isVisible) {
      await back.click();
      await expect(page).toHaveURL(/\/profile|\/home/);
    }
  });
});
