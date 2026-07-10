// spec: specs/checkout.md
// seed: tests/seed.spec.ts

// Q2 finding: the cart badge counts distinct items added — two distinct products
// show "2", not "4". The badge is absent from the DOM while the cart is empty and
// appears with the count once items are added.

import { test, expect } from '../fixtures';
import { login } from '../../src/actions/login';
import { addToCart, cartLink, cartBadge } from '../../src/actions/checkout';

test.describe('Guest Checkout', () => {
  test('Cart badge reflects number of items added', async ({ app }) => {
    await login(app);
    await expect(cartLink(app)).toBeVisible();
    await expect(cartBadge(app)).not.toBeVisible();

    await addToCart(app, 'p-001');
    await expect(cartBadge(app)).toHaveText('1');

    await addToCart(app, 'p-002');
    await expect(cartBadge(app)).toHaveText('2');
  });
});
