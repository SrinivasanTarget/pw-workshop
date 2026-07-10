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
  orderSummaryItem,
  subtotal,
  orderConfirmation,
  STANDARD_SHIPPING,
} from '../../src/actions/checkout';

test.describe('Guest Checkout', () => {
  test('Successful checkout — two items', async ({ app }) => {
    await login(app);

    await addToCart(app, 'p-001');
    await addToCart(app, 'p-002');
    // Q2: two distinct items → badge shows 2, not 4.
    await expect(cartBadge(app)).toHaveText('2');

    await openCart(app);
    await expect(cartItem(app, 'Workshop Backpack')).toBeVisible();
    await expect(cartItem(app, 'Mechanical Keyboard')).toBeVisible();

    await proceedToCheckout(app);
    await expect(orderSummaryItem(app, 'Workshop Backpack')).toBeVisible();
    await expect(orderSummaryItem(app, 'Mechanical Keyboard')).toBeVisible();
    await expect(subtotal(app, '$119.49')).toBeVisible(); // 29.99 + 89.50

    await fillShipping(app, STANDARD_SHIPPING);
    await placeOrder(app);

    await expect(app.page).toHaveURL(/\/checkout\/complete$/);
    await expect(orderConfirmation(app)).toBeVisible();
  });
});
