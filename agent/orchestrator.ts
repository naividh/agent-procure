import chalk from "chalk";
import { discoverServices, rankEndpointsByRelevance } from "./discovery.js";
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
}

export interface AgentResult {
    query: string;
    synthesis: string;
    trail: AuditTrail;
    results: ExecutionResult[];
    trailDisplay: string;
}

export async function runAgent(
    query: string,
    config: AgentConfig
  ): Promise<AgentResult> {
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

  console.log(chalk.cyan("\n[1/5] Discovering services..."));
    const services = await discoverServices(config.serviceUrls);
    console.log(chalk.green("  Found " + services.length + " services"));

  addEntry(trail, {
        action: "DISCOVER",
        service: "agent",
        endpoint: "-",
        cost: "$0.00",
        status: "success",
        reason: "Discovered " + services.length + " services",
  });

  if (services.length === 0) {
        finalizeTrail(trail, "No services found");
        return { query, synthesis: "No services discovered.", trail, results: [], trailDisplay: formatTrailForDisplay(trail) };
  }

  console.log(chalk.cyan("[2/5] Ranking endpoints by relevance..."));
    const ranked = rankEndpointsByRelevance(services, query);
    console.log(chalk.green("  Ranked " + ranked.length + " endpoints"));

  console.log(chalk.cyan("[3/5] Planning budget allocation..."));
    const plan = createBudgetPlan(ranked, config.budget);
    console.log(chalk.green("  Planned " + plan.plannedCalls.length + " calls, skipped " + plan.skippedCalls.length));

  addEntry(trail, {
        action: "BUDGET_PLAN",
        service: "agent",
        endpoint: "-",
        cost: "$0.00",
        status: "success",
        reason: plan.reasoning.split("\n").slice(-1)[0],
  });

  console.log(chalk.cyan("[4/5] Executing API calls with x402 payments..."));
    const paymentFetch = createPaymentFetch(config.privateKey);
    const results = await executePlan(plan, trail, paymentFetch);
    const successCount = results.filter((r) => r.success).length;
    console.log(chalk.green("  Completed: " + successCount + "/" + results.length + " succeeded"));

  console.log(chalk.cyan("[5/5] Synthesizing results with LLM..."));
    const synthesis = await synthesizeResults(query, results, trail);
    console.log(chalk.green("  Synthesis complete"));

  finalizeTrail(trail, synthesis.slice(0, 200));
    const trailDisplay = formatTrailForDisplay(trail);
    console.log(chalk.gray(trailDisplay));
    console.log(chalk.cyan("\n=== AgentProcure Complete ===\n"));

  return { query, synthesis, trail, results, trailDisplay };
}
