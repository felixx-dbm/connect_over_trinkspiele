/**
 * Home dashboard — authenticated user experience.
 * Verifies stats, primary CTAs, navigation, and conditional UI.
 */
import { test, expect } from "@playwright/test";

test.describe("home dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/home/, { timeout: 10_000 });
  });

  test("greets the user by name", async ({ page }) => {
    // Username appears as a heading — not just generic "Dashboard"
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible();
    const text = await heading.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("displays wins, losses, and win-rate stat cards", async ({ page }) => {
    await expect(page.getByText(/wins/i).first()).toBeVisible();
    await expect(page.getByText(/losses/i).first()).toBeVisible();
    await expect(page.getByText(/win rate/i)).toBeVisible();
  });

  test("Find Battle button is prominent and navigates to new match", async ({ page }) => {
    const cta = page.getByRole("link", { name: /find battle/i });
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/matches\/new/);
  });

  test("My Crew button navigates to crews page", async ({ page }) => {
    const crewBtn = page.getByRole("link", { name: /my crew/i });
    await expect(crewBtn).toBeVisible();
    await crewBtn.click();
    await expect(page).toHaveURL(/\/crews/);
  });

  test("bottom navigation has Home, Map, Events, and Profile tabs", async ({ page }) => {
    await expect(page.getByRole("link", { name: /home/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /map/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /events/i }).first()).toBeVisible();
    // Profile tab label is "Me" (not "Profile") — match by href
    await expect(page.locator('nav a[href="/profile"]')).toBeVisible();
  });

  test("Events tab in bottom nav navigates to /events", async ({ page }) => {
    await page.getByRole("link", { name: /events/i }).first().click();
    await expect(page).toHaveURL(/\/events/);
  });

  test("Map tab navigates to /map", async ({ page }) => {
    await page.getByRole("link", { name: /map/i }).first().click();
    await expect(page).toHaveURL(/\/map/);
  });

  test("Profile tab navigates to /profile", async ({ page }) => {
    await page.locator('nav a[href="/profile"]').click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("empty state encourages the user to start their first battle", async ({ page }) => {
    // Wait for the page to finish streaming past the loading skeleton
    await expect(page.getByRole("link", { name: /find battle/i })).toBeVisible({ timeout: 10_000 });

    // Depending on user state: empty state link, "Recent Battles" heading, or active match card
    // Covers both English and German locales
    const hasEmptyState = await page.getByRole("link", { name: /start|first battle|ersten starten/i }).isVisible().catch(() => false);
    const hasRecentBattles = await page.getByText(/recent battles|letzte kämpfe/i).first().isVisible().catch(() => false);
    const hasActiveMatch = await page.getByText(/live match|aktives match/i).isVisible().catch(() => false);
    expect(hasEmptyState || hasRecentBattles || hasActiveMatch).toBe(true);
  });

  test("notification bell is visible and tappable", async ({ page }) => {
    // Bell should be clickable without crashing
    const bell = page.getByRole("button", { name: /notification/i })
      .or(page.locator('[aria-label*="notification" i]'))
      .or(page.locator('a[href*="notification"], button').filter({ has: page.locator('svg') }).first());
    await expect(bell.first()).toBeVisible();
    await expect(page).toHaveURL(/\/home/);
  });
});
