# LangGraph agent — Jira ticket → Playwright tests (Phase 1) + self-healing (Phase 2)

A LangGraph.js agent that reads a Jira ticket over the **Jira MCP**, derives a
test plan, and generates real Playwright specs by driving the **general
playwright MCP** (the same engine `.mcp.json` runs) with the same system prompt
as the Claude Code subagent in
[`.claude/agents/playwright-test-generator.md`](../.claude/agents/playwright-test-generator.md).

## Graph

```
START ─► fetch_issue ─► plan_tests ─► generate_tests ─► END
          (Jira MCP)     (LLM,          (general playwright MCP,
                          structured     one ReAct run per scenario,
                          output)        sequential — single browser)
```

| Node | What it does |
|---|---|
| `fetch_issue` | ReAct agent with the Jira MCP tools; pulls summary, description, acceptance criteria, app URL. |
| `plan_tests` | Structured-output LLM call; converts the ticket into 3–6 concrete scenarios (suite / name / file / steps / expectations). |
| `generate_tests` | For each scenario, a ReAct agent whose system prompt is `playwright-test-generator.md` (frontmatter stripped + a general-MCP workflow override) executes every step live with `browser_*` tools, then saves the spec via a local `write_test_file` tool. Specs land under `tests/`. |

Because the general MCP has no `generator_setup_page` / `generator_write_test`
orchestration (those live only on the `playwright run-test-mcp-server` test
MCP), the agent navigates directly to the app (`APP_BASE_URL`) and a local
`write_test_file` tool — restricted to `tests/**/*.spec.ts` — persists the
generated source. `browser_run_code_unsafe` is filtered out, mirroring the
repo's deny policy.

## Setup

```bash
cd langgraph-agent
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY + Jira credentials
```

The default Jira MCP is [`mcp-atlassian`](https://github.com/sooperset/mcp-atlassian)
launched via `uvx` (requires [uv](https://docs.astral.sh/uv/)). To use a
different Jira MCP server, set `JIRA_MCP_COMMAND` / `JIRA_MCP_ARGS` in `.env`.

The playwright MCP is spawned from the repo root
(`node node_modules/playwright-core/lib/entry/mcp.js --caps ...`) — no extra
install. Make sure browsers are installed (`npm run install:browsers` in the
repo root).

## Run

```bash
npm run agent -- PROJ-123
```

Generated specs appear under `../tests/`; run them from the repo root with
`npm test`. They use relative `page.goto()` paths against the `baseURL` in
`playwright.config.ts` (override the live target with `APP_BASE_URL` in `.env`).

## Phase 2 — self-healing tests (`npm run heal`)

```
START ─► run_tests ─► heal_failures ─► verify ─► END
         (no LLM:      (one healer agent      (no LLM: re-run,
          JSON          per failing test,      write heal-summary.md,
          reporter)     playwright-test MCP)   exit 0/1)
```

- **`run_tests`** — runs `npx playwright test --reporter=json` and collects
  failing specs. Green suite → skips straight to `verify` (no tokens burned).
- **`heal_failures`** — per failing test, a ReAct agent whose system prompt is
  [`.claude/agents/playwright-test-healer.md`](../.claude/agents/playwright-test-healer.md)
  uses the **playwright-test MCP** (`test_run` / `test_debug` pause at the
  failing step with a live browser) plus local `read_test_file` /
  `edit_test_file` / `write_test_file` tools (restricted to
  `tests/**/*.spec.ts`, `seed.spec.ts` is read-only). Healing needs the
  test-runner MCP; the generator still uses the general MCP — the two commands
  never run at the same time.
- **`verify`** — re-runs the suite and writes `heal-summary.md` (originally
  failing tests, what changed, final counts). Exit code 0 = green, 1 =
  failures remain.

### CI wiring (`.github/workflows/tests.yml`)

- **`test` job** — every push/PR: `npm ci`, install chromium, `npx playwright
  test`; uploads the HTML report on failure.
- **`heal` job** — runs only `if: failure()`: installs both packages, runs
  `npm run heal`, publishes `heal-summary.md` to the job summary, and opens a
  **`ci/heal-<run id>` PR** (via `peter-evans/create-pull-request`) containing
  only `tests/**` changes for human review.
- Loop guard: `github.actor != 'github-actions[bot]'` stops heal PRs from
  triggering more healing; PRs opened with `GITHUB_TOKEN` don't re-trigger
  workflows anyway, so run the `test` workflow on the heal PR manually (or
  close/reopen it) if you want a green check before merging.
- **Required secret:** `ANTHROPIC_API_KEY` (repo Settings → Secrets and
  variables → Actions). Jira credentials are *not* needed for healing.

## Notes

- The workshop's stage-1 permission gate in `.claude/settings.json` only
  applies to Claude Code — this standalone agent talks to the MCP servers
  directly and is unaffected.
- Scenarios generate and heal **sequentially** because each MCP drives one
  browser session; don't parallelize those nodes.
- Phase 3 candidates: posting generated specs / heal reports back to the Jira
  ticket, human-in-the-loop plan approval via LangGraph `interrupt`.
