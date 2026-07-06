# specs/

Test plans live here - human-readable Markdown, one file per feature.

The **Playwright Planner agent** (`.claude/agents/playwright-test-planner.md`)
explores the app through the browser MCP and writes plans into this folder, e.g.
`specs/inventory.md`. The **Generator agent** then reads a plan and turns each
scenario into a spec under `tests/`.

Try it in Claude Code:

> Use the playwright-test-planner agent to create a test plan for the inventory
> page. Save it to `specs/inventory.md`.
