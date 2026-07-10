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
  test('Empty First name shows validation error', async ({ app }) => {
    await login(app);
    await openCheckoutWithItem(app, 'p-001');

    await fillShipping(app, { lastName: STANDARD_SHIPPING.lastName, zip: STANDARD_SHIPPING.zip });
    await placeOrder(app);

    await expect(fieldError(app, 'firstName')).toBeVisible();
    await expect(fieldError(app, 'firstName')).toHaveText('First name is required');

    // Order blocked — the user stays on the checkout form.
    await expect(app.page).toHaveURL(/\/checkout$/);
    await expect(checkoutHeading(app)).toBeVisible();
  });
});
