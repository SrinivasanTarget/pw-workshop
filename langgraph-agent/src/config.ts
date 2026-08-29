import * as path from "node:path";
import * as url from "node:url";
import "dotenv/config";

const here = path.dirname(url.fileURLToPath(import.meta.url));

/** Repo root (pw-workshop) — the playwright-test MCP must run from here so it
 *  finds playwright.config.ts and tests/seed.spec.ts. */
export const REPO_ROOT = path.resolve(here, "..", "..");

/** The Claude Code subagent definition we reuse as the generator's system prompt. */
export const GENERATOR_PROMPT_PATH = path.join(
  REPO_ROOT,
  ".claude",
  "agents",
  "playwright-test-generator.md"
);

/** The Claude Code subagent definition we reuse as the healer's system prompt. */
export const HEALER_PROMPT_PATH = path.join(
  REPO_ROOT,
  ".claude",
  "agents",
  "playwright-test-healer.md"
);

export const MODEL = process.env.AGENT_MODEL ?? "claude-sonnet-5";

/** The app under test — the general playwright MCP has no test-runner baseURL,
 *  so the generator navigates to full URLs. Matches playwright.config.ts. */
export const APP_BASE_URL =
  process.env.APP_BASE_URL ?? "https://playwright-workshop.pages.dev";

/** Jira MCP server launch config. Defaults to the community mcp-atlassian
 *  server (https://github.com/sooperset/mcp-atlassian) run via uvx, driven by
 *  JIRA_URL / JIRA_USERNAME / JIRA_API_TOKEN. Override the command with
 *  JIRA_MCP_COMMAND / JIRA_MCP_ARGS (space-separated) to use any other server. */
export const JIRA_MCP = {
  command: process.env.JIRA_MCP_COMMAND ?? "uvx",
  args: process.env.JIRA_MCP_ARGS?.split(" ") ?? ["mcp-atlassian"],
  env: {
    JIRA_URL: process.env.JIRA_URL ?? "",
    JIRA_USERNAME: process.env.JIRA_USERNAME ?? "",
    JIRA_API_TOKEN: process.env.JIRA_API_TOKEN ?? "",
  },
};

/** The heal command only talks to Anthropic + the local playwright-test MCP. */
export function assertHealEnv(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set (see .env.example)");
  }
}

export function assertEnv(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set (see .env.example)");
  }
  if (!process.env.JIRA_MCP_COMMAND && !process.env.JIRA_URL) {
    throw new Error(
      "Set JIRA_URL / JIRA_USERNAME / JIRA_API_TOKEN for the default mcp-atlassian server, " +
        "or JIRA_MCP_COMMAND / JIRA_MCP_ARGS for a custom Jira MCP server (see .env.example)"
    );
  }
}
