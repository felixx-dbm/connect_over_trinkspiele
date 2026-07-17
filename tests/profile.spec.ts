/**
 * Profile page — stats, challenge QR, settings access, sign-out.
 */
import { test, expect } from "@playwright/test";

test.describe("profile overview", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });
  });

  test("shows the user's username prominently", async ({ page }) => {
    // Username heading — not generic placeholder text
    const heading = page.getByRole("heading").filter({ hasNotText: /your profile|profile/i }).first();
    await expect(heading).toBeVisible();
  });

  test("displays wins, losses, and win-rate stats", async ({ page }) => {
    await expect(page.getByText(/wins/i).first()).toBeVisible();
    await expect(page.getByText(/losses/i).first()).toBeVisible();
    await expect(page.getByText(/win rate/i)).toBeVisible();
  });

  test("leaderboard link is visible and navigates correctly", async ({ page }) => {
    const link = page.getByRole("link", { name: /leaderboard/i });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/leaderboard/);
  });

  test("settings gear navigates to /settings", async ({ page }) => {
    // Two a[href="/settings"] links on the page (gear icon + nav row) — use first
    const settingsLink = page.locator('a[href="/settings"]').first();
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/);
  });
});

test.describe("challenge QR", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });
  });

  test("Challenge Me button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /challenge/i })).toBeVisible();
  });

  test("tapping Challenge Me reveals a shareable link or QR code", async ({ page }) => {
    await page.getByRole("button", { name: /challenge/i }).click();
    // Either a copy link button or a QR canvas/image should appear
    const copyBtn = page.getByRole("button", { name: /copy/i });
    const qr = page.locator("canvas, img[alt*='QR'], svg[data-testid*='qr']");
    await expect(copyBtn.or(qr).first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("crew membership banner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });
  });

  test("crew section links to /crews", async ({ page }) => {
    const crewLink = page.getByRole("link", { name: /crew/i })
      .or(page.locator('a[href="/crews"]'));
    // Only assert if crew link is present (user may not be in a crew)
    const isVisible = await crewLink.isVisible().catch(() => false);
    if (isVisible) {
      await crewLink.click();
      await expect(page).toHaveURL(/\/crews/);
    }
  });
});

test.describe("sign out", () => {
  test("sign out button is present on profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("button", { name: /sign out|log out/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("signing out redirects to login and prevents accessing home", async ({ page }) => {
    // Clear cookies instead of calling the sign-out API so the shared Supabase
    // session token stays valid for tests that run after this one (CI uses 1
    // worker, so profile runs before settings — a server-side signOut() would
    // revoke the token and kill every subsequent authenticated test).
    await page.context().clearCookies();
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
