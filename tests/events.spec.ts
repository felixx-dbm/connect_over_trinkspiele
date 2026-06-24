/**
 * Events / Hotspot mode.
 */
import { test, expect } from "@playwright/test";

test.describe("events page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events");
  });

  test("renders events title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /events/i })).toBeVisible();
  });

  test("shows Create Event and Join Event buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create event/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /join event/i })).toBeVisible();
  });

  test("clicking Create Event expands the create form", async ({ page }) => {
    await page.getByRole("button", { name: /create event/i }).click();
    await expect(page.getByPlaceholder(/festival name/i)).toBeVisible();
  });

  test("clicking Join Event expands the join form with code input", async ({ page }) => {
    await page.getByRole("button", { name: /join event/i }).click();
    await expect(page.getByPlaceholder(/enter code/i)).toBeVisible();
  });

  test("join form rejects invalid codes", async ({ page }) => {
    await page.getByRole("button", { name: /join event/i }).click();
    await page.getByPlaceholder(/enter code/i).fill("XXXXXX");
    await page.getByRole("button", { name: /join event/i }).last().click();
    await expect(page.locator('[class*="rose"]').first()).toBeVisible({ timeout: 8_000 });
  });

  test("create form requires a name", async ({ page }) => {
    await page.getByRole("button", { name: /create event/i }).click();
    const submitBtn = page.getByRole("button", { name: /create event/i }).last();
    // Button is disabled when name is empty
    await expect(submitBtn).toBeDisabled();
    await page.getByPlaceholder(/festival name/i).fill("Test Festival");
    await expect(submitBtn).toBeEnabled();
  });
});
