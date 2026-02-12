import chalk from "chalk";
import { discoverServices, rankEndpointsByRelevance, rankEndpointsWithLLM } from "./discovery.js";
import { createBudgetPlan } from "./budget.js";
import { createAuditTrail, addEntry, finalizeTrail, formatTrailForDisplay } from "./audit.js";
import { createPaymentFetch, executePlan } from "./executor.js";
import { synthesizeResults } from "./synthesizer.js";
import type { AuditTrail } from "./audit.js";
import type { ExecutionResult } from "./executor.js";

export interface AgentConfig {
  privateKey: string;
  serviceUrls: string[];
  budget: number;
  useLLMRanking?: boolean;
}

export interface StepTiming {
  step: string;
  durationMs: number;
}

export interface AgentResult {
  query: string;
  synthesis: string;
  trail: AuditTrail;
  results: ExecutionResult[];
  trailDisplay: string;
  timings: StepTiming[];
  totalDurationMs: number;
}

export async function runAgent(
  query: string,
  config: AgentConfig
): Promise<AgentResult> {
  const agentStart = Date.now();
  const timings: StepTiming[] = [];

  console.log(chalk.cyan("\n=== AgentProcure Starting ==="));
  console.log(chalk.white("Query: ") + chalk.yellow(query));
  console.log(chalk.white("Budget: ") + chalk.green("$" + config.budget.toFixed(2)));

  const trail = createAuditTrail(query, config.budget);
  addEntry(trail, {
    action: "INIT",
    service: "agent",
    endpoint: "-",
    cost: "$0.00",
    status: "success",
    reason: "Agent initialized with budget $" + config.budget.toFixed(2),
  });

  // Step 1: Discover
  console.log(chalk.cyan("\n[1/5] Discovering services..."));
  let stepStart = Date.now();
  const services = await discoverServices(config.serviceUrls);
  timings.push({ step: "discovery", durationMs: Date.now() - stepStart });
  console.log(chalk.green("  Found " + services.length + " services (" + timings[0].durationMs + "ms)"));

  addEntry(trail, {
    action: "DISCOVER",
    service: "agent",
    endpoint: "-",
    cost: "$0.00",
    status: "success",
    reason: "Discovered " + services.length + " services with " +
      services.reduce((n, s) => n + s.endpoints.length, 0) + " endpoints",
  });

  if (services.length === 0) {
    finalizeTrail(trail, "No services found");
    return {
      query, synthesis: "No services discovered.", trail, results: [],
      trailDisplay: formatTrailForDisplay(trail), timings, totalDurationMs: Date.now() - agentStart,
    };
  }

  // Step 2: Rank
  console.log(chalk.cyan("[2/5] Ranking endpoints by relevance..."));
  stepStart = Date.now();
  const ranked = config.useLLMRanking
    ? await rankEndpointsWithLLM(services, query)
    : rankEndpointsByRelevance(services, query);
  timings.push({ step: "ranking", durationMs: Date.now() - stepStart });
  console.log(chalk.green("  Ranked " + ranked.length + " endpoints (" + timings[1].durationMs + "ms)"));

  // Step 3: Budget
  console.log(chalk.cyan("[3/5] Planning budget allocation..."));
  stepStart = Date.now();
  const plan = createBudgetPlan(ranked, config.budget);
  timings.push({ step: "budgeting", durationMs: Date.now() - stepStart });
  console.log(chalk.green("  Planned " + plan.plannedCalls.length + " calls, skipped " + plan.skippedCalls.length));

  const estimatedSpend = plan.plannedCalls.reduce(
    (sum, c) => sum + parseFloat(c.endpoint.price.replace("$", "")), 0
  );
  addEntry(trail, {
    action: "BUDGET_PLAN",
    service: "agent",
    endpoint: "-",
    cost: "$0.00",
    status: "success",
    reason: "Planned " + plan.plannedCalls.length + " calls, est. spend $" + estimatedSpend.toFixed(4),
  });

  // Step 4: Execute with x402 payments
  console.log(chalk.cyan("[4/5] Executing API calls with x402 payments..."));
  stepStart = Date.now();
  const paymentFetch = createPaymentFetch(config.privateKey);
  const results = await executePlan(plan, trail, paymentFetch, { query });
  timings.push({ step: "execution", durationMs: Date.now() - stepStart });

  const successCount = results.filter((r) => r.success).length;
  console.log(chalk.green("  Completed: " + successCount + "/" + results.length + " succeeded (" + timings[3].durationMs + "ms)"));

  // Step 5: Synthesize
  console.log(chalk.cyan("[5/5] Synthesizing results with LLM..."));
  stepStart = Date.now();
  const synthesis = await synthesizeResults(query, results, trail);
  timings.push({ step: "synthesis", durationMs: Date.now() - stepStart });
  console.log(chalk.green("  Synthesis complete (" + timings[4].durationMs + "ms)"));

  finalizeTrail(trail, synthesis.slice(0, 200));
  const trailDisplay = formatTrailForDisplay(trail);
  const totalDurationMs = Date.now() - agentStart;

  console.log(chalk.gray(trailDisplay));
  console.log(chalk.cyan("\n=== AgentProcure Complete (" + (totalDurationMs / 1000).toFixed(1) + "s) ===\n"));

  return { query, synthesis, trail, results, trailDisplay, timings, totalDurationMs };
}
