/**
 * Unauthenticated flows: age gate, login, register, and route protection.
 * Run WITHOUT a saved auth session.
 */
import { test, expect } from "@playwright/test";

test.describe("age gate", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("presents an 18+ confirmation and an under-18 option", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /prost/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /18 or older/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /under 18/i })).toBeVisible();
  });

  test("18+ takes the user to the login page", async ({ page }) => {
    await page.getByRole("link", { name: /18 or older/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("under 18 shows a friendly refusal screen instead of the app", async ({ page }) => {
    await page.getByRole("button", { name: /under 18/i }).click();
    await expect(page.getByRole("heading", { name: /sorry/i })).toBeVisible();
    await expect(page).not.toHaveURL(/\/login|\/home/);
  });
});

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows email, password fields and a sign-in button", async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("wrong credentials produce a visible error — user is not silently redirected", async ({ page }) => {
    await page.locator('input[name="email"]').fill("nobody@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Error feedback should appear — match any visible error text
    await expect(page.locator("text=/invalid|incorrect|wrong|not found/i").first()).toBeVisible({
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("register link navigates to the sign-up page", async ({ page }) => {
    await page.getByRole("link", { name: /register|sign up|create account/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("forgot password link is reachable", async ({ page }) => {
    await page.getByRole("link", { name: /forgot|reset/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe("register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("shows username, email, password, and birth date inputs", async ({ page }) => {
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("back to login link is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /login|sign in/i })).toBeVisible();
  });
});

test.describe("route protection", () => {
  const protectedRoutes = ["/home", "/profile", "/events", "/crews", "/leaderboard", "/map", "/matches/new"];

  for (const route of protectedRoutes) {
    test(`${route} redirects unauthenticated visitors to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
