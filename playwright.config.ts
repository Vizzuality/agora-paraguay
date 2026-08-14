import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;

/**
 * End-to-end tests. Unit tests live in `tests/unit` and run under Vitest — the two
 * suites never overlap, so `pnpm test` stays fast and `pnpm test:e2e` is the one that
 * needs a browser and a server.
 */
export default defineConfig({
  testDir: "tests/e2e",
  // The specs drive a map: a slow tile fetch should not be read as a failure.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // The dev server, not the built output: it is what a contributor already has running,
    // and `reuseExistingServer` then makes a local run instant.
    command: "pnpm dev",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
