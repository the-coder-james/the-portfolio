// Browser tests (QA plan E2E-*) against the production build served by
// `astro preview`. The build is dist-e2e/, made with a test GTM container ID
// (npm run build:e2e) so the consent banner exists; every test stubs or
// blocks requests that would leave the machine (tests/e2e/helpers/fixtures.ts).
// Port 4410, never 4321: that is the dev server's.
import { defineConfig, devices } from "@playwright/test";

const BASE = "http://localhost:4410/the-portfolio/";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Flakes are fixed, not retried.
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    serviceWorkers: "block",
  },
  webServer: {
    command: "npm run preview:e2e",
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      // Phone width puts the page in scroll mode (<= 640px).
      name: "phone",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
});
