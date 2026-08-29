/**
 * The workshop store's product catalog — one place for the id/name/price facts
 * the specs assert on, so a price or name change touches a single line (DRY).
 * Passing a `Product` keeps expectation helpers to a single meaningful argument
 * instead of an (id, name, price) triple.
 */
export interface Product {
  readonly id: string;
  readonly name: string;
  /** Price in dollars. Displayed via `usd()` so specs never hardcode `'$29.99'`. */
  readonly price: number;
}

export const BACKPACK: Product = { id: 'p-001', name: 'Workshop Backpack', price: 29.99 };
export const KEYBOARD: Product = { id: 'p-002', name: 'Mechanical Keyboard', price: 89.5 };
