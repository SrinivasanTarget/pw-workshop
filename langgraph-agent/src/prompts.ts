import * as fs from "node:fs";
import { GENERATOR_PROMPT_PATH, HEALER_PROMPT_PATH } from "./config.js";

function stripFrontmatter(raw: string): string {
  const match = raw.match(/^---\n[\s\S]*?\n---\n/);
  return (match ? raw.slice(match[0].length) : raw).trim();
}

/** Adaptation for the GENERAL playwright MCP: it has no generator_* /
 *  planner_* orchestration tools, so the setup/log/write steps of the original
 *  subagent prompt are replaced with direct browser driving + a local
 *  write_test_file tool. */
const GENERAL_MCP_OVERRIDE = `
# IMPORTANT — adjusted workflow for this environment

You are connected to the general Playwright MCP (a raw browser driver). The
\`generator_setup_page\`, \`generator_read_log\` and \`generator_write_test\`
tools DO NOT exist here. Instead:

- There is no setup ceremony: start with \`browser_navigate\` to the page under
  test (use the full URL given in the task).
- Execute every step and verification live with the \`browser_*\` tools, using
  the step description as the intent of each call.
- Use \`browser_snapshot\` to see the page and \`browser_generate_locator\` to
  obtain robust locators for the elements you interact with.
- When all steps have been executed successfully, write the final spec by
  calling the \`write_test_file\` tool (instead of \`generator_write_test\`)
  with the target file path and the complete TypeScript source.
- The generated spec runs in a repo whose playwright config sets \`baseURL\`,
  so inside the test use relative navigation (e.g. \`await page.goto('/login')\`),
  \`getByTestId\` for elements carrying data-test attributes, and web-first
  \`expect\` assertions mirroring the verifications you performed live.
- The file must import \`{ test, expect } from '@playwright/test'\`.
`.trim();

/** Load .claude/agents/playwright-test-generator.md, strip the YAML
 *  frontmatter, and append the general-MCP workflow override. */
export function loadGeneratorSystemPrompt(): string {
  const body = stripFrontmatter(fs.readFileSync(GENERATOR_PROMPT_PATH, "utf8"));
  return `${body}\n\n${GENERAL_MCP_OVERRIDE}`;
}

/** Adaptation for the healer: file access goes through local tools instead of
 *  the Claude Code Read/Edit/Write tools named in the subagent definition. */
const HEALER_OVERRIDE = `
# IMPORTANT — adjusted tooling for this environment

- To inspect a spec, call \`read_test_file\`. To fix it, call \`edit_test_file\`
  (exact-string replacement) or \`write_test_file\` (full rewrite). These replace
  the Read/Edit/MultiEdit/Write tools mentioned above. All paths are relative to
  the repo root (e.g. tests/login/valid-login.spec.ts).
- Never modify tests/seed.spec.ts — the test runner needs it intact.
- Focus ONLY on the failing test you were given. Use \`test_debug\` with its
  exact file and title, fix, then re-run that test with \`test_run\` until it
  passes. Do not touch or run unrelated tests.
- The app tags elements with data-test (getByTestId resolves to [data-test=...]).
`.trim();

/** Load .claude/agents/playwright-test-healer.md, strip the YAML frontmatter,
 *  and append the local-tools override. */
export function loadHealerSystemPrompt(): string {
  const body = stripFrontmatter(fs.readFileSync(HEALER_PROMPT_PATH, "utf8"));
  return `${body}\n\n${HEALER_OVERRIDE}`;
}

export const JIRA_FETCH_PROMPT = (issueKey: string) => `
Fetch Jira issue ${issueKey} using the available Jira tools.

Then report, as plain markdown (no tool-call syntax, no JSON):
- **Summary** — the issue title
- **Description** — the full description
- **Acceptance criteria** — every acceptance criterion / expected behaviour you can
  find (in the description, custom fields, or comments)
- **Environment / URL** — any application URL mentioned on the ticket

If a section is genuinely absent on the ticket, write "not specified".
`.trim();

export const PLANNER_SYSTEM_PROMPT = `
You convert a Jira ticket into a small, concrete Playwright test plan.

Rules:
- Derive one scenario per acceptance criterion / distinct user behaviour. Prefer
  3-6 focused scenarios over one giant one.
- Every step must be a single concrete browser action or verification a user
  could perform ("Click the 'Login' button", "Verify the error 'Required' is
  visible under the email field") — never vague ("test the login works").
- The suite name groups all scenarios and should reflect the feature under test.
- File paths live under tests/, kebab-case, one file per scenario, ending in
  .spec.ts (e.g. tests/login/shows-error-on-empty-email.spec.ts).
- Only plan what the ticket supports. Do not invent features.
`.trim();
