#!/usr/bin/env node
// House-style guardrail for the Playwright workshop.
//
// A PreToolUse hook wired on Write|Edit|MultiEdit: before Claude Code runs one of
// those tools, it pipes the pending edit to this script as JSON on stdin. We check
// the added text against the CLAUDE.md house style and BLOCK (exit 2) the edits
// that are mechanically wrong. Whatever we print to stderr is handed back to
// Claude, which reads it and rewrites its own edit - no human in the loop.
//
// Advice (CLAUDE.md, skills) *biases* the model; this *binds* it. So keep it to
// rules that are genuinely mechanical. Design judgement ("is this a good helper?")
// belongs in review, not here - a hook can only enforce a proxy for good design,
// never the thing itself.
const fs = require('fs');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // a broken hook must never block real work
}

const { tool_name, tool_input = {} } = input;
const path = tool_input.file_path || '';

// Only police TypeScript source/spec files.
if (!/\.(ts|tsx)$/.test(path)) process.exit(0);

// The text this edit ADDS, across the three tool shapes.
let added = '';
if (tool_name === 'Write') added = tool_input.content || '';
else if (tool_name === 'Edit') added = tool_input.new_string || '';
else if (tool_name === 'MultiEdit')
  added = (tool_input.edits || []).map((e) => e.new_string || '').join('\n');

const isSpec = /\.spec\.tsx?$/.test(path);

// [appliesHere, pattern, message]. Message names the source so Claude can self-fix.
const RULES = [
  [true, /page\.waitForTimeout\s*\(/, 'page.waitForTimeout() is banned - let `await expect(locator)...` do the waiting. (playwright-locators)'],
  [true, /networkidle/, "waitForLoadState('networkidle') is banned - it is flaky. (CLAUDE.md > Waits)"],
  [true, /expect\s*\(\s*await\s/, 'Non-web-first assertion. Use `await expect(locator).toX(...)`, not `expect(await locator.textContent())`. (playwright-locators)'],
  [true, /data-testid/, 'This repo tags elements with `data-test` (testIdAttribute). Use getByTestId(...) or [data-test=...].'],
  [true, /page\.\$\$?\s*\(/, 'page.$ / page.$$ return element handles - use locators (getByRole/getByLabel...). (playwright-locators)'],
  [true, /\.only\s*\(/, 'Focused test (.only) - remove it before this lands so the suite stays complete.'],
  // Specs only: a raw product id belongs in src/fixtures/products.ts, not inline.
  [isSpec, /["']p-0\d{2}["']/, 'Raw product id in a spec - import it from src/fixtures/products.ts instead of hard-coding it. (test-craftsmanship: DRY)'],
];

const hits = RULES.filter(([on, re]) => on && re.test(added)).map(([, , msg]) => `  - ${msg}`);

// Filename smell: this repo has NO Page Object Model.
if (/(Page|\.page)\.tsx?$/.test(path))
  hits.push('  - Filename looks like a Page Object. This repo has no POM - put business intent in src/actions/. (test-craftsmanship)');

if (hits.length) {
  console.error(`House-style violations in ${path}:\n${hits.join('\n')}\n\nFix these and try the edit again.`);
  process.exit(2); // block; stderr returns to Claude
}
process.exit(0);
