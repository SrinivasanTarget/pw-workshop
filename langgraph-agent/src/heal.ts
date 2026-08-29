import { assertHealEnv } from "./config.js";
import { createHealerMcpClient } from "./mcp.js";
import { buildHealGraph } from "./healGraph.js";

/**
 * Phase 2 — self-healing tests.
 *
 *   run_tests (JSON reporter) -> heal_failures (playwright-test MCP, driven by
 *   .claude/agents/playwright-test-healer.md) -> verify (re-run + heal-summary.md)
 *
 * Exits 0 when the suite ends green, 1 when failures remain — CI uses the
 * summary file for the job summary and the heal PR body.
 *
 * Usage: npm run heal
 */
async function main() {
  assertHealEnv();

  const client = createHealerMcpClient();
  try {
    const tools = await client.getTools("playwright-test");
    console.log(`Loaded ${tools.length} playwright-test tool(s)`);

    const graph = buildHealGraph(tools);
    const finalState = await graph.invoke({}, { recursionLimit: 50 });

    console.log("\n================ HEAL REPORT ================\n");
    console.log(finalState.summary);
    process.exitCode = finalState.allPassing ? 0 : 1;
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
