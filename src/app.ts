import type { Page } from '@playwright/test';

/**
 * App — the thin facade over the Playwright driver that specs and actions
 * depend on instead of poking `page` globals directly (the Dependency Rule).
 *
 * Today it only exposes `page`; when the suite grows an API surface, a typed
 * `request` client hangs off this same object and existing call sites don't
 * change. The concrete `page` is injected by the `app` fixture (see
 * tests/fixtures.ts), so tests depend on this seam, not on how we reach the
 * browser.
 */
export interface App {
  readonly page: Page;
}

/** Compose an App around a Playwright page. */
export function createApp(page: Page): App {
  return { page };
}
