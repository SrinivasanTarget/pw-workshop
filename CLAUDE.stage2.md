# Playwright Workshop - project guide (Claude Code)

A hands-on Playwright workshop driven from **VS Code + the Claude Code extension**
(Anthropic API key). **Stage 2** is about house style: you drive the live app with the
**browser MCP**, then use the **skills** and this file to write and **refactor** tests
into a clean, opinionated shape - no Page Object Model, no ceremony.

## How we work in stage 2

Two modes (see the `playwright-mcp-workflow` skill):

- **Observe / drive the live app** -> the **browser MCP** (`browser_*` tools). It is a
  raw browser driver with **no setup ceremony** - just `browser_navigate` then
  `browser_snapshot` (the structured accessibility tree). Use it to explore, find
  selectors (`browser_generate_locator`), and reproduce states (`browser_route`).
- **Write / refactor / review a test** -> **edit files** to the house style below,
  loading the skill that fits, and run with `npx playwright test`.

The planner / generator / healer **Test Agents** and their `run-test-mcp-server` are a
**later stage** - they are off here.

## The app under test

Deployed app: **https://playwright-workshop.pages.dev** (set as `baseURL`; override
with `BASE_URL`). A SauceDemo-style store.

- `/login` - 4 accounts, password `workshop123` for all: `standard_user` (happy path),
  `locked_out_user`, `problem_user`, `glitch_user` (the last three have planted quirks).
- `/inventory` - 6 products, a **Sort** dropdown, Add-to-cart. Also `/cart`, `/playground`.
- `GET /api/products` -> `{ products: [...] }`. **Login is client-side** - there is no
  `/api/login`; the session lives in `localStorage`.
- Elements are tagged with **`data-test`** (not `data-testid`). `playwright.config.ts`
  sets `testIdAttribute: 'data-test'`, so `getByTestId('username')` resolves to
  `[data-test="username"]`.
- **Known planted bug:** the **Desk Lamp** image points at `/images/does-not-exist.png`.

## House style - quick anchors

- **Architecture:** **no Page Object Model.** Business intent lives in small functions
  (`src/actions/`) and typed API clients (`src/api/`) behind a thin `App` facade
  (`src/app.ts`); the `app` fixture injects it (DI). Assertions live in the spec,
  web-first. See `test-craftsmanship`.
- **Locators:** `getByRole` -> `getByLabel` -> `getByPlaceholder` -> `getByTestId`.
  Avoid CSS chains / positional XPath. See `playwright-locators`.
- **Waits:** never `page.waitForTimeout()`; let `await expect(locator)...` wait. Avoid
  `waitForLoadState('networkidle')`.
- **Assertions:** web-first only - `await expect(locator).toX(...)`, never
  `expect(await locator.textContent()).toBe(...)`.
- **Auth:** prefer fixtures + `storageState` (`playwright/.auth/user.json`) over
  re-logging in each test. See `playwright-fixtures-auth`.

## Skills (load on demand)

- `playwright-mcp-workflow` - **read first.** How to work: browser MCP to observe, the
  skills below to write.
- `test-craftsmanship` - **the house craft.** SOLID, DRY, clean code, the Dependency
  Rule, the functional-helpers architecture; why we reject the Page Object Model.
- `playwright-locators` - locator priority, auto-wait, web-first assertions.
- `playwright-fixtures-auth` - fixtures (DI), storage state, test isolation.
- `playwright-debugging` - UI mode, codegen, trace viewer, `page.pause()`.
- `playwright-bug-hunting` - broken-image audits, console/5xx guards, a11y.
- `playwright-network-mocking` - `page.route`, HAR record/replay.
- `playwright-api-testing` - the `request` fixture, hybrid UI + API tests.

## What's in the repo

The repo ships mostly empty on purpose - you **build** `src/` and `tests/` to the house
style during the stage.

- `playwright.config.ts` - `baseURL`, `testIdAttribute: 'data-test'`, trace/screenshot
  on failure.
- `tests/seed.spec.ts` - a throwaway seed spec so `npm test` is green; replace it with
  real specs.
- `src/` and the rest of `tests/` - **you create these**, to the shape in
  `test-craftsmanship`: `src/app.ts` (the `App` facade), `src/actions/` (business-intent
  functions), `src/api/` (typed clients), `tests/fixtures.ts` (composes `page`/`request`
  into the `app` fixture), `tests/*.spec.ts` (specs that read as intent).
