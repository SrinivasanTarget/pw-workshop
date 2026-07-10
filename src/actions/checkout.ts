import { expect, type Locator } from '@playwright/test';
import type { App } from '../app';

/**
 * Guest-checkout business actions — the flows the checkout specs share, each one
 * thing and reused (SRP + DRY). Like the `login` action, these depend on the
 * `App` facade rather than poking `page` globals (the Dependency Rule), and the
 * `data-test` / role locators live here in one place instead of copy-pasted
 * across specs. Web-first behavioural assertions stay in the specs; the only
 * `expect`s here are navigation guards that a flow reached its destination —
 * the same pattern `login` uses to wait for `/inventory`.
 */

export interface ShippingDetails {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly zip?: string;
}

/** The workshop's standard shipping details. */
export const STANDARD_SHIPPING: Required<ShippingDetails> = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  zip: '00001',
};

/** Add a product to the cart by its catalog id (e.g. `'p-001'`). */
export async function addToCart(app: App, productId: string): Promise<void> {
  await app.page.getByTestId(`add-${productId}`).click();
}

/**
 * Open the cart via the header Cart link and land on `/cart`. The link's
 * accessible name carries the badge count (e.g. "Cart2"), so match by prefix.
 */
export async function openCart(app: App): Promise<void> {
  const { page } = app;
  await page.getByRole('link', { name: /^Cart/ }).click();
  await expect(page).toHaveURL(/\/cart$/);
}

/** From the cart, proceed to the checkout form and land on `/checkout`. */
export async function proceedToCheckout(app: App): Promise<void> {
  const { page } = app;
  await page.getByTestId('checkout').click();
  await expect(page).toHaveURL(/\/checkout$/);
}

/**
 * Fill the shipping form. Only the fields present in `details` are filled, so
 * omit one to exercise its required-field validation.
 */
export async function fillShipping(app: App, details: ShippingDetails): Promise<void> {
  const { page } = app;
  if (details.firstName !== undefined) await page.getByTestId('firstName').fill(details.firstName);
  if (details.lastName !== undefined) await page.getByTestId('lastName').fill(details.lastName);
  if (details.zip !== undefined) await page.getByTestId('zip').fill(details.zip);
}

/** Submit the order from the checkout form. */
export async function placeOrder(app: App): Promise<void> {
  await app.page.getByTestId('place-order').click();
}

/**
 * Add one product and land on the checkout form ready to submit — the shared
 * setup the validation specs need before they exercise a blank field (DRY). The
 * navigation is incidental to what those specs assert, so it collapses into one
 * intent-named step. The success specs keep the steps granular because for them
 * the navigation *is* the behaviour under test.
 */
export async function openCheckoutWithItem(app: App, productId: string): Promise<void> {
  await addToCart(app, productId);
  await openCart(app);
  await proceedToCheckout(app);
}

/** Navigate straight to `/cart` by URL — used to probe direct-route access. */
export async function visitCart(app: App): Promise<void> {
  await app.page.goto('/cart');
}

/** Navigate straight to `/checkout` by URL — used to probe direct-route access. */
export async function visitCheckout(app: App): Promise<void> {
  await app.page.goto('/checkout');
}

/**
 * Queries — they *answer*, returning a Locator for a spec to assert on
 * (Command-Query Separation). The `data-test` / role locators live here in one
 * place; specs read as intent and keep their web-first `expect`s. A shipping
 * field's inline error is `error-<field>`.
 */
export type ShippingField = keyof Required<ShippingDetails>;

/** The header Cart link (its accessible name carries the badge count). */
export function cartLink(app: App): Locator {
  return app.page.getByRole('link', { name: /^Cart/ });
}

/** The cart-count badge — absent from the DOM while the cart is empty. */
export function cartBadge(app: App): Locator {
  return app.page.getByTestId('cart-badge');
}

/** A line item listed on the cart page, by product name. */
export function cartItem(app: App, name: string): Locator {
  return app.page.getByRole('heading', { name, level: 3 });
}

/** The Checkout form's page heading. */
export function checkoutHeading(app: App): Locator {
  return app.page.getByRole('heading', { name: 'Checkout', level: 1 });
}

/** The Checkout button on the cart page (absent while the cart is empty). */
export function checkoutButton(app: App): Locator {
  return app.page.getByTestId('checkout');
}

/** An item listed in the checkout order summary, by product name. */
export function orderSummaryItem(app: App, name: string): Locator {
  return app.page.getByText(name);
}

/** The order-summary subtotal amount (e.g. `'$29.99'`). */
export function subtotal(app: App, amount: string): Locator {
  return app.page.getByText(amount);
}

/** The inline required-field error for a shipping field. */
export function fieldError(app: App, field: ShippingField): Locator {
  return app.page.getByTestId(`error-${field}`);
}

/** The order-confirmation marker shown on `/checkout/complete`. */
export function orderConfirmation(app: App): Locator {
  return app.page.getByTestId('thank-you');
}

/** The Continue shopping link on the confirmation page. */
export function continueShoppingLink(app: App): Locator {
  return app.page.getByRole('link', { name: 'Continue shopping' });
}

/** The empty-cart message shown on `/cart` when nothing has been added. */
export function emptyCartMessage(app: App): Locator {
  return app.page.getByText('Your cart is empty.');
}

/** The Back to inventory link shown on the empty cart. */
export function backToInventoryLink(app: App): Locator {
  return app.page.getByRole('link', { name: 'Back to inventory' });
}
