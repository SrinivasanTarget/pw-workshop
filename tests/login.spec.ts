import { test, expect } from '@playwright/test';

/**
 * Reference spec - the happy-path login. This one passes out of the box and is
 * the anchor for the workshop's first exercises (refactor to a page object,
 * then to a fixture). Everything else in tests/ you'll build live.
 *
 * House style: getByRole / getByLabel over CSS, web-first `expect(locator)`
 * assertions, no manual waits. See the `playwright-locators` skill.
 */
test.describe('Login', () => {
  test('standard_user can sign in', async ({ page }) => {
    // 1. Go to the login page (baseURL is set in playwright.config.ts)
    await page.goto('/login');

    // 2. Fill in credentials (password for every test account is workshop123)
    await page.getByLabel('Username').fill('standard_user');
    await page.getByLabel('Password').fill('workshop123');

    // 3. Submit
    await page.getByRole('button', { name: 'Sign in' }).click();

    // 4. Land on the inventory page
    await expect(page).toHaveURL(/\/inventory$/);
    await expect(
      page.getByRole('heading', { name: 'Products', level: 1 }),
    ).toBeVisible();

    // 5. The header now shows the logged-in user
    await expect(
      page.getByRole('button', { name: 'Logout (standard_user)' }),
    ).toBeVisible();
  });
});
