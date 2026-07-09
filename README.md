# Playwright + Claude Code Workshop

Learn Playwright with an AI pair - driven entirely from **VS Code + the Claude Code
extension** (Anthropic API key). One repo, staged: explore a real web app with the
**browser MCP**, then use on-demand **Skills** + a **`CLAUDE.md`** to write and
refactor tests to a clean house style. Three **Test Agents** (planner / generator /
healer) wait in a later stage.

App under test: **https://playwright-workshop.pages.dev** - a SauceDemo-style store
(no local server to run).

---

## Prerequisites

- **Node.js 18+** and npm
- **VS Code**
- **Claude Code for VS Code** extension (`anthropic.claude-code`)
- An **Anthropic API key** (`sk-ant-...`)

## Setup (5 minutes)

```bash
git clone <this-repo> pw-workshop
cd pw-workshop
npm install
npm run install:browsers      # downloads Chromium for Playwright
```

Then confirm the tooling works:

```bash
npm test                      # runs the seed spec against the deployed app
```

You should see 1 passing test (the seed). Open the report with `npm run report`.

### Wire up Claude Code

1. Open this folder in VS Code. When prompted, install the **recommended
   extensions** (Claude Code + Playwright) - see `.vscode/extensions.json`.
2. Sign in to Claude Code with your Anthropic API key:
   **Command Palette → "Claude Code: Sign In"**, or set `ANTHROPIC_API_KEY` in your
   environment before launching VS Code. (The key is configured in the extension -
   it is **not** read from a repo file.)
3. Everything else is already wired in the repo:
   - `.mcp.json` - the `playwright` (general) + `playwright-test` MCP servers,
     pre-enabled via `.claude/settings.json`. Compared in `MCP_SERVERS.md`.
   - `.claude/skills/` - the house-style + workflow skills (on in stage 2).
   - `.claude/agents/` - the planner / generator / healer Test Agents (a later stage).
   - `CLAUDE.stage2.md` - project context; disabled in stage 1, renamed to `CLAUDE.md`
     for stage 2.

Smoke-test the AI setup - in the Claude Code panel, ask:

> Go to `/login` and snapshot the page.

If you get a structured accessibility snapshot back, the general `playwright` MCP is
connected. (Stages 1-2 need no `planner_setup_page` - see `MCP_SERVERS.md`.)

---

## The surfaces

| You want to…                                    | Reach for                                                     |
| ----------------------------------------------- | ------------------------------------------------------------- |
| Explore / drive the live app from inside Claude | **`playwright` browser MCP** - `browser_*`, no setup ceremony |
| Run / debug tests                               | **Playwright CLI** - `npm test`, `npm run test:ui`, codegen   |
| Write tests the house way (SOLID, functional)   | **Skills** - `test-craftsmanship`, `playwright-locators`, ... |
| Plan → generate → heal a feature's tests        | **Test Agents** in `.claude/agents/` (a later stage)          |

Start any Playwright task by letting Claude read the **`playwright-mcp-workflow`**
skill - it orients you: browser MCP to observe, house-style skills to write.

## Test accounts

All use password **`workshop123`**:

| User              | Behaviour                                   |
| ----------------- | ------------------------------------------- |
| `standard_user`   | Happy path - everything works               |
| `locked_out_user` | Cannot sign in                              |
| `problem_user`    | Planted UI bugs (e.g. a broken image)       |
| `glitch_user`     | Intermittent / glitchy behaviour            |

## Handy scripts

```bash
npm test              # run the suite (headed Chromium)
npm run test:ui       # Playwright UI mode (time-travel debugging)
npm run test:headed   # run headed
npm run test:debug    # step through with the Inspector
npm run report        # open the last HTML report
npm run codegen       # record a test against /login
npm run typecheck     # strict TypeScript check of the framework
```

## Where things live

```
.claude/agents/     planner · generator · healer (Test Agents; a later stage)
.claude/skills/     8 house-style + workflow skills (on in stage 2)
.mcp.json           playwright + playwright-test MCP servers
CLAUDE.stage2.md    project context (off in stage 1; rename to CLAUDE.md for stage 2)
MCP_SERVERS.md      the two MCP servers (general vs test) compared
exercises/          stage-1 raw-MCP exploration + stage-2 refactor + stage-2 skill labs
src/, tests/        you build these to house style (App facade, actions, api, fixtures, specs)
WORKSHOP_GUIDE.md   instructor session flow + exercises
```

New here? Read **`WORKSHOP_GUIDE.md`** for the session plan and exercises.
