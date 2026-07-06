import { type App } from '../app';

/**
 * Sign in through the UI. A function named for business intent, not mechanics -
 * every test that needs a session reuses this one place (DRY). Add new actions
 * (addToCart, sortBy, ...) as sibling functions here; keep each doing one thing.
 */
export async function login(app: App, username: string, password: string): Promise<void> {
  await app.page.goto('/login');
  await app.page.getByLabel('Username').fill(username);
  await app.page.getByLabel('Password').fill(password);
  await app.page.getByRole('button', { name: 'Sign in' }).click();
}
