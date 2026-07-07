import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import { z } from "zod";
import { MODEL, REPO_ROOT } from "./config.js";
import { loadHealerSystemPrompt } from "./prompts.js";

// ---------------------------------------------------------------------------
// Deterministic test running (no LLM)
// ---------------------------------------------------------------------------

export interface FailingTest {
  title: string;
  error: string;
}

export interface FailingSpec {
  file: string;
  tests: FailingTest[];
}

interface SuiteRun {
  failures: FailingSpec[];
  stats: { expected: number; unexpected: number; flaky: number; skipped: number };
}

const JSON_REPORT = path.join("test-results", "heal-run.json");

/** Run the whole suite with the JSON reporter and collect failing specs. */
function runSuite(): SuiteRun {
  spawnSync("npx", ["playwright", "test", "--reporter=json"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: JSON_REPORT },
    // JSON output goes to the file; a non-zero exit just means failures.
    stdio: "ignore",
  });
  const report = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, JSON_REPORT), "utf8")
  );

  const byFile = new Map<string, FailingTest[]>();
  const walk = (suite: any) => {
    for (const spec of suite.specs ?? []) {
      if (spec.ok) continue;
      // spec.file is relative to testDir; normalize to a repo-root path.
      const rel = spec.file.startsWith("tests/") ? spec.file : path.join("tests", spec.file);
      const errors = (spec.tests ?? [])
        .flatMap((t: any) => t.results ?? [])
        .map((r: any) => r.error?.message ?? "")
        .filter(Boolean);
      const list = byFile.get(rel) ?? [];
      list.push({ title: spec.title, error: errors.at(-1) ?? "unknown error" });
      byFile.set(rel, list);
    }
    for (const child of suite.suites ?? []) walk(child);
  };
  for (const suite of report.suites ?? []) walk(suite);

  return {
    failures: [...byFile.entries()].map(([file, tests]) => ({ file, tests })),
    stats: report.stats ?? { expected: 0, unexpected: 0, flaky: 0, skipped: 0 },
  };
}

// ---------------------------------------------------------------------------
// Local file tools for the healer (replace Claude Code's Read/Edit/Write)
// ---------------------------------------------------------------------------

function resolveSpecPath(file: string, forWrite: boolean): string | null {
  const rel = path.normalize(file);
  if (rel.startsWith("..") || path.isAbsolute(rel) || !rel.startsWith("tests" + path.sep)) return null;
  if (forWrite && (!rel.endsWith(".spec.ts") || rel === path.join("tests", "seed.spec.ts"))) return null;
  return path.join(REPO_ROOT, rel);
}

const readTestFile = tool(
  async ({ file }: { file: string }) => {
    const abs = resolveSpecPath(file, false);
    if (!abs) return `Refused: file must be a relative path under tests/, got "${file}"`;
    if (!fs.existsSync(abs)) return `Not found: ${file}`;
    return fs.readFileSync(abs, "utf8");
  },
  {
    name: "read_test_file",
    description: "Read a test file. Path is relative to the repo root, e.g. tests/login/valid-login.spec.ts",
    schema: z.object({ file: z.string() }),
  }
);

const editTestFile = tool(
  async ({ file, old_string, new_string }: { file: string; old_string: string; new_string: string }) => {
    const abs = resolveSpecPath(file, true);
    if (!abs) return `Refused: can only edit .spec.ts files under tests/ (not seed.spec.ts), got "${file}"`;
    if (!fs.existsSync(abs)) return `Not found: ${file}`;
    const source = fs.readFileSync(abs, "utf8");
    const count = source.split(old_string).length - 1;
    if (count === 0) return `old_string not found in ${file} — read the file and retry with an exact match`;
    if (count > 1) return `old_string matches ${count} times in ${file} — provide a longer, unique string`;
    fs.writeFileSync(abs, source.replace(old_string, new_string), "utf8");
    return `Edited ${file}`;
  },
  {
    name: "edit_test_file",
    description: "Fix a test by replacing an exact string. old_string must match the file content exactly and be unique.",
    schema: z.object({
      file: z.string(),
      old_string: z.string(),
      new_string: z.string(),
    }),
  }
);

const writeTestFileFull = tool(
  async ({ file, source }: { file: string; source: string }) => {
    const abs = resolveSpecPath(file, true);
    if (!abs) return `Refused: can only write .spec.ts files under tests/ (not seed.spec.ts), got "${file}"`;
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, source, "utf8");
    return `Wrote ${file} (${source.length} bytes)`;
  },
  {
    name: "write_test_file",
    description: "Overwrite a test file with complete new source. Prefer edit_test_file for targeted fixes.",
    schema: z.object({ file: z.string(), source: z.string() }),
  }
);

