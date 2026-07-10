// spec: Guest Checkout — Cart badge reflects number of distinct items added
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { BACKPACK, KEYBOARD } from '../../src/catalog';

test.describe('Guest Checkout', () => {
  test('Cart badge reflects number of distinct items added', async ({ shop, verify }) => {
    await shop.login();
    await verify.cartBadgeEmpty();

    await shop.addToCart(BACKPACK.id);
    await verify.cartCount(1);

    await shop.addToCart(KEYBOARD.id);
    await verify.cartCount(2);
  });
});
