import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// E2E runs against a production build and its own freshly seeded database,
// so test orders never touch your development data.
const env = { DATABASE_URL: "file:./e2e.db", SESSION_SECRET: "e2e-only-secret", UPLOAD_DIR: "./storage/e2e-uploads" };

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    // Requires a production build first (npm run test:e2e does it). DB is reset before start.
    command: `node scripts/e2e-db.mjs && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env,
  },
  projects: [
    { name: "desktop", testIgnore: /screenshots\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet", testIgnore: /screenshots\.spec/, use: { ...devices["Desktop Chrome"], viewport: { width: 834, height: 1112 }, hasTouch: true } },
    { name: "mobile", testIgnore: /screenshots\.spec/, use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } },
    { name: "screenshots", testMatch: /screenshots\.spec/, use: { ...devices["Desktop Chrome"] } },
  ],
});