/** The MCP tools the healer subagent definition names (plus nothing else). */
const HEALER_MCP_TOOLS = new Set([
  "test_run",
  "test_debug",
  "test_list",
  "browser_snapshot",
  "browser_generate_locator",
  "browser_console_messages",
  "browser_evaluate",
  "browser_network_request",
  "browser_network_requests",
]);

// ---------------------------------------------------------------------------
// Graph state
// ---------------------------------------------------------------------------

const HealState = Annotation.Root({
  failures: Annotation<FailingSpec[]>,
  healLog: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
  allPassing: Annotation<boolean>,
  summary: Annotation<string>,
});

export type HealStateType = typeof HealState.State;

export const HEAL_SUMMARY_FILE = path.join(REPO_ROOT, "heal-summary.md");

// ---------------------------------------------------------------------------
// Graph factory
// ---------------------------------------------------------------------------

export function buildHealGraph(playwrightTestTools: StructuredToolInterface[]) {
  const model = new ChatAnthropic({ model: MODEL });
  const healerSystemPrompt = loadHealerSystemPrompt();
  const mcpTools = playwrightTestTools.filter((t) => HEALER_MCP_TOOLS.has(t.name));

  /** Node 1 — deterministic suite run to find failures. */
  async function runTests(_state: HealStateType) {
    console.log("[run_tests] running the suite with the JSON reporter...");
    const { failures, stats } = runSuite();
    console.log(
      `[run_tests] ${stats.expected} passed, ${stats.unexpected} failed` +
        (failures.length ? ` — failing specs: ${failures.map((f) => f.file).join(", ")}` : "")
    );
    return { failures, allPassing: failures.length === 0 };
  }

  /** Node 2 — one healer agent per failing spec, sequential (single browser). */
  async function healFailures(state: HealStateType) {
    const healLog: string[] = [];
    for (const spec of state.failures) {
      for (const failing of spec.tests) {
        console.log(`[heal] ${spec.file} › ${failing.title}`);
        const healer = createReactAgent({
          llm: model,
          tools: [...mcpTools, readTestFile, editTestFile, writeTestFileFull],
          prompt: healerSystemPrompt,
        });
        const task = [
          `Heal this failing Playwright test:`,
          ``,
          `- File: ${spec.file}`,
          `- Test title: ${failing.title}`,
          `- Failure:`,
          "```",
          failing.error,
          "```",
        ].join("\n");
        try {
          const result = await healer.invoke(
            { messages: [new HumanMessage(task)] },
            { recursionLimit: 150 }
          );
          const last = result.messages.at(-1);
          const note = typeof last?.content === "string" ? last.content : JSON.stringify(last?.content);
          healLog.push(`### ${spec.file} › ${failing.title}\n\n${note}`);
        } catch (err) {
          healLog.push(`### ${spec.file} › ${failing.title}\n\n❌ Healer error: ${String(err)}`);
        }
      }
    }
    return { healLog };
  }

  /** Node 3 — deterministic re-run + heal-summary.md for CI / the PR body. */
  async function verify(state: HealStateType) {
    let summary: string;
    let allPassing: boolean;

    if (state.allPassing) {
      allPassing = true;
      summary = "# Heal report\n\nAll tests passing — nothing to heal.\n";
    } else {
      console.log("[verify] re-running the suite...");
      const { failures, stats } = runSuite();
      allPassing = failures.length === 0;
      summary = [
        "# Heal report",
        "",
        "## Originally failing",
        ...state.failures.flatMap((f) => f.tests.map((t) => `- \`${f.file}\` › ${t.title}`)),
        "",
        "## What the healer did",
        "",
        ...state.healLog,
        "",
        "## Final run",
        `- ${stats.expected} passed, ${stats.unexpected} failed, ${stats.flaky} flaky, ${stats.skipped} skipped`,
        ...(allPassing
          ? ["- ✅ Suite is green."]
          : failures.flatMap((f) => f.tests.map((t) => `- ❌ still failing: \`${f.file}\` › ${t.title}`))),
        "",
      ].join("\n");
    }

    fs.writeFileSync(HEAL_SUMMARY_FILE, summary, "utf8");
    console.log(`[verify] ${allPassing ? "suite is green" : "failures remain"} — summary written to heal-summary.md`);
    return { allPassing, summary };
  }

  return new StateGraph(HealState)
    .addNode("run_tests", runTests)
    .addNode("heal_failures", healFailures)
    .addNode("verify", verify)
    .addEdge(START, "run_tests")
    .addConditionalEdges("run_tests", (s) => (s.allPassing ? "verify" : "heal_failures"), [
      "heal_failures",
      "verify",
    ])
    .addEdge("heal_failures", "verify")
    .addEdge("verify", END)
    .compile();
}
