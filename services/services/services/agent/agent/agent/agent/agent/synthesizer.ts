import OpenAI from "openai";
import type { ExecutionResult } from "./executor.js";
import type { BudgetPlan } from "./budget.js";

export async function synthesizeReport(query: string, results: ExecutionResult[], budgetPlan: BudgetPlan, apiKey: string): Promise<string> {
  const successfulResults = results.filter((r) => r.success);
    if (successfulResults.length === 0) return "# Research Report\n\n**Query:** " + query + "\n\nNo data sources returned results. All " + results.length + " paid API calls failed.";

      const dataContext = successfulResults.map((r, i) => "Source " + (i + 1) + " (" + r.service + " - " + r.endpoint + ", cost: " + r.cost + "):\n" + JSON.stringify(r.data, null, 2)).join("\n\n---\n\n");
        const openai = new OpenAI({ apiKey });
          const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
                  messages: [
                        { role: "system", content: "You are a research analyst. Synthesize data from multiple paid API sources into a clear, actionable report. Include: 1. Executive Summary 2. Key Findings 3. Data Highlights 4. Recommendations 5. Methodology. Format as clean Markdown." },
                              { role: "user", content: "Research query: \"" + query + "\"\n\nBudget: $" + budgetPlan.totalBudget.toFixed(2) + " | Spent: $" + (budgetPlan.totalBudget - budgetPlan.remainingBudget).toFixed(4) + " | Sources: " + successfulResults.length + "\n\nData:\n" + dataContext },
                                  ],
                                      max_tokens: 2000, temperature: 0.3,
                                        });
                                          return completion.choices[0]?.message?.content || "Failed to generate report.";
                                          }

                                          export function synthesizeReportLocal(query: string, results: ExecutionResult[], budgetPlan: BudgetPlan): string {
                                            const successfulResults = results.filter((r) => r.success);
                                              let report = "# AgentProcure Research Report\n\n";
                                                report += "**Query:** " + query + "\n\n";
                                                  report += "**Budget:** $" + budgetPlan.totalBudget.toFixed(2) + " | **Spent:** $" + (budgetPlan.totalBudget - budgetPlan.remainingBudget).toFixed(4) + " | **Sources:** " + successfulResults.length + "/" + results.length + "\n\n---\n\n";
                                                    report += "## Executive Summary\n\nThis report was autonomously compiled by AgentProcure, which discovered " + budgetPlan.plannedCalls.length + " relevant paid data sources, performed cost-value analysis, and paid for " + successfulResults.length + " API calls using x402 payments on Base Sepolia.\n\n";
                                                      report += "## Data Sources & Findings\n\n";
                                                        for (const result of successfulResults) {
                                                            report += "### " + result.service + " (" + result.endpoint + ")\n";
                                                                report += "- **Cost:** " + result.cost + "\n- **Response Time:** " + result.duration + "ms\n";
                                                                    report += "- **Data:**\n```json\n" + JSON.stringify(result.data, null, 2) + "\n```\n\n";
                                                                      }
                                                                        if (budgetPlan.skippedCalls.length > 0) {
                                                                            report += "## Skipped Sources\n\n";
                                                                                for (const skip of budgetPlan.skippedCalls) report += "- **" + skip.service.name + "** " + skip.endpoint.path + " ($" + skip.estimatedCost + ") - " + skip.reason + "\n";
                                                                                    report += "\n";
                                                                                      }
                                                                                        report += "## Budget Analysis\n\n" + budgetPlan.reasoning + "\n";
                                                                                          return report;
                                                                                          }