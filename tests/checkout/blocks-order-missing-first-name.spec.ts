// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { STANDARD_SHIPPING } from '../../src/actions/checkout';
import { BACKPACK } from '../../src/catalog';

test.describe('Checkout feature', () => {
  test('Blocks order placement when First name is missing', async ({ shop, verify }) => {
    await shop.login();
    await shop.openCheckoutWithItem(BACKPACK.id);

    await shop.fillShipping({ lastName: STANDARD_SHIPPING.lastName, zip: STANDARD_SHIPPING.zip });
    await shop.placeOrder();

    await verify.stillOnCheckout();
    await verify.requiredFieldError('firstName');
  });
});
