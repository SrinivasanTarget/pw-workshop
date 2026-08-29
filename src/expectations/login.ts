import { expect } from '@playwright/test';
import type { App } from '../app';
import { signInHeading } from '../actions/login';

/**
 * Login expectations — mirrors `src/expectations/checkout.ts`: one place that
 * names what a spec should observe and answers it with a web-first `expect`.
 */

/** An unauthenticated visit was bounced to the login screen. */
export async function expectRedirectedToLogin(app: App): Promise<void> {
  await expect(app.page).toHaveURL(/\/login$/);
  await expect(signInHeading(app)).toBeVisible();
}
