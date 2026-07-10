// spec: specs/checkout.md
// seed: tests/seed.spec.ts

// Q4 finding: checkout is fully blocked for an empty cart. /cart shows the
// empty-cart message with no Checkout button, and hitting /checkout directly
// redirects back to /cart — the app never allows an empty-cart order.

import { test, expect } from '../fixtures';
import { login } from '../../src/actions/login';
import {
  visitCart,
  visitCheckout,
  emptyCartMessage,
  backToInventoryLink,
  checkoutButton,
} from '../../src/actions/checkout';

test.describe('Guest Checkout', () => {
  test('Checkout with an empty cart (edge case)', async ({ app }) => {
    await login(app);

    await visitCart(app);
    await expect(app.page).toHaveURL(/\/cart$/);
    await expect(emptyCartMessage(app)).toBeVisible();
    await expect(backToInventoryLink(app)).toBeVisible();
    await expect(checkoutButton(app)).not.toBeVisible();

    // Direct-route access to checkout is redirected back to the empty cart.
    await visitCheckout(app);
    await expect(app.page).toHaveURL(/\/cart$/);
    await expect(emptyCartMessage(app)).toBeVisible();
  });
});
