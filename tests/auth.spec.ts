/**
 * Unauthenticated tests — age gate and login form rendering.
 * These run WITHOUT the saved auth session.
 */
import { test, expect } from "@playwright/test";

test.describe("age gate", () => {
  test("renders the TRINKSPIEL title and 18+ button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /trink/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /18 or older/i })).toBeVisible();
  });

  test("clicking 18+ navigates to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /18 or older/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("under 18 shows sorry screen", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /under 18/i }).click();
    await expect(page.getByRole("heading", { name: /sorry/i })).toBeVisible();
  });
});

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders email and password inputs", async ({ page }) => {
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.locator('input[name="email"]').fill("wrong@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator('[class*="rose"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test("has link to register page", async ({ page }) => {
    await page.getByRole("link", { name: /register/i }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe("middleware auth protection", () => {
  test("redirects /home to /login when not authenticated", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /profile to /login when not authenticated", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /events to /login when not authenticated", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/\/login/);
  });
});
