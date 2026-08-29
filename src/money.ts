import type { Product } from './catalog';

/**
 * Money helpers the tests own — one place to turn catalog prices into the
 * amounts the checkout should display, so specs assert *that the price is right
 * for these items* instead of hardcoding magic strings like `'$119.49'`.
 *
 * The tax rate lives here, independent of the app's own rate, so a drift in the
 * app's tax logic still fails the assertion (the test isn't reusing the code it
 * verifies).
 */
export const TAX_RATE = 0.08;

/** Round to whole cents, avoiding binary float drift (e.g. 9.5592 → 9.56). */
function toCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/** Format a dollar amount as the app shows it, e.g. `29.99` → `'$29.99'`. */
export function usd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export interface PriceBreakdown {
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
}

/** The expected subtotal / tax / total for a cart of products (items-only subtotal). */
export function priceCart(products: readonly Product[]): PriceBreakdown {
  const subtotal = toCents(products.reduce((sum, product) => sum + product.price, 0));
  const tax = toCents(subtotal * TAX_RATE);
  const total = toCents(subtotal + tax);
  return { subtotal, tax, total };
}
