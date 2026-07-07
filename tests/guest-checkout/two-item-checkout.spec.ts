import { test, expect } from '@playwright/test';

test.describe('Guest Checkout', () => {
  test('Successful checkout - two items', async ({ page }) => {
    // 1. Navigate to localhost:5173/inventory
    await page.goto('/inventory');

    // App requires authentication before inventory is reachable
    await page.locator('[data-test="username"]').fill('standard_user');
    await page.locator('[data-test="password"]').fill('workshop123');
    await page.locator('[data-test="login-submit"]').click();

    // 2. Click the 'Add to cart' button on the Workshop Backpack item
    const backpackCard = page.locator('article, div').filter({ hasText: 'Workshop Backpack' }).first();
    await page.locator('[data-test="add-p-001"]').click();

    // 3. Click the 'Add to cart' button on the Mechanical Keyboard item
    await page.locator('[data-test="add-p-002"]').click();

    // 4. Verify the cart badge shows '2'
    await expect(page.locator('[data-test="cart-badge"]')).toHaveText('2');

    // 5. Click the 'Cart' link in the header
    await page.getByRole('link', { name: /^Cart/ }).click();
    await expect(page).toHaveURL(/\/cart$/);

    // 6. Click the 'Checkout' button
    await page.locator('[data-test="checkout"]').click();
    await expect(page).toHaveURL(/\/checkout$/);

    // 7. Fill the First name field with 'Ada'
    await page.locator('[data-test="firstName"]').fill('Ada');

    // 8. Fill the Last name field with 'Lovelace'
    await page.locator('[data-test="lastName"]').fill('Lovelace');

    // 9. Fill the ZIP field with '00001'
    await page.locator('[data-test="zip"]').fill('00001');

    // Verify the order summary lists 'Workshop Backpack'
    const orderSummary = page.locator('ul').filter({ hasText: 'Workshop Backpack' });
    await expect(orderSummary.getByText('Workshop Backpack')).toBeVisible();

    // Verify the order summary lists 'Mechanical Keyboard'
    await expect(orderSummary.getByText('Mechanical Keyboard')).toBeVisible();

    // Verify the order summary subtotal matches the sum of both item prices
    const backpackPrice = 29.99;
    const keyboardPrice = 89.50;
    const expectedSubtotal = (backpackPrice + keyboardPrice).toFixed(2);
    await expect(page.getByText('Subtotal').locator('..')).toContainText(`$${expectedSubtotal}`);

    // 10. Click the 'Place order' button
    await page.locator('[data-test="place-order"]').click();

    // Verify order completion
    await expect(page).toHaveURL(/\/checkout\/complete$/);
    await expect(page.getByRole('heading', { name: 'Thanks for your order' })).toBeVisible();
  });
});
