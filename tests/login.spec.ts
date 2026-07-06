import { test, expect } from './fixtures';
import { login } from '../src/actions/login';

/**
 * Reads as intent: sign in, then assert on what should be seen. No page objects,
 * no raw locators or `page.` plumbing in the spec - the `login` action owns the
 * mechanics, and assertions stay web-first on the App's query helpers (which return
 * Locators, so `expect` keeps auto-waiting). See the `test-craftsmanship` skill.
 */
test.describe('Login', () => {
  test('standard_user can sign in', async ({ app }) => {
    await login(app, 'standard_user', 'workshop123');

    await expect(app.heading('Products')).toBeVisible();
    await expect(app.button('Logout (standard_user)')).toBeVisible();
  });
});
