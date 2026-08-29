---
name: playwright-mcp-workflow
description: Orients a Playwright task in this workshop - drive the live app through the Playwright browser MCP (browser_* tools, no setup ceremony), then write or refactor tests to house style using the authoring skills. Use first when a Playwright request comes in, to pick the right tool and skill.
---

# How we work: MCP to observe, skills to write

Two modes cover every Playwright task in this workshop. Pick by intent.

| Intent | Reach for |
|---|---|
| "Open / drive / inspect the live app", "what's on this page", "find a selector", "reproduce a bug live" | the **browser MCP** (`browser_*` tools) |
| "Write / refactor / review a test", "make this suite house-style" | **edit files** + the authoring skills below, run with `npx playwright test` |

## Driving the app: the browser MCP

The general Playwright MCP is a raw browser driver - **no setup ceremony**. Just:

```
browser_navigate("/login")
browser_snapshot()
```

- Prefer `browser_snapshot` (the structured accessibility tree) over
  `browser_take_screenshot` - faster, cheaper, and actionable without vision.
- `browser_generate_locator` hands you a locator to drop into a test - sanity-check
  it against the priority in [[playwright-locators]] before committing it.
- Control the network (`browser_route`), storage, and tracing live to reproduce a
  state before you encode it in a test.

## Writing tests: load the house-style skills

Generic AI-written tests inline everything and lean on CSS selectors and sleeps.
Refactor toward the house style - load the skill that fits the change:

- [[test-craftsmanship]] - the architecture: SOLID, DRY, functional helpers, why there is no page object
- [[playwright-locators]] - locator priority + auto-wait (kills the CSS/sleep smells)
- [[playwright-fixtures-auth]] - fixtures as DI, storage state, isolation
- [[playwright-debugging]] - UI mode, codegen, trace viewer, when a test misbehaves
- [[playwright-bug-hunting]] - turn a live-found bug into an invariant test
- [[playwright-network-mocking]] - `page.route`, HAR, deterministic CI
- [[playwright-api-testing]] - the `request` fixture, hybrid API-seed / UI-assert

## Decision flow

```
Playwright task comes in
  |- "observe / drive the live app"   -> browser MCP (browser_navigate, browser_snapshot, ...)
  |- "find / verify a selector"       -> browser MCP (browser_generate_locator) + [[playwright-locators]]
  |- "write / refactor a test"        -> edit files with the authoring skills, run via npx playwright test
  |- "why did this test fail"         -> [[playwright-debugging]] (trace viewer / --ui)
  |- unsure                           -> snapshot the app first, then pick
```

## Not in this stage

The planner / generator / healer **Test Agents** and their `run-test-mcp-server`
(the test-context MCP that needs a `planner_setup_page` step) are a later stage -
they are off here. This stage is the browser MCP plus the skills above.

Session plan and exercises: `WORKSHOP_GUIDE.md`.
