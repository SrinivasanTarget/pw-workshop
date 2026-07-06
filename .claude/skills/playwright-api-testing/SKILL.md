---
name: playwright-api-testing
description: Mix API calls into Playwright suites - pure API tests via the request fixture and hybrid tests that seed state via API then assert through the UI. Use when login/setup is slow, when verifying side-effects, or for API regression coverage alongside UI.
---

# API testing with Playwright

The `request` fixture is a built-in HTTP client with the same context model as the browser.

## Pure API test

```ts
import { test, expect } from '@playwright/test';

// This app's GET /api/products returns { products: [...] } with 6 items.
test('GET /api/products returns the catalog', async ({ request }) => {
  const res = await request.get('/api/products');
  expect(res.status()).toBe(200);
  const { products } = await res.json();
  expect(products).toHaveLength(6);
});
```

Inherits `baseURL`, sends cookies, supports the same `storageState` as the browser.

## Hybrid test - the speedup

Seed state via API (fast, reliable), assert through the UI (the part you care
about). This app's login is **client-side** (there's no `/api/login`), so the
snippet below is the general pattern - adapt it to whatever real endpoints an app
exposes:

```ts
test('shows order in history', async ({ page, request, credentials }) => {
  const { token } = await (await request.post('/api/login', { data: credentials })).json();
  await request.post('/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
    data: { productId: 'aeropress-go', qty: 1 },
  });

  await page.goto('/orders');
  await expect(page.getByText('Aeropress Go')).toBeVisible();
});
```

Replaces a 30-second click chain with one API call. Less flaky too - fewer UI steps to break.

## Auth strategies

- **Cookie-based** - share `playwright/.auth/user.json` between browser and `request` (see `[[playwright-fixtures-auth]]`).
- **Bearer token** - fixture that hits `/api/login` once, exposes `apiToken`.
- **Separate context** - `playwrightRequest.newContext({ baseURL, extraHTTPHeaders })` when talking to a second API.

## When to pick which

| Verify… | Do it via |
|---|---|
| Button calls the right endpoint with the right payload | UI |
| Endpoint returns the right shape for various inputs | API |
| End-to-end user flow | Hybrid: API setup + UI assertion |
| Backend bug (5xx, validation) | API |
| Layout / a11y | UI |

## Pitfalls

- **`res.json()` on a 500** throws opaque parse errors. Check `res.status()` first.
- **DB-shared state** between tests breaks isolation. Each test creates and cleans its own data.
- **Mixing `request` and `page.request`** - `page.request` shares cookies with the browser context; the top-level `request` is independent. Pick one per test.

Workshop exercises in `WORKSHOP_GUIDE.md`.
