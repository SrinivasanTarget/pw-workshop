import { defineConfig, devices } from '@playwright/test';

/**
 * App under test - the deployed workshop app by default.
 * Override with `BASE_URL=... npx playwright test` (e.g. a local build).
 */
const BASE_URL = process.env.BASE_URL ?? 'https://playwright-workshop.pages.dev';

/** See https://playwright.dev/docs/test-configuration. */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,

    /*
     * The workshop app tags elements with `data-test`, not the Playwright
     * default `data-testid`. This makes getByTestId('username') resolve to
     * [data-test="username"].
     */
    testIdAttribute: 'data-test',

    /* Watch the browser during the workshop; run headless in CI. */
    headless: !!process.env.CI,

    /* Debug artifacts. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to broaden coverage during the workshop:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
