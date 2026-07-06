# Playwright Workshop - project guide (Claude Code)

A hands-on Playwright workshop driven from **VS Code + the Claude Code extension**
(Anthropic API key). It shows four complementary ways an AI assistant can automate
and test a real web app:

1. **Playwright CLI** - `npx playwright ...` to run/debug/generate tests, plus the
   `playwright-cli` skill for scripted browser driving straight from Bash.
2. **playwright-test MCP server** - live browser driving inside a test context
   (`browser_*` tools) and the engine behind the Test Agents. Configured in
   `.mcp.json`.
3. **Test Agents** - `planner` / `generator` / `healer` in `.claude/agents/`: the
   plan → generate → heal loop.
4. **Skills** - house style + workflow guidance in `.claude/skills/`, loaded on
   demand.

## The app under test

Deployed app: **https://playwright-workshop.pages.dev** (set as `baseURL`;
override with `BASE_URL`). It is a SauceDemo-style store.

- `/login` - 4 accounts, password `workshop123` for all:
  `standard_user` (happy path), `locked_out_user`, `problem_user`,
  `glitch_user` (the last three have planted quirks/bugs).
- `/inventory` - 6 products, a **Sort** dropdown, Add-to-cart.
- `/cart`, `/playground`.
- `GET /api/products` → `{ products: [...] }`. **Login is client-side** - there is
  no `/api/login`.
- Elements are tagged with **`data-test`** (not `data-testid`).
  `playwright.config.ts` sets `testIdAttribute: 'data-test'`, so
  `getByTestId('username')` resolves to `[data-test="username"]`.
- **Known planted bug:** the **Desk Lamp** product image points at
  `/images/does-not-exist.png` - the target of the bug-hunting demo.

## Skills (load on demand)

- `playwright-mcp-workflow` - **read first.** Which surface to reach for
  (CLI vs MCP vs agent vs just editing files).
- `playwright-cli` - scripted browser driving from Bash
  (`playwright-cli open/goto/click/snapshot/...`).
- `test-craftsmanship` - **the house craft.** SOLID, DRY, clean code, code smells,
  the Dependency Rule, pattern discipline; the functional-helpers architecture; why
  we reject the Page Object Model.
- `playwright-locators` - locator priority, auto-wait, web-first assertions.
- `playwright-fixtures-auth` - fixtures (DI), storage state, test isolation.
- `playwright-debugging` - UI mode, codegen, trace viewer, `page.pause()`.
- `playwright-bug-hunting` - broken-image audits, console/5xx guards, a11y.
- `playwright-network-mocking` - `page.route`, HAR record/replay.
- `playwright-api-testing` - the `request` fixture, hybrid UI + API tests.

## MCP gotcha - must read

`playwright-test` (`npx playwright run-test-mcp-server`) is a **test-runner** MCP,
not a raw browser driver. Every `browser_*` call must live inside a test context.
**Before any `browser_*` call in a free-form session, call `planner_setup_page`
first** - otherwise you get *"must setup test before interacting with the page."*
Test Agents call their own setup tool automatically. For a quick one-off browser
poke without that ceremony, use the `playwright-cli` skill instead.

## House style - quick anchors

- **Architecture:** **no Page Object Model.** Business intent lives in small
  functions (`src/actions/`) and typed API clients (`src/api/`) behind a thin `App`
  facade (`src/app.ts`); the `app` fixture injects it (DI). Assertions live in the
  spec, web-first. See `test-craftsmanship`.
- **Locators:** `getByRole` → `getByLabel` → `getByPlaceholder` → `getByTestId`.
  Avoid CSS chains / positional XPath.
- **Waits:** never `page.waitForTimeout()`; let `await expect(locator)...` wait.
  Avoid `waitForLoadState('networkidle')`.
- **Assertions:** web-first only - `await expect(locator).toX(...)`, never
  `expect(await locator.textContent()).toBe(...)`.
- **Auth:** prefer fixtures + `storageState` (`playwright/.auth/user.json`) over
  re-logging in each test.

## What's in the repo

- `src/app.ts` - the `App` facade (the driver seam); `src/actions/` - business-intent
  functions (`login`); `src/api/` - typed clients (`products`). See `test-craftsmanship`.
- `tests/fixtures.ts` - composes `page`/`request` into the `app` fixture (DI).
- `tests/login.spec.ts` - passing UI reference: `login`, then assert.
- `tests/products-api.spec.ts` - passing API reference: the typed products client.
- `tests/seed.spec.ts` - skipped seed the generator agent builds on.
- `specs/` - where the planner agent writes test plans.
- `WORKSHOP_GUIDE.md` - instructor session flow + exercises.
