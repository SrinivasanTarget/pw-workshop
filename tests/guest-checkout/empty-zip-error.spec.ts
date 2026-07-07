import { test, expect } from '@playwright/test';

test.describe('Guest Checkout', () => {
  test('Empty ZIP shows validation error', async ({ page }) => {
    // Log in as standard_user to access the inventory
    await page.goto('/login');
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('workshop123');
    await page.locator('[data-test="login-submit"]').click();

    // 1. Navigate to localhost:5173/inventory
    await page.goto('/inventory');

    // 2. Click the 'Add to cart' button on the Workshop Backpack item
    await page.locator('[data-test="add-p-001"]').click();

    // 3. Click the 'Cart' link in the header
    await page.getByRole('link', { name: /Cart/ }).click();

    // 4. Click the 'Checkout' button
    await page.locator('[data-test="checkout"]').click();

    // 5. Fill the First name field with 'Ada'
    await page.locator('[data-test="firstName"]').fill('Ada');

    // 6. Fill the Last name field with 'Lovelace'
    await page.locator('[data-test="lastName"]').fill('Lovelace');

    // 7. Leave the ZIP field empty
    // (no action needed - ZIP field remains empty)

    // 8. Click the 'Place order' button
    await page.locator('[data-test="place-order"]').click();

    // Verify the error message 'ZIP / postal code is required' is visible under the ZIP field
    await expect(page.locator('[data-test="error-zip"]')).toBeVisible();
    await expect(page.locator('[data-test="error-zip"]')).toHaveText('ZIP / postal code is required');

    // Verify the user remains on the checkout page
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  });
});
