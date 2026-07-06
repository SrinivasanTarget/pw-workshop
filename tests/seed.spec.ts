import { test } from '@playwright/test';

/**
 * Seed scaffold for the Playwright Test Generator agent. It turns a plan in
 * specs/*.md into a real spec, using this file's shape as the starting point.
 * Left skipped and empty on purpose - the agent drives the browser live and
 * writes the actual test body (and its own spec files under tests/).
 */
test.describe('Seed', () => {
  test.skip('generated from a plan by the generator agent', async () => {
    // generate code here.
  });
});
