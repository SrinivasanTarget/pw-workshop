// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { login } from '../../src/actions/login';
import {
  addToCart,
  openCart,
  proceedToCheckout,
  fillShipping,
  placeOrder,
  cartBadge,
  cartItem,
  checkoutHeading,
  orderSummaryItem,
  subtotal,
  orderConfirmation,
  continueShoppingLink,
  STANDARD_SHIPPING,
} from '../../src/actions/checkout';

test.describe('Guest Checkout', () => {
  test('Successful checkout — single item', async ({ app }) => {
    await login(app);

    await addToCart(app, 'p-001');
    await expect(cartBadge(app)).toHaveText('1');

    await openCart(app);
    await expect(cartItem(app, 'Workshop Backpack')).toBeVisible();

    await proceedToCheckout(app);
    await expect(checkoutHeading(app)).toBeVisible();
    await expect(orderSummaryItem(app, 'Workshop Backpack')).toBeVisible();
    await expect(subtotal(app, '$29.99').first()).toBeVisible();

    await fillShipping(app, STANDARD_SHIPPING);
    await placeOrder(app);

    await expect(app.page).toHaveURL(/\/checkout\/complete$/);
    await expect(orderConfirmation(app)).toBeVisible();
    await expect(continueShoppingLink(app)).toBeVisible();
  });
});
