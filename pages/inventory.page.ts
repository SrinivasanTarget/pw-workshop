import { type Locator, type Page } from '@playwright/test';

/**
 * STUB - build this out during the workshop (see WORKSHOP_GUIDE.md exercises and
 * the `playwright-page-object` + `playwright-locators` skills).
 *
 * App: https://playwright-workshop.pages.dev/inventory (visible after login)
 *  - heading "Products" (level 1)
 *  - a "Sort" combobox (data-test="sort"): Name (A–Z) | Name (Z–A) |
 *    Price (low–high) | Price (high–low)
 *  - 6 product cards. Per card: heading (product name, level 3), a price, a
 *    stock label ("In stock" / "Only N left" / "Out of stock"), and an
 *    "Add to cart" button (data-test="add-p-00X").
 *  - Aeropress Go is out of stock -> its button reads "Unavailable" (disabled).
 *  - Known planted bug: the Desk Lamp image points at a 404 (bug-hunting demo).
 */
export class InventoryPage {
  private readonly heading: Locator;
  private readonly sort: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Products', level: 1 });
    // testIdAttribute is 'data-test' (see playwright.config.ts)
    this.sort = page.getByTestId('sort');
  }

  /** Exposed state for the test to assert on - no expect() lives here. */
  get title(): Locator {
    return this.heading;
  }

  // TODO (exercise): filter, don't index. Add:
  //   productCard(name: string): Locator   // filter cards by their heading
  //   addToCart(name: string): Promise<void>
  //   sortBy(option: string): Promise<void> // this.sort.selectOption(...)
  //   get cards(): Locator                  // to assert toHaveCount(6)
}
