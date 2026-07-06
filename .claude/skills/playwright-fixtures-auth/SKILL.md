---
name: playwright-fixtures-auth
description: Build custom Playwright fixtures, skip repeated login with storage state, and keep tests isolated so they run in any order in parallel. Use when tests need auth, share setup, or are slow because every test re-logs-in.
---

# Fixtures, auth & test isolation

`tests/fixtures.ts` already injects an `app` facade - that *is* Dependency Injection
(see [[test-craftsmanship]]). During the workshop you build on it:
- an **authenticated** `app` fixture, composed on top of the base `app`
- a storage-state reuse test across isolated contexts

> This app's login is **client-side** - the session lives in `localStorage`, not a
> cookie. `storageState` captures localStorage + origins too, so it still works;
> just don't expect a `session` cookie.

## Fixtures > `beforeEach`

- Run only for tests that ask for the fixture (named parameter destructuring).
- Return a typed value via `use()`; teardown after `use`.
- Compose: a fixture can depend on other fixtures (e.g. an authenticated `app` that builds on the base `app`).

## Isolation contract

Playwright gives every test a fresh browser context + page. So:

- Tests must be **independent** - don't write `test('step 1')` + `test('step 2')` that depend on order.
- "Works alone, fails in suite" → some other test mutated shared state.
- "Works locally, fails in CI" → CI runs more workers in parallel.
- Put shared setup in a fixture, not in another test.

## Storage state - skip the UI login

```ts
// once: after a real login, save the session (cookies + localStorage + origins)
await page.context().storageState({ path: 'playwright/.auth/user.json' });

// after: new contexts start already signed in
const context = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
```

## When to use which auth pattern

| Situation | Use |
|---|---|
| Most tests need the same logged-in user | `globalSetup` + `use.storageState` in config |
| Multiple user types | One storage file per user + `test.use({ storageState })` |
| Test is *about* login | No storage state - start fresh |
| One or two tests share login | A composed fixture (an authenticated `app`) |

## Pitfalls

- **Auth file missing in CI** → generate via `globalSetup`; commit a `.gitkeep`, never real credentials.
- **Token expired** → regenerate in `globalSetup` per run.
- **Leaked state between tests** → storage state loads at context creation; mutations don't persist back. Good.

Workshop exercises in `WORKSHOP_GUIDE.md`.
