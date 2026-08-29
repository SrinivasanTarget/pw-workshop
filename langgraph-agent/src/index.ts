import { assertEnv } from "./config.js";
import { createMcpClient } from "./mcp.js";
import { buildGraph } from "./graph.js";

/**
 * Phase 1 — Jira ticket -> Playwright tests.
 *
 *   fetch_issue (Jira MCP) -> plan_tests (LLM) -> generate_tests
 *   (general playwright MCP + write_test_file, driven by
 *    .claude/agents/playwright-test-generator.md)
 *
 * Usage: npm run agent -- PROJ-123
 */
async function main() {
  const issueKey = process.argv[2];
  if (!issueKey) {
    console.error("Usage: npm run agent -- <JIRA-ISSUE-KEY>   e.g. npm run agent -- PROJ-123");
    process.exit(1);
  }
  assertEnv();

  const client = createMcpClient();
  try {
    const jiraTools = await client.getTools("jira");
    // Mirror the repo's deny policy: never expose browser_run_code_unsafe.
    const playwrightTools = (await client.getTools("playwright")).filter(
      (t) => !t.name.includes("run_code_unsafe")
    );
    console.log(
      `Loaded ${jiraTools.length} Jira tool(s), ${playwrightTools.length} playwright tool(s)`
    );

    const graph = buildGraph(jiraTools, playwrightTools);
    const finalState = await graph.invoke({ issueKey });

    console.log("\n================ RESULTS ================\n");
    for (const line of finalState.results) console.log(line + "\n");
    console.log("Run the generated tests with: npm test (from the repo root)");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
