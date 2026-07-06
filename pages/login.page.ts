import { type Locator, type Page } from '@playwright/test';

/**
 * Starter page object for the login screen.
 *
 * This is a workshop starting point - it mirrors tests/login.spec.ts. Your first
 * exercise is to refactor login.spec.ts to use this class, then extend it (see
 * the `playwright-page-object` skill for the house rules).
 *
 * App: https://playwright-workshop.pages.dev/login
 *  - fields expose accessible labels "Username" / "Password"
 *    (also tagged data-test="username" / "password")
 *  - submit button: role button "Sign in" (data-test="login-submit")
 *  - accounts (password `workshop123` for all): standard_user, locked_out_user,
 *    problem_user, glitch_user
 */
export class LoginPage {
  private readonly username: Locator;
  private readonly password: Locator;
  private readonly signIn: Locator;

  constructor(private readonly page: Page) {
    this.username = page.getByLabel('Username');
    this.password = page.getByLabel('Password');
    this.signIn = page.getByRole('button', { name: 'Sign in' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /** User intent, not mechanics. */
  async login(user: string, pass: string): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.signIn.click();
  }

  // TODO (exercise): expose an `error` locator so a negative-path test
  // (e.g. locked_out_user) can assert on it. No expect() lives in here -
  // return locators and let the spec assert.
}
