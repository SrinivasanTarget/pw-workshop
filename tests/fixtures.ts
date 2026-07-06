import { test as base, expect } from '@playwright/test';
import { createApp, type App } from '../src/app';

/**
 * The one place Playwright's built-in `page` and `request` fixtures are composed
 * into the `App` facade and injected into tests (Dependency Injection). Tests ask
 * for `app` and get a ready seam - no setup boilerplate, no `new` in the spec.
 * Add shared setup (e.g. an authenticated `app`) here, once.
 */
type Fixtures = {
  app: App;
};

export const test = base.extend<Fixtures>({
  app: async ({ page, request }, use) => {
    await use(createApp(page, request));
  },
});

export { expect };
