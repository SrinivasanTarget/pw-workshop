import { expect, type Locator } from '@playwright/test';
import type { App } from '../app';
import type { Product } from '../catalog';

/**
 * Guest-checkout business actions — the flows the checkout specs share, each one
 * thing and reused (SRP + DRY). Like the `login` action, these depend on the
 * `App` facade rather than poking `page` globals (the Dependency Rule), and the
 * `data-test` / role locators live here in one place instead of copy-pasted
 * across specs. Web-first behavioural assertions live in
 * `src/expectations/checkout.ts`; the only `expect`s here are navigation guards
 * that a flow reached its destination — the same pattern `login` uses to wait
 * for `/inventory`.
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
 * Add several catalog products to the cart, in order. Takes a list so a spec
 * scales from two items to ten by extending the array, not by repeating
 * add-and-check lines (DRY). One responsibility — add the given products.
 */
export async function addItems(app: App, products: readonly Product[]): Promise<void> {
  for (const product of products) await addToCart(app, product.id);
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

/** The inventory page heading, shown once the shopper is browsing products. */
export function inventoryHeading(app: App): Locator {
  return app.page.getByRole('heading', { name: 'Products', level: 1 });
}

/** The header Cart link (its accessible name carries the badge count). */
export function cartLink(app: App): Locator {
  return app.page.getByRole('link', { name: /^Cart/ });
}

/** A cart line item by catalog id (e.g. `'p-001'`), carrying its name and price. */
export function cartLineItem(app: App, productId: string): Locator {
  return app.page.getByTestId(`cart-item-${productId}`);
}

/** The cart's running total amount. */
export function cartTotal(app: App): Locator {
  return app.page.getByTestId('cart-total');
}

/** The shipping form on the checkout page. */
export function checkoutForm(app: App): Locator {
  return app.page.getByTestId('checkout-form');
}

/** A shipping input by field name. */
export function shippingField(app: App, field: ShippingField): Locator {
  return app.page.getByTestId(field);
}

/** The order-summary subtotal amount (items only). */
export function summarySubtotal(app: App): Locator {
  return app.page.getByTestId('summary-subtotal');
}

/** The order-summary tax amount. */
export function summaryTax(app: App): Locator {
  return app.page.getByTestId('summary-tax');
}

/** The order-summary grand total. */
export function summaryTotal(app: App): Locator {
  return app.page.getByTestId('summary-total');
}

/** The order reference shown on the confirmation page. */
export function orderId(app: App): Locator {
  return app.page.getByTestId('order-id');
}

/** The cart-count badge — absent from the DOM while the cart is empty. */
export function cartBadge(app: App): Locator {
  return app.page.getByTestId('cart-badge');
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

/** The Back to inventory link shown on the empty cart. */
export function backToInventoryLink(app: App): Locator {
  return app.page.getByRole('link', { name: 'Back to inventory' });
}

/** The cart page's own heading. */
export function cartPageHeading(app: App): Locator {
  return app.page.getByRole('heading', { name: 'Your cart', level: 1 });
}

/** The empty-cart marker shown on `/cart` when nothing has been added. */
export function emptyCart(app: App): Locator {
  return app.page.getByTestId('cart-empty');
}
