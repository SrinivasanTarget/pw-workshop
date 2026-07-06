import { test } from '@playwright/test';

/**
 * Seed test - the attach point for the playwright-test MCP setup tools
 * (planner_setup_page / generator_setup_page). They start the runner, pause
 * inside this test, and hand the live session a blank `page` to drive.
 *
 * Keep it ACTIVE and empty. If it is skipped or missing, setup fails with
 * "seed test not found" and the session cannot attach to a page. The generator
 * writes real specs as NEW files under tests/ - it does not fill this one in.
 */
test('seed', async ({ page }) => {
  // Intentionally empty - the MCP attaches to this test's `page` and drives it
  // from here (the `page` fixture must be used, or setup cannot attach).
  void page;
});
