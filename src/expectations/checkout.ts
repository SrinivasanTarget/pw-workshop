import { expect } from '@playwright/test';
import type { App } from '../app';
import type { Product } from '../catalog';
import { priceCart, usd } from '../money';
import {
  inventoryHeading,
  cartBadge,
  cartLink,
  cartLineItem,
  cartTotal,
  cartPageHeading,
  emptyCart,
  backToInventoryLink,
  checkoutButton,
  checkoutHeading,
  checkoutForm,
  shippingField,
  orderSummaryItem,
  summarySubtotal,
  summaryTax,
  summaryTotal,
  orderConfirmation,
  orderId,
  continueShoppingLink,
  fieldError,
  type ShippingField,
} from '../actions/checkout';

/**
 * Guest-checkout expectations — the suite's verification vocabulary. Each helper
 * names one thing the shopper should observe and answers it with a web-first
 * `expect` (auto-waiting preserved), so specs read as pure scenario intent with
 * no locators or assertion plumbing. Locators come from the checkout query
 * layer, so this module owns *what to verify*, not *how to find it* (SRP + the
 * Dependency Rule).
 */

/** The shopper has landed on the product inventory. */
export async function expectOnInventory(app: App): Promise<void> {
  await expect(inventoryHeading(app)).toBeVisible();
}

/** The cart holds exactly `count` distinct items — badge and header link agree. */
export async function expectCartCount(app: App, count: number): Promise<void> {
  await expect(cartBadge(app)).toHaveText(String(count));
  await expect(cartLink(app)).toHaveAccessibleName(`Cart${count}`);
}

/** The header shows an empty cart — no badge, and the Cart link carries no count. */
export async function expectCartBadgeEmpty(app: App): Promise<void> {
  await expect(cartBadge(app)).not.toBeAttached();
  await expect(cartLink(app)).toHaveAccessibleName('Cart');
}

/** A cart line lists the product with its name and price. */
export async function expectCartLineItem(app: App, product: Product): Promise<void> {
  const line = cartLineItem(app, product.id);
  await expect(line).toContainText(product.name);
  await expect(line).toContainText(usd(product.price));
}

/** The cart's running total equals the items-only subtotal of `products`. */
export async function expectCartTotal(app: App, products: readonly Product[]): Promise<void> {
  await expect(cartTotal(app)).toHaveText(usd(priceCart(products).subtotal));
}

/** Checkout can be started from the cart. */
export async function expectCheckoutAvailable(app: App): Promise<void> {
  await expect(checkoutButton(app)).toBeVisible();
  await expect(checkoutButton(app)).toBeEnabled();
}

/**
 * The checkout order summary lists the given products and the money lines they
 * imply — subtotal, tax and total are derived from the items (see `priceCart`),
 * so a spec states the cart, not frozen dollar strings.
 */
export async function expectOrderSummary(app: App, products: readonly Product[]): Promise<void> {
  await expect(checkoutHeading(app)).toBeVisible();
  for (const product of products) {
    await expect(orderSummaryItem(app, product.name)).toBeVisible();
  }
  const { subtotal, tax, total } = priceCart(products);
  await expect(summarySubtotal(app)).toHaveText(usd(subtotal));
  await expect(summaryTax(app)).toHaveText(usd(tax));
  await expect(summaryTotal(app)).toHaveText(usd(total));
}

/** The order was placed and the confirmation page is shown. */
export async function expectOrderConfirmed(app: App): Promise<void> {
  await expect(app.page).toHaveURL(/\/checkout\/complete$/);
  await expect(orderConfirmation(app)).toHaveText('Thanks for your order');
  await expect(orderId(app)).toContainText('WS-');
  await expect(continueShoppingLink(app)).toHaveAttribute('href', '/inventory');
}

/** On `/cart` with nothing added: the empty-cart state, with checkout unreachable. */
export async function expectCartPageEmpty(app: App): Promise<void> {
  await expect(app.page).toHaveURL(/\/cart$/);
  await expect(cartPageHeading(app)).toBeVisible();
  await expect(emptyCart(app)).toContainText('Your cart is empty.');
  await expect(backToInventoryLink(app)).toHaveAttribute('href', '/inventory');
  await expect(checkoutButton(app)).not.toBeAttached();
}

/** Reaching `/checkout` with an empty cart bounces the shopper back to `/cart`. */
export async function expectRedirectedToCart(app: App): Promise<void> {
  await expect(app.page).toHaveURL(/\/cart$/);
  await expect(emptyCart(app)).toBeVisible();
  await expect(checkoutButton(app)).not.toBeAttached();
}

/** The shipping form is present with every field blank. */
export async function expectShippingFormEmpty(app: App): Promise<void> {
  await expect(checkoutForm(app)).toBeVisible();
  await expect(shippingField(app, 'firstName')).toHaveValue('');
  await expect(shippingField(app, 'lastName')).toHaveValue('');
  await expect(shippingField(app, 'zip')).toHaveValue('');
}

/** The shopper is still on the checkout page — the order was not placed. */
export async function expectStillOnCheckout(app: App): Promise<void> {
  await expect(app.page).toHaveURL(/\/checkout$/);
  await expect(checkoutHeading(app)).toBeVisible();
}

/** The app's copy for each shipping field's required-field error. */
const REQUIRED_FIELD_MESSAGE: Record<ShippingField, string> = {
  firstName: 'First name is required',
  lastName: 'Last name is required',
  zip: 'ZIP / postal code is required',
};

/** A blank shipping field shows its inline required-field error. */
export async function expectRequiredFieldError(app: App, field: ShippingField): Promise<void> {
  await expect(fieldError(app, field)).toHaveText(REQUIRED_FIELD_MESSAGE[field]);
}

/** A shipping field has no inline error — its value was accepted. */
export async function expectNoFieldError(app: App, field: ShippingField): Promise<void> {
  await expect(fieldError(app, field)).not.toBeAttached();
}
