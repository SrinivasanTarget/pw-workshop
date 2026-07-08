# Playwright Workshop - Instructor Guide

The **human-facing** companion to the skills under `.claude/skills/`. Those skills
are for the AI assistant (Claude Code); this guide is for **you, the instructor**:
session flow, exercises, demo scripts.

App under test: **https://playwright-workshop.pages.dev** - deployed, so there is
no local app server to babysit. Everything targets `baseURL` from
`playwright.config.ts` (override with `BASE_URL`).

## Setup (do once before the workshop)

```bash
npm install
npm run install:browsers          # Chromium for Playwright
npm test                          # the seed spec passes -> tooling is ready
```

Already wired in the repo (attendees do nothing extra):

```
.mcp.json            -> playwright (general) + playwright-test MCP servers
.claude/settings.json-> pre-enables the MCP server + sensible permissions
.claude/agents/      -> planner, generator, healer (a later stage)
.claude/skills/      -> 8 house-style + workflow skills
CLAUDE.stage2.md     -> project context; DISABLED in stage 1, restored for stage 2
```

Smoke-check before attendees arrive:

```bash
npm test                          # the seed spec passes
npm run test:ui                   # UI mode opens
```

## Attendee setup - Claude Code in VS Code

Everyone uses the same stack, so there's no per-client branching this time:

1. Open the repo in VS Code; install the recommended extensions (Claude Code +
   Playwright) from `.vscode/extensions.json`.
2. Sign in to Claude Code with an Anthropic API key
   (**Command Palette → "Claude Code: Sign In"**, or `ANTHROPIC_API_KEY` in env).
3. Approve the `playwright-test` MCP server if prompted (it's pre-enabled via
   `.claude/settings.json`).

Smoke-test the AI wiring - in the Claude Code panel:

> Go to `/login` and snapshot the page.

A structured snapshot back = the general `playwright` MCP is connected. (Stages 1-2
need no `planner_setup_page` - that is a later-stage test-MCP step.)

> ⚠️ **Two MCP servers, gated by stage.** Stages 1-2 use the general **`playwright`**
> MCP - a raw browser driver: no setup ceremony, full network/storage/tracing. A
> **later stage** adds **`playwright-test`** (`run-test-mcp-server`), which powers the
> Test Agents and *does* need `planner_setup_page`. Full comparison:
> [`MCP_SERVERS.md`](MCP_SERVERS.md).

## Stage gating - skills off first, agents later

By default this repo ships **locked to stage 1**: the `Skill` tool, the three Test
Agents (planner / generator / healer), and the `playwright-test` MCP are denied in
`.claude/settings.json`, so the only AI surface is the general **`playwright`** MCP.
Attendees explore the app with `browser_*` (no setup ceremony), and nothing
auto-invokes a skill or an agent.

**Enable stage 2** (skills + `CLAUDE.md`, still MCP-only) with two edits, then reload
the window (Cmd/Ctrl-Shift-P -> Developer: Reload Window):

1. Delete the `"Skill"` line from `permissions.deny` in `.claude/settings.json`.
2. Rename `CLAUDE.stage2.md` -> `CLAUDE.md`.

The eight skills + `CLAUDE.md` come online; the browser MCP stays on. Notes:
- `deny` beats `allow` and cannot be undone from `settings.local.json`, so enabling
  stage 2 really does mean editing `settings.json`.
- The Test Agents + their `playwright-test` MCP stay denied - they are a **later
  stage**. Turn them on by also deleting the `Agent(...)` and `mcp__playwright-test`
  lines.

The full stage-1 exercise set - instructor-led demos, a bunch of attendee exercises,
and a capabilities checklist covering the whole MCP toolset - is in
[`exercises/stage-1-mcp-exploration.md`](exercises/stage-1-mcp-exploration.md). The
**instructor answer key** (planted bugs, expected findings, data-test cheat sheet) is
[`exercises/stage-1-answer-key.md`](exercises/stage-1-answer-key.md). The two MCP
servers (general vs test) are compared in [`MCP_SERVERS.md`](MCP_SERVERS.md).

The **stage-2 refactor exercises** - turning generic AI-written tests into house style
with the skills + `CLAUDE.md` - are in
[`exercises/stage-2-refactor.md`](exercises/stage-2-refactor.md). That file leans on
`playwright-locators` + `test-craftsmanship`; the **skill labs** in
[`exercises/stage-2-skill-labs.md`](exercises/stage-2-skill-labs.md) give each other
skill its own lab (debugging, bug-hunting, network mocking, API, fixtures/isolation, a
craftsmanship review) - one instructor demo + attendee tasks apiece, grounded in the
app's planted bugs.

## Suggested 3-hour session flow

