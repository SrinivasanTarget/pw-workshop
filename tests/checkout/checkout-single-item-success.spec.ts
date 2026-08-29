// spec: specs/plan.md

import { test } from '../fixtures';
import { STANDARD_SHIPPING } from '../../src/actions/checkout';
import { BACKPACK } from '../../src/catalog';

test.describe('Checkout feature', () => {
  test('Guest can complete checkout with a single item', async ({ shop, verify }) => {
    await shop.login();

    await shop.addToCart(BACKPACK.id);
    await verify.cartCount(1);

    await shop.openCart();
    await verify.cartLineItem(BACKPACK);

    await shop.proceedToCheckout();
    await shop.fillShipping(STANDARD_SHIPPING);
    await verify.orderSummary([BACKPACK]);

    await shop.placeOrder();
    await verify.orderConfirmed();
  });
});
