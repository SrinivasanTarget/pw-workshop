import * as fs from "node:fs";
import * as path from "node:path";
import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool, type StructuredToolInterface } from "@langchain/core/tools";
import { OutputParserException } from "@langchain/core/output_parsers";
import { z } from "zod";
import { APP_BASE_URL, MODEL, REPO_ROOT } from "./config.js";
import {
  JIRA_FETCH_PROMPT,
  PLANNER_SYSTEM_PROMPT,
  loadGeneratorSystemPrompt,
} from "./prompts.js";

// ---------------------------------------------------------------------------
// Test plan schema (what the planner node produces, what the generator consumes)
// ---------------------------------------------------------------------------

const scenarioSchema = z.object({
  suite: z.string().describe("Top-level describe block, e.g. the feature name"),
  name: z.string().describe("Scenario name, becomes the test title"),
  file: z
    .string()
    .describe("Target spec path under tests/, e.g. tests/login/valid-login.spec.ts"),
  steps: z.array(z.string()).describe("Ordered, concrete user actions"),
  expectations: z.array(z.string()).describe("Verifications tied to the steps"),
});

const testPlanSchema = z.object({
  scenarios: z.array(scenarioSchema).min(1),
});

export type TestScenario = z.infer<typeof scenarioSchema>;

/** The model occasionally double-encodes the planner's structured output —
 *  returning the whole `{"scenarios": [...]}` object as a JSON string inside
 *  the "scenarios" field instead of the array itself. Unwrap that specific
 *  shape before giving up on the tool call. */
function recoverTestPlan(err: unknown): z.infer<typeof testPlanSchema> {
  if (!(err instanceof OutputParserException) || typeof err.llmOutput !== "string") {
    throw err;
  }

  let candidate: unknown;
  try {
    candidate = JSON.parse(err.llmOutput);
  } catch {
    throw err;
  }

  if (
    candidate &&
    typeof candidate === "object" &&
    typeof (candidate as Record<string, unknown>).scenarios === "string"
  ) {
    try {
      candidate = JSON.parse((candidate as Record<string, string>).scenarios);
    } catch {
      throw err;
    }
  }

  const result = testPlanSchema.safeParse(candidate);
  if (!result.success) throw err;
  return result.data;
}

// ---------------------------------------------------------------------------
// Graph state
// ---------------------------------------------------------------------------

const AgentState = Annotation.Root({
  issueKey: Annotation<string>,
  issueDetails: Annotation<string>,
  scenarios: Annotation<TestScenario[]>,
  results: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;

/** Local replacement for the test MCP's generator_write_test: saves the spec
 *  the agent produces. Restricted to .spec.ts files under tests/. */
const writeTestFile = tool(
  async ({ file, source }: { file: string; source: string }) => {
    const rel = path.normalize(file);
    if (rel.startsWith("..") || path.isAbsolute(rel) || !rel.startsWith("tests" + path.sep)) {
      return `Refused: file must be a relative path under tests/, got "${file}"`;
    }
    if (!rel.endsWith(".spec.ts")) {
      return `Refused: file must end in .spec.ts, got "${file}"`;
    }
    const abs = path.join(REPO_ROOT, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, source, "utf8");
    return `Wrote ${rel} (${source.length} bytes)`;
  },
  {
    name: "write_test_file",
    description:
      "Save the generated Playwright spec. Call once, after all steps have been " +
      "executed live in the browser, with the complete TypeScript source.",
    schema: z.object({
      file: z.string().describe("Relative path under tests/, e.g. tests/login/valid-login.spec.ts"),
      source: z.string().describe("Full TypeScript source of the spec file"),
    }),
  }
);

// ---------------------------------------------------------------------------
// Graph factory
// ---------------------------------------------------------------------------

export function buildGraph(
  jiraTools: StructuredToolInterface[],
  playwrightTools: StructuredToolInterface[]
) {
  const model = new ChatAnthropic({ model: MODEL });
  const generatorSystemPrompt = loadGeneratorSystemPrompt();

  /** Node 1 — fetch the ticket through the Jira MCP tools. */
  async function fetchIssue(state: AgentStateType) {
    const jiraAgent = createReactAgent({ llm: model, tools: jiraTools });
    const result = await jiraAgent.invoke({
      messages: [new HumanMessage(JIRA_FETCH_PROMPT(state.issueKey))],
    });
    const last = result.messages.at(-1);
    const issueDetails =
      typeof last?.content === "string"
        ? last.content
        : JSON.stringify(last?.content);
    console.log(`\n[fetch_issue] ${state.issueKey} fetched from Jira\n`);
    return { issueDetails };
  }

  /** Node 2 — turn the ticket into concrete scenarios (structured output). */
  async function planTests(state: AgentStateType) {
    const planner = model.withStructuredOutput(testPlanSchema, {
      name: "test_plan",
    });
    let plan: z.infer<typeof testPlanSchema>;
    try {
      plan = await planner.invoke([
        new SystemMessage(PLANNER_SYSTEM_PROMPT),
        new HumanMessage(
          `Jira ticket ${state.issueKey}:\n\n${state.issueDetails}`
        ),
      ]);
    } catch (err) {
      plan = recoverTestPlan(err);
    }
    console.log(
      `[plan_tests] ${plan.scenarios.length} scenario(s): ` +
        plan.scenarios.map((s) => s.name).join(" | ") +
        "\n"
    );
    return { scenarios: plan.scenarios };
  }

  /** Node 3 — run the playwright-test-generator prompt once per scenario.
   *  Sequential on purpose: the playwright MCP drives a single browser
   *  session, so scenarios must not interleave. */
  async function generateTests(state: AgentStateType) {
    const results: string[] = [];
    for (const scenario of state.scenarios) {
      const generator = createReactAgent({
        llm: model,
        tools: [...playwrightTools, writeTestFile],
        prompt: generatorSystemPrompt,
      });
      const task = [
        `<test-suite>${scenario.suite}</test-suite>`,
        `<test-name>${scenario.name}</test-name>`,
        `<test-file>${scenario.file}</test-file>`,
        `<app-url>${APP_BASE_URL}</app-url>`,
        "<body>",
        "**Steps:**",
        ...scenario.steps.map((s, i) => `${i + 1}. ${s}`),
        "",
        "**Expectations:**",
        ...scenario.expectations.map((e) => `- ${e}`),
        "</body>",
      ].join("\n");

      console.log(`[generate_tests] generating: ${scenario.name}`);
      try {
        const result = await generator.invoke(
          { messages: [new HumanMessage(task)] },
          { recursionLimit: 120 }
        );
        const last = result.messages.at(-1);
        const summary =
          typeof last?.content === "string"
            ? last.content
            : JSON.stringify(last?.content);
        results.push(`✅ ${scenario.file} — ${scenario.name}\n${summary}`);
      } catch (err) {
        results.push(`❌ ${scenario.file} — ${scenario.name}: ${String(err)}`);
      }
    }
    return { results };
  }

  return new StateGraph(AgentState)
    .addNode("fetch_issue", fetchIssue)
    .addNode("plan_tests", planTests)
    .addNode("generate_tests", generateTests)
    .addEdge(START, "fetch_issue")
    .addEdge("fetch_issue", "plan_tests")
    .addEdge("plan_tests", "generate_tests")
    .addEdge("generate_tests", END)
    .compile();
}
