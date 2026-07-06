import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Reference Page Object for the TodoMVC demo app.
 * Demonstrates the conventions in SKILL.md:
 *  - private readonly locators set in the constructor
 *  - role/placeholder-based locators
 *  - methods that model user intent
 *  - state exposed via locators/getters; assertions stay in the test
 */
export class TodoPage {
  private readonly newTodoInput: Locator;
  private readonly todoItems: Locator;

  constructor(private readonly page: Page) {
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.locator('.todo-list li');
  }

  async goto(): Promise<void> {
    // Relative URL - baseURL lives in playwright.config.ts
    await this.page.goto('#/');
  }

  async addTodo(text: string): Promise<void> {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  async toggleComplete(text: string): Promise<void> {
    await this.itemByText(text).getByRole('checkbox').check();
  }

  /** Exposed state for the test to assert on - no expect() lives here. */
  get items(): Locator {
    return this.todoItems;
  }

  itemByText(text: string): Locator {
    return this.todoItems.filter({ hasText: text });
  }
}

/*
Example spec using the page object (would live in tests/, ideally via a fixture):

import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/todo.page';

test('adds a todo to the list', async ({ page }) => {
  const todo = new TodoPage(page);
  await todo.goto();

  await test.step('add a todo', async () => {
    await todo.addTodo('Buy milk');
  });

  await expect(todo.items).toHaveText(['Buy milk']);
});
*/
