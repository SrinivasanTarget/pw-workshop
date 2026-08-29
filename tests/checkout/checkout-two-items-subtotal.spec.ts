// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { STANDARD_SHIPPING } from '../../src/actions/checkout';
import { BACKPACK, KEYBOARD } from '../../src/catalog';

test.describe('Checkout feature', () => {
  test('Guest can complete checkout with two items and correct subtotal', async ({ shop, verify }) => {
    const cart = [BACKPACK, KEYBOARD];

    await shop.login();

    await shop.addItems(cart);
    await verify.cartCount(2);

    await shop.openCart();
    for (const product of cart) await verify.cartLineItem(product);

    await shop.proceedToCheckout();
    await shop.fillShipping(STANDARD_SHIPPING);
    await verify.orderSummary(cart);

    await shop.placeOrder();
    await verify.orderConfirmed();
  });
});
