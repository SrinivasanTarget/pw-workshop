# Playwright MCP servers - what each carries and when to use what

There are **two** Playwright MCP servers you can point Claude Code at, and they are
easy to confuse because they share the same `browser_*` tool names but behave very
differently. This repo wires up **both** (see `.mcp.json`) and stage-gates them.

> **TL;DR**
> - **`@playwright/mcp` (general)** - a raw browser driver. Full surface (route,
>   storage, tracing, verify), no setup ceremony. **Use it to explore/automate a
>   live browser.** This repo runs it as the `playwright` server. **Stages 1-2.**
> - **`playwright run-test-mcp-server` (test)** - the engine behind the
>   planner/generator/healer **Test Agents**. Runs inside a test suite, needs
>   `planner_setup_page`, and carries the `planner_*`/`generator_*`/`test_*`
>   orchestration tools. **Use it to plan/generate/heal tests.** **A later stage.**

All numbers below were measured against the versions installed in this repo
(`playwright`, `playwright-core`, `@playwright/test` all **1.61.1**).

---

## First, the packages (they are layers, not siblings)

```
@playwright/test   test runner: test(), expect(), fixtures, config
     |  depends on
     v
playwright         browser-automation library + the `npx playwright` CLI
     |  depends on   (the CLI carries the hidden `run-test-mcp-server` command)
     v
playwright-core    the engine: browser protocol + the bundled MCP tools +
                   BOTH MCP server implementations (incl. lib/entry/mcp.js,
                   the general "Playwright MCP" that @playwright/mcp publishes)
```

- **`playwright`** is a *package/CLI*, **not** an MCP server itself. Its CLI exposes
  exactly one (hidden) MCP command: `run-test-mcp-server`.
- **`@playwright/mcp`** is a *separately published* package that exposes the
  general MCP. The identical engine already ships inside `playwright-core`
  (`node_modules/playwright-core/lib/entry/mcp.js`), so this repo runs that directly
  and needs no extra install.

---

## Side-by-side comparison

| Dimension | `@playwright/mcp` (general) | `playwright run-test-mcp-server` (test) |
|---|---|---|
| What it is | Standalone browser-automation MCP | Hidden subcommand of the `playwright` CLI |
| Launch (this repo) | `node node_modules/playwright-core/lib/entry/mcp.js --caps ...` | `npx playwright run-test-mcp-server` |
| Launch (published) | `npx @playwright/mcp@latest --caps ...` | (same as above) |
| Server name here | `playwright` | `playwright-test` |
| Primary purpose | Drive/inspect a live browser | Author tests with the Test Agents |
| Browser tool count | 23 default -> **67** with full `--caps` | **28** dispatched (of 86 advertised) |
| Setup ceremony | **None** - just `browser_navigate` | **`planner_setup_page` first** (attaches to a seed test) |
| Runs inside a test suite | No (raw browser) | Yes (test-runner context) |
| Orchestration tools | None | `planner_*`, `generator_*`, `test_*` (unique to it) |
| `tools/list` honesty | Advertises only what it dispatches | Advertises 86, dispatches 28 (the rest -> "Tool not found") |
| Capability control | `--caps=vision,pdf,devtools,network,storage,testing` | Hardcoded to `["testing"]` (no flag) |
| Ties to planner/generator/healer | No | **Yes - this is their engine** |
| Browser/state model | Its own browser context | A different browser inside the test context |
| Best for | Exploration, bug-hunting, network mocking, storage, tracing | Plan -> generate -> heal test authoring |
| Workshop stage | **Stages 1-2** | **A later stage** |

> **Do not run both in the same manual flow.** They drive **separate browsers with
> no shared state** - log in on one and the other still sees a blank, logged-out
> page. This repo denies the test MCP during stage 1 so exploration stays on one
> browser; a later stage turns it on for the agents (which drive their own browser).

---

## What each one carries (tool surface by capability)

