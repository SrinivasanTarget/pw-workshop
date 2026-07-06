# Playwright + Claude Code Workshop

Learn Playwright with an AI pair - driven entirely from **VS Code + the Claude Code
extension** (Anthropic API key). One repo, four ways to automate a real web app:
the **Playwright CLI**, the **playwright-test MCP server**, three **Test Agents**
(planner / generator / healer), and a set of on-demand **Skills** that encode house
style.

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

Then confirm the reference test passes:

```bash
npm test                      # runs tests/login.spec.ts against the deployed app
```

You should see 1 passing test. Open the report with `npm run report`.

### Wire up Claude Code

1. Open this folder in VS Code. When prompted, install the **recommended
   extensions** (Claude Code + Playwright) - see `.vscode/extensions.json`.
2. Sign in to Claude Code with your Anthropic API key:
   **Command Palette → "Claude Code: Sign In"**, or set `ANTHROPIC_API_KEY` in your
   environment before launching VS Code. (The key is configured in the extension -
   it is **not** read from a repo file.)
3. Everything else is already wired in the repo:
   - `.mcp.json` - the `playwright-test` MCP server (Claude Code picks this up).
     Approve it when prompted, or it's pre-enabled via `.claude/settings.json`.
   - `.claude/agents/` - the planner / generator / healer Test Agents.
   - `.claude/skills/` - the house-style + workflow skills.
   - `CLAUDE.md` - project context, loaded into Claude Code automatically.

Smoke-test the AI setup - in the Claude Code panel, ask:

> Use `planner_setup_page`, navigate to `/login`, and snapshot the page.

If you get a structured accessibility snapshot back, the MCP server is connected.

---

## The four surfaces

| You want to…                                   | Reach for                                                    |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Run / debug / generate tests                   | **Playwright CLI** - `npm test`, `npm run test:ui`, codegen |
| Poke the live page quickly from the terminal   | **`playwright-cli` skill** - `playwright-cli open/click/...` |
| Explore a page live from inside Claude         | **playwright-test MCP** - `planner_setup_page` + `browser_*`|
| Plan → generate → heal a feature's tests       | **Test Agents** in `.claude/agents/`                        |
| Write tests the house way (SOLID, functional)  | **Skill** - `test-craftsmanship`                            |

Start any Playwright task by letting Claude read the **`playwright-mcp-workflow`**
skill - it's the orchestrator that decides which surface fits.

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
.claude/agents/     planner · generator · healer (Test Agents)
.claude/skills/     playwright-cli + test-craftsmanship + workflow skills
.mcp.json           playwright-test MCP server (Claude Code)
CLAUDE.md           project context for the AI
exercises/          stage-1 raw-MCP exploration exercises (no skills/agents)
src/                app.ts facade + actions/ (login) + api/ (products client)
tests/              fixtures.ts (DI) + login (UI) + products-api (API) specs
specs/              test plans the planner agent writes
WORKSHOP_GUIDE.md   instructor session flow + exercises
```

New here? Read **`WORKSHOP_GUIDE.md`** for the session plan and exercises.
