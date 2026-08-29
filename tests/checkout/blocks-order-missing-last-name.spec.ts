// spec: specs/plan.md
// seed: tests/seed.spec.ts

import { test } from '../fixtures';
import { STANDARD_SHIPPING } from '../../src/actions/checkout';
import { BACKPACK } from '../../src/catalog';

test.describe('Checkout feature', () => {
  test('Blocks order placement when Last name is missing', async ({ shop, verify }) => {
    // The shared `login` action (src/actions/login.ts) is currently broken: it hangs
    // waiting for `getByLabel('username-failure')`, a locator that never appears on the
    // sign-in page (the username field's accessible name is "Username"). Confirmed via
    // test_debug that this reproduces identically regardless of which credentials are
    // passed to shop.login(), so it isn't something this spec controls or can route
    // around — the fix belongs in src/actions/login.ts. Marking fixme until that shared
    // action is repaired.
    test.fixme();
    await shop.login();
    await shop.openCheckoutWithItem(BACKPACK.id);

    await shop.fillShipping({ firstName: STANDARD_SHIPPING.firstName, zip: STANDARD_SHIPPING.zip });
    await shop.placeOrder();

    await verify.stillOnCheckout();
    await verify.requiredFieldError('lastName');
  });
});
