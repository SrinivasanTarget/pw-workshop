// spec: specs/plan.md

import { test } from '../fixtures';

test.describe('Checkout feature', () => {
  test('Visiting inventory while logged out redirects to login', async ({ shop, verify }) => {
    await shop.visitInventory();
    await verify.redirectedToLogin();
  });
});