| Capability group | Example tools | General MCP | Test MCP |
|---|---|---|---|
| **core** (navigate, click, type, snapshot, evaluate, dialogs, screenshot, wait, network-*observe*) | `browser_navigate`, `browser_click`, `browser_snapshot`, `browser_evaluate`, `browser_network_requests` | YES | YES |
| **testing** (assertions + locator) | `browser_verify_*`, `browser_generate_locator` | YES (`--caps=testing`) | YES |
| **network** (mock/intercept/offline) | `browser_route`, `browser_unroute`, `browser_route_list`, `browser_network_state_set` | YES (`--caps=network`) | **advertised, not dispatched** |
| **storage** (cookies, localStorage, sessionStorage, storage state) | `browser_cookie_*`, `browser_localstorage_*`, `browser_sessionstorage_*`, `browser_storage_state` | YES (`--caps=storage`) | **advertised, not dispatched** |
| **devtools** (tracing, video, highlight, annotate) | `browser_start_tracing`, `browser_start_video`, `browser_highlight`, `browser_annotate` | YES (`--caps=devtools`) | **advertised, not dispatched** |
| **pdf** | `browser_pdf_save` | YES (`--caps=pdf`) | **advertised, not dispatched** |
| **vision** (coordinate mouse) | `browser_mouse_click_xy`, `browser_mouse_wheel` | YES (`--caps=vision`) | **advertised, not dispatched** |
| **orchestration** (the Test Agents) | `planner_setup_page`, `generator_write_test`, `test_run`, ... | **no** | **YES (only here)** |
| **skillOnly** (see caveat) | `browser_reload`, `browser_check`, `browser_uncheck`, `browser_navigate_forward`, `browser_console_clear` | no | no |

### Two caveats worth knowing

1. **The test MCP advertises tools it will not run.** Its `tools/list` returns all
   86 tools, but its browser backend is built with `capabilities: ["testing"]`, so
   only 28 dispatch. Calling any of the other 49 (e.g. `browser_route`,
   `browser_console_clear`) returns `Tool "..." not found`. This is why the general
   MCP is the right choice for "explore everything."
2. **`skillOnly` tools are unavailable in *both* servers.** `browser_reload`,
   `browser_check`/`uncheck`, `browser_navigate_forward`, `browser_console_clear`,
   `browser_press_sequentially` are filtered out regardless of capabilities.
   Workarounds: re-`browser_navigate` the same URL instead of reload;
   `browser_click` a checkbox instead of `browser_check`.

---

## When to use what

**Reach for the general `@playwright/mcp` when you want to:**
- explore or drive a live app freely (no test suite, no `planner_setup_page`)
- mock or intercept the network (`browser_route`), go offline, force errors
- inspect/seed cookies, localStorage, sessionStorage, or storage state
- record a trace or video, highlight/annotate, save a PDF
- bug-hunt or investigate ad hoc

**Reach for `playwright run-test-mcp-server` when you want to:**
- run the **planner** (produce a test plan), **generator** (write specs), or
  **healer** (repair failing tests) agents
- author tests inside a real test-runner context and use `test_run`/`test_debug`
- work through the plan -> generate -> heal loop

---

## How this repo uses them (stage gating)

`.mcp.json` registers both. `.claude/settings.json` gates them:

- **Stage 1 (default):** `mcp__playwright` allowed; `mcp__playwright-test`, `Skill`,
  and the `Agent(...)` lines **denied**. Exploration runs on the general MCP only -
  full surface, no ceremony, honest tool list.
- **Stage 2:** delete the `Skill` line from `permissions.deny` and rename
  `CLAUDE.stage2.md` -> `CLAUDE.md`, then reload the window. The house-style skills +
  `CLAUDE.md` come online; the general MCP stays on.
- **A later stage:** delete the `mcp__playwright-test` and `Agent(...)` lines to bring
  the Test Agents and their engine online.

`browser_run_code_unsafe` is denied on **both** servers regardless of stage.

---

## Appendix - the exact commands

```bash
# General MCP (this repo, no extra install) - full capabilities:
node node_modules/playwright-core/lib/entry/mcp.js \
  --caps vision,pdf,devtools,network,storage,testing

# General MCP (published package equivalent):
npx @playwright/mcp@latest --caps vision,pdf,devtools,network,storage,testing

# Test MCP (Test Agents engine):
npx playwright run-test-mcp-server
```

Verify a server's real surface by asking it over MCP (`initialize` then
`tools/list`): the general MCP returns 67 tools with the caps above; the test MCP
returns 86 but only dispatches 28.
