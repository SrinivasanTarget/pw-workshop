---
name: playwright-locators
description: Pick locators that survive UI changes and lean on Playwright's auto-waiting to kill flakes. Use when authoring or refactoring a spec, replacing brittle CSS/XPath, or chasing flaky failures.
---

# Locators & auto-wait

Most "flaky" Playwright tests fight the browser instead of describing user intent. Two habits fix 80%:

1. Pick locators the way a screen reader would.
2. Let `expect(locator)` do the waiting - never `sleep`.

## Locator priority

1. `getByRole(role, { name })` - semantics, survives copy changes
2. `getByLabel(text)` - form fields
3. `getByPlaceholder(text)` - when no label
4. `getByText(text)` - non-interactive copy
5. `getByTestId(id)` - explicit contract. **This app tags elements with
   `data-test`**, and `playwright.config.ts` sets `testIdAttribute: 'data-test'`,
   so `getByTestId('username')` resolves to `[data-test="username"]`.
6. ❌ Long CSS chains / positional XPath - selector rot

## Auto-wait rules

- **Never** `page.waitForTimeout()`.
- **Avoid** `waitForLoadState('networkidle')` - flaky on apps with analytics.
- **Never** `.textContent()` + `expect(value).toBe(...)` - bypasses retry. Use `expect(locator).toHaveText(...)`.
- The `await` goes on the assertion, not the value.

## Web-first assertion cheatsheet

```ts
await expect(locator).toBeVisible();
await expect(locator).toHaveText('Products');
await expect(locator).toContainText('$39.95');
await expect(locator).toHaveCount(6);
await expect(page).toHaveURL(/\/inventory$/);
```

## Filter lists, don't index

```ts
const card = page.locator('main > div')
  .filter({ has: page.getByRole('heading', { name, level: 3 }) });
```

You'll build the real version as a small query helper that returns this filtered
Locator (never `.nth()`), so `expect` keeps auto-waiting - see [[test-craftsmanship]]
for where such helpers live.

## Common failure modes

- **Strict-mode violation** → locator matched >1 element. Narrow with `{ name }`, not `.first()`.
- **"Not visible"** → page hasn't navigated. Anchor with `await expect(...).toBeVisible()` first.
- **Login flake** → wait on the *next* page's URL/heading, not a spinner.

Workshop exercises in `WORKSHOP_GUIDE.md`.
