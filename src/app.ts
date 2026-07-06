import { type Page, type APIRequestContext, type Locator } from '@playwright/test';

/**
 * A thin facade over Playwright's `page` and `request`, plus a couple of
 * intention-revealing queries that answer with Locators (so `expect` keeps its
 * web-first auto-waiting). This is the single seam tests talk to: actions in
 * `src/actions` take an `App`; specs read from it. It is deliberately small - no
 * page objects, no actions bundled with locators. Reach for the Screenplay pattern
 * only if this grows a second axis of change (see the `test-craftsmanship` skill).
 */
export interface App {
  readonly page: Page;
  readonly request: APIRequestContext;
  /** A heading by its text, as a Locator to assert on. */
  heading(name: string): Locator;
  /** A button by its accessible name, as a Locator to assert on. */
  button(name: string): Locator;
}

export function createApp(page: Page, request: APIRequestContext): App {
  return {
    page,
    request,
    heading: (name) => page.getByRole('heading', { name }),
    button: (name) => page.getByRole('button', { name }),
  };
}
