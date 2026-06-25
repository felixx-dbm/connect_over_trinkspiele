import { defineConfig, devices } from "@playwright/test";
import path from "path";
import fs from "fs";

// Load .env.test into process.env without overriding existing vars
try {
  const envFile = fs.readFileSync(path.join(__dirname, ".env.test"), "utf8");
  for (const line of envFile.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  }
} catch {}

export const STORAGE_STATE = path.join(__dirname, "tests/.auth/user.json");

export default defineConfig({
  testDir: "./tests",
  testIgnore: /global-setup\.ts/,
  globalSetup: "./tests/global-setup.ts",

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Authenticated tests — use saved session from globalSetup
    {
      name: "chromium",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: STORAGE_STATE,
      },
    },
    // Unauthenticated tests — no session
    {
      name: "chromium-unauth",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
