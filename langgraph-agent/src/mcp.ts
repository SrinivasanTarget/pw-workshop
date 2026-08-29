import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { JIRA_MCP, REPO_ROOT } from "./config.js";

/**
 * Two MCP servers:
 *  - jira: read the ticket (summary, description, acceptance criteria)
 *  - playwright: the GENERAL Playwright MCP (same engine .mcp.json runs) — a
 *    raw browser driver with the full browser_* surface. No generator_* /
 *    planner_* orchestration tools; the graph writes spec files itself via a
 *    local write_test_file tool.
 */
export function createMcpClient(): MultiServerMCPClient {
  return new MultiServerMCPClient({
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
    additionalToolNamePrefix: "",
    mcpServers: {
      jira: {
        transport: "stdio",
        command: JIRA_MCP.command,
        args: JIRA_MCP.args,
        env: JIRA_MCP.env,
      },
      playwright: {
        transport: "stdio",
        command: "node",
        args: [
          "node_modules/playwright-core/lib/entry/mcp.js",
          "--caps",
          "vision,pdf,devtools,network,storage,testing",
          "--output-dir",
          ".playwright-mcp",
        ],
        cwd: REPO_ROOT,
      },
    },
  });
}

/**
 * Healer client: only the playwright-test MCP (the Test Agents engine).
 * Healing has to execute tests inside the runner — test_run finds failures,
 * test_debug pauses at the failing step with a live browser. Jira is not
 * needed here.
 */
export function createHealerMcpClient(): MultiServerMCPClient {
  return new MultiServerMCPClient({
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
    additionalToolNamePrefix: "",
    mcpServers: {
      "playwright-test": {
        transport: "stdio",
        command: "npx",
        args: ["playwright", "run-test-mcp-server"],
        cwd: REPO_ROOT,
      },
    },
  });
}
