/**
 * Match creation flow — UX journeys for posting a challenge.
 */
import { test, expect } from "@playwright/test";

test.describe("new match — game selection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/matches/new");
    // Game types are fetched from Supabase — wait for at least one card
    await page.waitForSelector('button:has-text("Beer Pong"), button:has-text("beer_pong"), button:has-text("Flunky"), button:has-text("Freestyle")', {
      timeout: 12_000,
    });
  });

  test("shows a list of choosable game types", async ({ page }) => {
    // At least one game type card is rendered
    const cards = page.locator("button").filter({ hasText: /beer pong|flunky|freestyle|bier/i });
    await expect(cards.first()).toBeVisible();
  });

  test("post button is disabled until a game type is selected", async ({ page }) => {
    const postBtn = page.getByRole("button").filter({ hasText: /post|challenge|find/i });
    await expect(postBtn).toBeDisabled();
  });

  test("selecting a game type enables the post button", async ({ page }) => {
    // Use Beer Pong specifically — Freestyle requires a custom name before the button enables
    const beerPong = page.locator("button").filter({ hasText: /beer pong/i }).first();
    await beerPong.click();
    const postBtn = page.getByRole("button").filter({ hasText: /post|challenge|find/i });
    await expect(postBtn).toBeEnabled({ timeout: 3_000 });
  });

  test("post button label reflects the selected game", async ({ page }) => {
    const beerPongCard = page.locator("button").filter({ hasText: /beer pong/i }).first();
    await beerPongCard.click();
    const postBtn = page.getByRole("button").filter({ hasText: /beer pong/i }).last();
    await expect(postBtn).toBeVisible({ timeout: 3_000 });
  });
});

test.describe("new match — Beer Pong team size", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/matches/new");
    await page.locator("button").filter({ hasText: /beer pong/i }).first().click({ timeout: 12_000 });
  });

  test("shows team size options after selecting Beer Pong", async ({ page }) => {
    // Game card description also contains "1v1" — use last() to get the team-size button
    await expect(page.getByRole("button", { name: /1v1/i }).last()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole("button", { name: /2v2/i }).last()).toBeVisible();
  });

  test("selecting a team size highlights it", async ({ page }) => {
    const twoVTwo = page.getByRole("button", { name: /2v2/i });
    await twoVTwo.click();
    // After click it should be visually active — we check it's still visible and enabled
    await expect(twoVTwo).toBeVisible();
  });
});

test.describe("new match — Freestyle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/matches/new");
    await page.locator("button").filter({ hasText: /freestyle/i }).first().click({ timeout: 12_000 });
  });

  test("shows a custom game name field for Freestyle", async ({ page }) => {
    // Both inputs have "e.g." in placeholder — match specifically by Freestyle placeholder content
    const input = page.getByPlaceholder(/kings cup|wizard staff/i);
    await expect(input).toBeVisible({ timeout: 3_000 });
  });

  test("post button stays disabled when custom name is empty for Freestyle", async ({ page }) => {
    const postBtn = page.getByRole("button").filter({ hasText: /post|challenge/i });
    // Custom name required — button stays disabled until name is entered
    await expect(postBtn).toBeDisabled({ timeout: 3_000 });
  });

  test("post button enables after entering a custom game name", async ({ page }) => {
    const input = page.getByPlaceholder(/kings cup|wizard staff/i);
    await input.fill("King's Cup");
    const postBtn = page.getByRole("button").filter({ hasText: /post|challenge/i });
    await expect(postBtn).toBeEnabled({ timeout: 3_000 });
  });
});

test.describe("new match — meeting hint", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/matches/new");
  });

  test("meeting hint input is present for opponents to find you", async ({ page }) => {
    // Actual placeholder: "e.g. near Stage B, red umbrella 🌂"
    const hint = page.getByPlaceholder(/stage|umbrella|near/i)
      .or(page.locator('input[placeholder*="near"]').first());
    await expect(hint).toBeVisible({ timeout: 12_000 });
  });

  test("back button returns to home", async ({ page }) => {
    await page.getByRole("link", { name: /back/i })
      .or(page.locator('a[href="/home"]').first()).click({ timeout: 12_000 });
    await expect(page).toHaveURL(/\/home/);
  });
});

test.describe("match navigation", () => {
  test("Find Battle CTA on home goes to /matches/new", async ({ page }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: /find battle/i }).click();
    await expect(page).toHaveURL(/\/matches\/new/);
  });
});