| Block            | Time | Focus                                                      | Skill(s)                    |
| ---------------- | ---- | ---------------------------------------------------------- | --------------------------- |
| Warm-up          | 15m  | Run the suite, open `--ui`, walk through the login test    | none                        |
| MCP + snapshots  | 20m  | Drive the live app with the browser MCP; read a snapshot   | `playwright-mcp-workflow`   |
| Locators + actions | 30m | Role/label > CSS; extract flows into `src/actions` functions - no page objects | `playwright-locators`, `test-craftsmanship` |
| Fixtures + auth  | 25m  | The `app` fixture as DI; storage-state to skip UI login    | `playwright-fixtures-auth`  |
| Break            | 10m  |                                                            |                             |
| Debugging        | 20m  | Trace viewer, `--debug`, `page.pause` - fix a planted bug  | `playwright-debugging`      |
| Bug hunting      | 25m  | Find the broken Desk Lamp image; add a console-error guard | `playwright-bug-hunting`    |
| Network mocking  | 20m  | Force empty inventory; HAR record/replay                   | `playwright-network-mocking`|
| **Refactor**     | 25m  | Generic AI test -> house style with skills + `CLAUDE.md`   | all authoring skills        |
| Wrap             | 10m  | Q&A, where to go next                                      |                             |

## Exercises

### Locators + actions

A house-style login spec reads as intent - `login(app, ...)` then web-first
assertions on `app.heading(...)`, no page objects. Build `src/actions` and
`src/app.ts`, then cover inventory:

1. Add `addToCart(app, productName)` and `sortBy(app, option)` functions in
   `src/actions/` (reuse `app.page`; a click by `data-test` is fine inside an action).
2. Add a query helper (a function returning a **Locator**) for a product card,
   filtered by its heading - never `.nth()`.
3. Write a spec: log in, add the Desk Lamp, assert the cart. Keep it green.

> The app uses `data-test`; `playwright.config.ts` sets `testIdAttribute: 'data-test'`,
> so `getByTestId('sort')` just works. Read `test-craftsmanship` for where each piece
> goes, why there's no page object, and when a heavier pattern (Screenplay) would be
> justified.

### Fixtures + auth

Your `app` fixture composes `page`/`request` and injects a ready seam - that is
Dependency Injection. Now make login cheap:
1. Sign in once, save `playwright/.auth/user.json`, and set `use.storageState` so specs
   start already authenticated.
2. Add an authenticated variant of the fixture (or a project with `storageState`) so
   most specs skip the UI login entirely.
3. Compare runtimes before/after.

### Debugging

Plant a bug: change the expected heading to `'Product'` in your login spec. Run
with `npm run test:ui`. Have attendees identify the failing step from the
time-travel view *without* reading the error text. Then fix it.

### Bug hunting

1. The **Desk Lamp** image is genuinely broken (points at a 404). Write an audit
   test that asserts the invariant - *no* broken images on `/inventory`:

   ```ts
   const findings = await page.evaluate(() =>
     [...document.querySelectorAll('img')].map(img => ({
       alt: img.alt, src: img.src,
       broken: !img.complete || img.naturalWidth === 0,
     })),
   );
   expect(findings.filter(f => f.broken)).toEqual([]);
   ```

   It **fails** - and that failure *is* the finding. Talk about asserting the
   invariant, not the bug.
2. Add a global console-error listener in a fixture. Re-run. Anything break?
3. Compare `standard_user` vs `problem_user` on `/inventory` - what differs?

### Network mocking

1. `page.route('**/api/products', ...)` to return an **empty** `{ products: [] }`.
   Does the inventory page show an empty state, or crash?
2. Record a HAR by visiting `/inventory` once, then replay it offline with
   `routeFromHAR` - should still render.
3. Delay `/api/products` by 2s with `route.continue`. Is there a loading state?

### API testing

`GET /api/products` returns `{ products: [...] }` with 6 items. Write a pure API
test asserting the status and shape. Then discuss a hybrid pattern: seed via API,
assert through the UI. (This app's login is client-side, so there's no
`/api/login` to seed against - a good talking point about what is and isn't
API-drivable.)

## AI segment - Planner → Generator → Healer (later stage)

> **Deferred.** The Test Agents and their `run-test-mcp-server` are gated off in stages
> 1-2. Turn them on in a later stage (delete the `Agent(...)` + `mcp__playwright-test`
> lines in `.claude/settings.json`). The rest of this section previews that stage.

The headline demo. In the Claude Code panel:

### 1. Plan

> Use the playwright-test-planner agent to create a test plan for the inventory
> page. Save it to `specs/inventory.md`.

The agent drives the app via the browser MCP, snapshots pages, and writes a
Markdown plan to `specs/inventory.md`.

### 2. Generate

> Use the playwright-test-generator agent to create tests from `specs/inventory.md`.
> Follow the house style in the skills and the functional helpers in `src/`.

The Generator writes `tests/<scenario>.spec.ts`, verifying selectors against the
live app as it goes. Mentioning the skills keeps it on house style.

### 3. Heal

Plant a small bug (rename a button, change a path). Run the suite - it fails.

> Use the playwright-test-healer agent to fix the failing tests.

The Healer runs in debug mode, inspects trace/console/network, and patches the
test. If it decides the *feature* is broken (not the test), it skips with a
comment.

### Talking points

- The agents work because the app is **observed live**, not guessed - that's the
  MCP advantage.
- The Generator only shines if the **house style lives in the skills**. Without
  `playwright-locators` etc. loaded, it produces generic tests.
- The Healer isn't magic - a broken *feature* stays broken. Good.

## Where to point attendees afterwards

- Playwright docs - https://playwright.dev
- Playwright Test Agents - https://playwright.dev/docs/test-agents
- `npx playwright init-agents --loop=claude` to bootstrap agents in their own repo
- This repo's `.claude/skills/` - copy the pattern into their own projects
