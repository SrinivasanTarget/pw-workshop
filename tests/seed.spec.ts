import { test, expect } from '@playwright/test';

/**
 * Seed file for the Playwright Test Generator agent. The generator uses this as
 * the starting point when turning a test plan (specs/*.md) into a real spec -
 * it drives the browser live and writes the generated code out to tests/.
 * Leave the body empty; the agent fills it in.
 */
test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    // generate code here.
  });
});
