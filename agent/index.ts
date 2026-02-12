// Agent barrel exports + smart query param extraction
export { discoverServices, rankEndpointsByRelevance } from "./discovery.js";
export type { ServiceEndpoint, ServiceInfo } from "./discovery.js";
export { createBudgetPlan } from "./budget.js";
export type { PlannedCall, SkippedCall, BudgetPlan } from "./budget.js";
export { createPaymentFetch, executePlan } from "./executor.js";
export type { ExecutionResult } from "./executor.js";
export { synthesizeResults } from "./synthesizer.js";
export { createAuditTrail, addEntry, finalizeTrail, formatTrailForDisplay } from "./audit.js";
export type { AuditEntry, AuditTrail } from "./audit.js";
export { runAgent } from "./orchestrator.js";
export type { AgentConfig, AgentResult } from "./orchestrator.js";

export function extractQueryParams(query: string): Record<string, string> {
    const params: Record<string, string> = {};
    const q = query.toLowerCase();
    const cities = ["san francisco","new york","los angeles","chicago","seattle","london","tokyo","paris"];
    for (const c of cities) { if (q.includes(c)) { params.city = c.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "); break; } }
    if (!params.city) params.city = "San Francisco";
    const topicMap: Record<string,string> = { tech:"technology", ai:"technology", agent:"technology", crypto:"finance", defi:"finance", market:"finance" };
    for (const [kw, topic] of Object.entries(topicMap)) { if (q.includes(kw)) { params.topic = topic; break; } }
    if (!params.topic) params.topic = "technology";
    params.sector = params.topic === "finance" ? "finance" : "technology";
    return params;
}
