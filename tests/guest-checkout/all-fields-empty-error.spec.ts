// spec: specs/checkout.md
// seed: tests/seed.spec.ts

// Q3 finding: when all three shipping fields are blank, the app shows all three
// inline validation errors simultaneously on a single Place order click.

import { test, expect } from '../fixtures';
import { login } from '../../src/actions/login';
import {
  openCheckoutWithItem,
  placeOrder,
  fieldError,
  checkoutHeading,
} from '../../src/actions/checkout';

test.describe('Guest Checkout', () => {
  test('All shipping fields empty — order blocked', async ({ app }) => {
    await login(app);
    await openCheckoutWithItem(app, 'p-001');

    // Submit with every field left blank.
    await placeOrder(app);

    await expect(fieldError(app, 'firstName')).toBeVisible();
    await expect(fieldError(app, 'lastName')).toBeVisible();
    await expect(fieldError(app, 'zip')).toBeVisible();

    // Order blocked — the user stays on the checkout form.
    await expect(app.page).toHaveURL(/\/checkout$/);
    await expect(checkoutHeading(app)).toBeVisible();
  });
});
