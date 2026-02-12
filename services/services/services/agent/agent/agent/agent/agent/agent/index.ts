import { discoverServices, rankEndpointsByRelevance } from "./discovery.js";
import { createBudgetPlan } from "./budget.js";
import { createPaymentFetch, executePlan } from "./executor.js";
import { synthesizeReport, synthesizeReportLocal } from "./synthesizer.js";
import { createAuditTrail, addEntry, finalizeTrail, formatTrailForDisplay, type AuditTrail } from "./audit.js";

export interface AgentConfig {
  privateKey: string; budget: number; serviceUrls: string[]; openaiApiKey?: string;
  }
  export interface AgentResult {
    report: string; auditTrail: AuditTrail; budgetReasoning: string;
    }

    export async function runAgent(query: string, config: AgentConfig): Promise<AgentResult> {
      console.log("\nAgentProcure starting...\nQuery: " + query + "\nBudget: $" + config.budget.toFixed(2) + "\n");
        const trail = createAuditTrail(query, config.budget);

          // Step 1: Discover
            console.log("Step 1: Discovering paid services...");
              addEntry(trail, { action: "DISCOVER", service: "agent", endpoint: "/discover", cost: "$0.00", status: "pending", reason: "Scanning service registry" });
                const services = await discoverServices(config.serviceUrls);
                  const totalEndpoints = services.reduce((n, s) => n + s.endpoints.length, 0);
                    console.log("  Found " + services.length + " services with " + totalEndpoints + " endpoints\n");
                      addEntry(trail, { action: "DISCOVER_COMPLETE", service: "agent", endpoint: "/discover", cost: "$0.00", status: "success", reason: "Found " + services.length + " services" });

                        // Step 2: Rank
                          console.log("Step 2: Ranking endpoints by relevance...");
                            const ranked = rankEndpointsByRelevance(services, query);
                              for (const r of ranked) console.log("  [" + r.relevanceScore.toFixed(1) + "] " + r.service.name + " - " + r.endpoint.path + " (" + r.endpoint.price + ")");
                                console.log();
                                  addEntry(trail, { action: "RANK", service: "agent", endpoint: "internal", cost: "$0.00", status: "success", reason: "Ranked " + ranked.length + " endpoints" });

                                    // Step 3: Budget
                                      console.log("Step 3: Creating cost-optimized plan...");
                                        const budgetPlan = createBudgetPlan(ranked, config.budget);
                                          console.log(budgetPlan.reasoning + "\n");
                                            addEntry(trail, { action: "BUDGET_PLAN", service: "agent", endpoint: "internal", cost: "$0.00", status: "success", reason: "Planned " + budgetPlan.plannedCalls.length + " calls" });

                                              // Step 4: Execute x402 payments
                                                console.log("Step 4: Executing x402 payment flow...\n");
                                                  const paymentFetch = createPaymentFetch(config.privateKey);
                                                    const results = await executePlan(paymentFetch, budgetPlan.plannedCalls, query, trail);
                                                      const successCount = results.filter((r) => r.success).length;
                                                        console.log("\n  " + successCount + "/" + results.length + " calls succeeded\n");

                                                          // Step 5: Synthesize
                                                            console.log("Step 5: Synthesizing report...\n");
                                                              let report: string;
                                                                if (config.openaiApiKey) {
                                                                    try {
                                                                          report = await synthesizeReport(query, results, budgetPlan, config.openaiApiKey);
                                                                                addEntry(trail, { action: "SYNTHESIZE", service: "OpenAI", endpoint: "gpt-4o-mini", cost: "$0.00", status: "success", reason: "LLM synthesis complete" });
                                                                                    } catch (err: any) {
                                                                                          console.log("  LLM failed, using local fallback: " + err.message);
                                                                                                report = synthesizeReportLocal(query, results, budgetPlan);
                                                                                                      addEntry(trail, { action: "SYNTHESIZE_FALLBACK", service: "local", endpoint: "internal", cost: "$0.00", status: "success", reason: "Local synthesis" });
                                                                                                          }
                                                                                                            } else {
                                                                                                                report = synthesizeReportLocal(query, results, budgetPlan);
                                                                                                                    addEntry(trail, { action: "SYNTHESIZE_LOCAL", service: "local", endpoint: "internal", cost: "$0.00", status: "success", reason: "Local synthesis (no API key)" });
                                                                                                                      }

                                                                                                                        finalizeTrail(trail, "Completed: " + query + ". Spent $" + trail.totalSpent.toFixed(4) + " of $" + config.budget.toFixed(2));
                                                                                                                          console.log(formatTrailForDisplay(trail));
                                                                                                                            console.log(report);
                                                                                                                              return { report, auditTrail: trail, budgetReasoning: budgetPlan.reasoning };
                                                                                                                              }