import { test as base, expect } from '@playwright/test';
import { createApp, type App } from '../src/app';
import { login, type Credentials } from '../src/actions/login';
import {
  addToCart,
  addItems,
  openCart,
  proceedToCheckout,
  fillShipping,
  placeOrder,
  openCheckoutWithItem,
  visitCheckout,
  type ShippingDetails,
  type ShippingField,
} from '../src/actions/checkout';
import {
  expectOnInventory,
  expectCartCount,
  expectCartBadgeEmpty,
  expectCartLineItem,
  expectCartTotal,
  expectCheckoutAvailable,
  expectOrderSummary,
  expectOrderConfirmed,
  expectCartPageEmpty,
  expectRedirectedToCart,
  expectShippingFormEmpty,
  expectStillOnCheckout,
  expectRequiredFieldError,
  expectNoFieldError,
} from '../src/expectations/checkout';
import type { Product } from '../src/catalog';

/**
 * The composition root wires the App into two intent-named namespaces so specs
 * never thread `app` through every call (DI). `shop` is the actions/commands a
 * shopper performs; `verify` is the web-first assertions. The split keeps
 * *doing* and *checking* on separate seams (SRP) and reads as prose:
 * `await shop.addItems(...)`, `await verify.orderConfirmed()`. Delegation lives
 * here in the wiring layer, not as an extra abstraction in the domain.
 */
function createShop(app: App) {
  return {
    login: (credentials?: Credentials) => login(app, credentials),
    addToCart: (productId: string) => addToCart(app, productId),
    addItems: (products: readonly Product[]) => addItems(app, products),
    openCart: () => openCart(app),
    proceedToCheckout: () => proceedToCheckout(app),
    fillShipping: (details: ShippingDetails) => fillShipping(app, details),
    placeOrder: () => placeOrder(app),
    openCheckoutWithItem: (productId: string) => openCheckoutWithItem(app, productId),
    visitCheckout: () => visitCheckout(app),
  };
}

function createVerify(app: App) {
  return {
    onInventory: () => expectOnInventory(app),
    cartCount: (count: number) => expectCartCount(app, count),
    cartBadgeEmpty: () => expectCartBadgeEmpty(app),
    cartLineItem: (product: Product) => expectCartLineItem(app, product),
    cartTotal: (products: readonly Product[]) => expectCartTotal(app, products),
    checkoutAvailable: () => expectCheckoutAvailable(app),
    orderSummary: (products: readonly Product[]) => expectOrderSummary(app, products),
    orderConfirmed: () => expectOrderConfirmed(app),
    cartPageEmpty: () => expectCartPageEmpty(app),
    redirectedToCart: () => expectRedirectedToCart(app),
    shippingFormEmpty: () => expectShippingFormEmpty(app),
    stillOnCheckout: () => expectStillOnCheckout(app),
    requiredFieldError: (field: ShippingField) => expectRequiredFieldError(app, field),
    noFieldError: (field: ShippingField) => expectNoFieldError(app, field),
  };
}

export type Shop = ReturnType<typeof createShop>;
export type Verify = ReturnType<typeof createVerify>;

/**
 * Network evidence for failure triage (Module 9).
 *
 * Records every failed request and every HTTP >= 400 response during a test.
 * When the test fails, the log is attached to the report as
 * `network-failures.txt`, tagged [first-party] (same origin as baseURL) or
 * [third-party]. The triage agent uses this to tell "the app misbehaved"
 * apart from "an external dependency or the environment misbehaved" — the
 * browser-level error message alone can't make that call.
 *
 * CI notes: evidence is kept in memory (no temp files, no $DISPLAY) and only
 * written into the report as an attachment on failure, so it behaves
 * identically headed (workshop laptops) and headless (CI). Attachments with a
 * `body` are embedded in the JSON report, so they travel with the CI artifact
 * without any extra upload path. The fixture runs per attempt, so with
 * `retries: 2` in CI you get evidence from each failing attempt.
 *
 * Specs import { test, expect } from this file instead of '@playwright/test'.
 * tests/seed.spec.ts is the exception — it stays on '@playwright/test' so the
 * playwright-test MCP attach flow is untouched.
 */

/** Hard cap so a redirect loop or a hammering retry can't grow the log unbounded. */
const MAX_ENTRIES = 100;

export const test = base.extend<{ _networkEvidence: void; app: App; shop: Shop; verify: Verify }>({
  /** The App facade, injected into specs (DI). Composed on the base `page`. */
  app: async ({ page }, use) => {
    await use(createApp(page));
  },

  /** Actions bound to this test's App — the commands a shopper performs. */
  shop: async ({ app }, use) => {
    await use(createShop(app));
  },

  /** Assertions bound to this test's App — web-first checks, read as `verify.x()`. */
  verify: async ({ app }, use) => {
    await use(createVerify(app));
  },

  _networkEvidence: [
    async ({ page, baseURL }, use, testInfo) => {
      const entries: string[] = [];
      const firstParty = baseURL ? new URL(baseURL).origin : undefined;

      const originLabel = (url: string): string => {
        if (!firstParty) return '';
        try {
          return new URL(url).origin === firstParty ? ' [first-party]' : ' [third-party]';
        } catch {
          return '';
        }
      };

      page.on('requestfailed', (request) => {
        if (entries.length >= MAX_ENTRIES) return;
        const reason = request.failure()?.errorText ?? 'request failed';
        entries.push(`${request.method()} ${request.url()} — ${reason}${originLabel(request.url())}`);
      });

      page.on('response', (response) => {
        if (entries.length >= MAX_ENTRIES) return;
        if (response.status() >= 400) {
          entries.push(
            `${response.request().method()} ${response.url()} — HTTP ${response.status()}${originLabel(response.url())}`
          );
        }
      });

      await use();

      if (testInfo.status !== testInfo.expectedStatus && entries.length > 0) {
        await testInfo.attach('network-failures.txt', {
          body: entries.join('\n'),
          contentType: 'text/plain',
        });
      }
    },
    { auto: true },
  ],
});

export { expect };
