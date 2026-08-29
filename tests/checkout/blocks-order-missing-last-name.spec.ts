// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { STANDARD_SHIPPING } from '../../src/actions/checkout';
import { BACKPACK } from '../../src/catalog';

test.describe('Checkout feature', () => {
  test('Blocks order placement when Last name is missing', async ({ shop, verify }) => {
    await shop.login();
    await shop.openCheckoutWithItem(BACKPACK.id);

    await shop.fillShipping({ firstName: STANDARD_SHIPPING.firstName, zip: STANDARD_SHIPPING.zip });
    await shop.placeOrder();

    await verify.stillOnCheckout();
    await verify.requiredFieldError('lastName');
  });
});
