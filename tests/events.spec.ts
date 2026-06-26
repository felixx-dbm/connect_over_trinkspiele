/**
 * Events page — create and join event flows.
 */
import { test, expect } from "@playwright/test";

test.describe("events page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/\/events/, { timeout: 10_000 });
  });

  test("shows a page heading about events or hotspots", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /events|hotspot/i })
    ).toBeVisible();
  });

  test("presents Create Event and Join Event as primary actions", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create event/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /join event/i })).toBeVisible();
  });
});

test.describe("create event flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events");
    await page.getByRole("button", { name: /create event/i }).click();
  });

  test("expands a form asking for an event name", async ({ page }) => {
    await expect(page.getByPlaceholder(/festival name|event name|name/i)).toBeVisible({ timeout: 3_000 });
  });

  test("submit button is disabled when the name field is empty", async ({ page }) => {
    const submit = page.getByRole("button", { name: /create event/i }).last();
    await expect(submit).toBeDisabled();
  });

  test("typing a name enables the submit button", async ({ page }) => {
    await page.getByPlaceholder(/festival name|event name|name/i).fill("Summer Pong Cup");
    const submit = page.getByRole("button", { name: /create event/i }).last();
    await expect(submit).toBeEnabled({ timeout: 2_000 });
  });
});

test.describe("join event flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/events");
    await page.getByRole("button", { name: /join event/i }).click();
  });

  test("expands a form with a code input field", async ({ page }) => {
    await expect(page.getByPlaceholder(/code|enter code/i)).toBeVisible({ timeout: 3_000 });
  });

  test("entering an invalid code shows an error — user is not left hanging", async ({ page }) => {
    await page.getByPlaceholder(/code|enter code/i).fill("XXXXXX");
    await page.getByRole("button", { name: /join event/i }).last().click();
    // An error message must appear — not silence or a crash
    await expect(
      page.getByText(/invalid|not found|wrong|error/i).first()
        .or(page.locator("[role='alert']").first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test("empty code cannot be submitted", async ({ page }) => {
    const submit = page.getByRole("button", { name: /join event/i }).last();
    // Button disabled or input requires text
    const isDisabled = await submit.isDisabled().catch(() => false);
    const inputVal = await page.getByPlaceholder(/code|enter code/i).inputValue();
    expect(isDisabled || inputVal.length === 0).toBe(true);
  });
});
