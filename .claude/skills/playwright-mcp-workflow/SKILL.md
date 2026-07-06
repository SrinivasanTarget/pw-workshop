---
name: playwright-mcp-workflow
description: The orchestrator - decide which surface to use for a Playwright task in Claude Code: the playwright-cli (Bash), the playwright-test browser MCP, a Test Agent (planner/generator/healer), or just editing files. Read this first when any Playwright task comes in.
---

# Which surface for the job?

This repo gives Claude Code four ways to affect Playwright work. Pick by intent.

| User intent                                                     | Use                                                                    |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| "Run / debug this test", "why did it fail"                      | **Playwright CLI** via Bash - `npx playwright test ...` + trace         |
| "Quickly poke the live page", "what's the ref for X"            | **`playwright-cli` skill** - `playwright-cli open/goto/click/snapshot`  |
| "Explore this page from inside Claude", "find bugs live"        | **playwright-test browser MCP** - `planner_setup_page` + `browser_*`    |
| "Plan tests for the app / this feature"                         | **Planner agent** (`.claude/agents/playwright-test-planner.md`)         |
| "Turn this plan into tests"                                     | **Generator agent** (`.claude/agents/playwright-test-generator.md`)     |
| "Fix these failing tests"                                       | **Healer agent** (`.claude/agents/playwright-test-healer.md`)           |
| "Write / refactor a specific test"                              | **Edit files** + the authoring skills below                            |

Two ways to drive a browser, and when to pick which:

- **`playwright-cli` skill (Bash)** - fastest for one-off, scriptable pokes: open,
  navigate, snapshot, click by ref/role, read console/network. No test-context
  setup. Great for the CLI segment and for discovering selectors.
- **playwright-test MCP (`browser_*` tools)** - the same live browser, but *inside
  a test context*, and it's the engine the Test Agents drive. Use it when you're
  staying in the plan → generate → heal flow.

## The playwright-test MCP server

One server, defined in `.mcp.json`: **`playwright-test`**
(`npx playwright run-test-mcp-server`). It exposes both:

- **Browser tools** - `mcp__playwright-test__browser_*` (navigate, snapshot,
  click, type, console_messages, network_requests, …) for live exploration.
- **Agent-orchestration tools** - `planner_*`, `generator_*`, `test_*` - invoked
  indirectly through the Test Agents in `.claude/agents/`.

> We deliberately don't also run `@playwright/mcp` - `playwright-test` already
> exposes the browser tools, and stacking both blows past the tool limit that
> confuses the model.

### ⚠️ Setup required before any `browser_*` call

`playwright-test` is a **test-runner** MCP - every browser call must live inside a
Playwright test context. Calling `browser_navigate` cold returns *"must setup test
before interacting with the page."*

**Start a free-form MCP browser session with:**

```
planner_setup_page          # establishes the test context
browser_navigate("/login")  # now works
browser_snapshot()
```

`planner_setup_page` is the right call for any non-agent exploration. When you
*are* invoking an agent, its own setup step (`planner_setup_page` /
`generator_setup_page`) handles this automatically. (Or skip the ceremony entirely
and use the `playwright-cli` skill for a quick look.)

Prefer `browser_snapshot` over `browser_take_screenshot` - it's the structured
accessibility tree: faster, cheaper, and actionable without vision.

## Test Agents - the loop

Agents live in `.claude/agents/`. Invoke them in natural language in Claude Code.

1. **Planner** → writes `specs/<feature>.md` (a Markdown test plan)
2. **Generator** → reads a spec, writes `tests/<scenario>.spec.ts`, verifying
   selectors against the live app as it goes
3. **Healer** → runs the suite, patches failures using trace / console / network

> Load the authoring skills before generating, so output matches house style and
> the functional helpers in `src/`.

## Authoring skills (house style)

- `[[test-craftsmanship]]` - SOLID, DRY, clean code, smells; the functional-helpers architecture; why there's no page object
- `[[playwright-locators]]` - locator priority + auto-wait
- `[[playwright-fixtures-auth]]` - custom fixtures (DI), storage state, isolation
- `[[playwright-debugging]]` - UI mode, codegen, trace viewer
- `[[playwright-bug-hunting]]` - finding real bugs (broken images, console guards)
- `[[playwright-network-mocking]]` - `page.route`, HAR, deterministic CI
- `[[playwright-api-testing]]` - the `request` fixture, hybrid tests

## Decision flow

```
Playwright task comes in
  ├─ "run / debug a test"            -> npx playwright test (Bash) + trace
  ├─ "quick poke / find a selector"  -> playwright-cli skill (Bash)
  ├─ "explore live inside Claude"    -> planner_setup_page + browser_* (MCP)
  ├─ "plan tests for…"               -> Planner agent
  ├─ "generate tests from this plan" -> Generator agent (load authoring skills)
  ├─ "these fail / fix them"         -> Healer agent, or debugging skill for one test
  ├─ "write / refactor a test"       -> edit files with authoring skills, run via Bash
  └─ unsure                          -> snapshot the app first, then pick
```

## Anti-patterns

- Skipping `planner_setup_page` before an MCP `browser_*` call - you'll get *"must
  setup test…"* every time.
- Using `browser_take_screenshot` when `browser_snapshot` would do - pixels
  instead of structure, and more tokens.
- Generating tests with no authoring skills loaded - output won't match house
  style or the functional helpers in `src/`.
- Running the Healer on a *missing / broken feature* - it'll keep trying. If the
  feature is broken (not the test), it skips. Don't fight it.

Session plan and exercises: `WORKSHOP_GUIDE.md`.
