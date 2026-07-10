import { expect } from '@playwright/test';
import type { App } from '../app';

export interface Credentials {
  readonly username: string;
  readonly password: string;
}

/** The workshop's standard shopper. */
export const STANDARD_USER: Credentials = {
  username: 'standard_user',
  password: 'workshop123',
};

/**
 * Log in and wait until the inventory is reached. One responsibility — the
 * login flow — reused by every guest-checkout spec (DRY). Defaults to the
 * standard user; pass credentials to log in as someone else.
 */
export async function login(app: App, credentials: Credentials = STANDARD_USER): Promise<void> {
  const { page } = app;
  await page.goto('/login');
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/inventory$/);
}
