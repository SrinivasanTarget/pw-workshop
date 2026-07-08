import { test, expect } from '../fixtures';

test.describe('Guest Checkout', () => {
  test('Successful checkout - single item', async ({ page }) => {
    // Navigate to localhost:5173/inventory
    await page.goto('/inventory');

    // App requires authentication before inventory is reachable
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('workshop123');
    await page.locator('[data-test="login-submit"]').click();

    // Click the 'Add to cart' button on the Workshop Backpack item
    await page.locator('[data-test="add-p-001"]').click();

    // Click the 'Cart' link in the header
    await page.getByRole('link', { name: 'Cart1' }).click();

    // Click the 'Checkout' button
    await page.locator('[data-test="checkout"]').click();

    // Fill the First name field with 'Ada'
    await page.locator('[data-test="firstName"]').fill('Ada');

    // Fill the Last name field with 'Lovelace'
    await page.locator('[data-test="lastName"]').fill('Lovelace');

    // Fill the ZIP field with '00001'
    await page.locator('[data-test="zip"]').fill('00001');

    // Click the 'Place order' button
    await page.locator('[data-test="place-order"]').click();

    // Verify the heading 'Thanks for your order' is visible
    await expect(page.locator('[data-test="thank-you"]')).toBeVisible();

    // Verify the 'Continue shopping' link is visible
    await expect(page.getByRole('link', { name: 'Continue shopping' })).toBeVisible();
  });
});
