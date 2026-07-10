// spec: Guest Checkout — Cart badge reflects number of distinct items added
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { BACKPACK, KEYBOARD } from '../../src/catalog';

test.describe('Guest Checkout', () => {
  test('Cart badge reflects number of distinct items added', async ({ page, shop, verify }) => {
    // shop.login() targets a stale `username-failure` label (the shared login
    // helper is out of sync with the current sign-in form), so the standard
    // credentials are submitted here directly against the real "Username"/
    // "Password" fields to get past sign-in for this scenario.
    await page.goto('/login');
    await page.getByLabel('Username').fill('standard_user');
    await page.getByLabel('Password').fill('workshop123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await verify.cartBadgeEmpty();

    await shop.addToCart(BACKPACK.id);
    await verify.cartCount(1);

    await shop.addToCart(KEYBOARD.id);
    await verify.cartCount(2);
  });
});
