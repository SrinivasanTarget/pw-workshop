// spec: specs/checkout.md
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures';
import { login } from '../../src/actions/login';
import {
  openCheckoutWithItem,
  fillShipping,
  placeOrder,
  fieldError,
  checkoutHeading,
  STANDARD_SHIPPING,
} from '../../src/actions/checkout';

test.describe('Guest Checkout', () => {
  test('Empty ZIP shows validation error', async ({ app }) => {
    await login(app);
    await openCheckoutWithItem(app, 'p-001');

    await fillShipping(app, { firstName: STANDARD_SHIPPING.firstName, lastName: STANDARD_SHIPPING.lastName });
    await placeOrder(app);

    await expect(fieldError(app, 'zip')).toBeVisible();
    await expect(fieldError(app, 'zip')).toHaveText('ZIP / postal code is required');

    // Order blocked — the user stays on the checkout form.
    await expect(app.page).toHaveURL(/\/checkout$/);
    await expect(checkoutHeading(app)).toBeVisible();
  });
});
