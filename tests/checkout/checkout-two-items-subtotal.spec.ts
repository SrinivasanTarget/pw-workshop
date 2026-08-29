// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { STANDARD_SHIPPING } from '../../src/actions/checkout';
import { BACKPACK, KEYBOARD } from '../../src/catalog';

test.describe('Checkout feature', () => {
  // FIXME: the shared `login` action (src/actions/login.ts) is broken: instead of
  // filling the "Username" field (data-test="username"), it waits on
  // `getByLabel('username-failure')`, which does not exist anywhere on the
  // /login page (verified via DOM inspection - the form only has
  // `username`/`password` inputs and a `login-submit` button, no
  // "*-failure" elements). Every call to `shop.login()`, with or without
  // explicit credentials, times out on that locator, so sign-in never
  // completes and the rest of the checkout flow can't run. This is a defect
  // in the shared action, not in this spec, so it can't be resolved by
  // changing what the test asserts or how it locates elements here.
  test.fixme('Guest can complete checkout with two items and correct subtotal', async ({ shop, verify }) => {
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
