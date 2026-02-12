// Agent module barrel exports

// Discovery
export { discoverServices, rankEndpointsByRelevance, rankEndpointsWithLLM } from "./discovery.js";
export type { ServiceEndpoint, ServiceInfo, RankedEndpoint } from "./discovery.js";

// Budget
export { createBudgetPlan } from "./budget.js";
export type { PlannedCall, SkippedCall, BudgetPlan } from "./budget.js";

// Executor
export { createPaymentFetch, executePlan } from "./executor.js";
export type { ExecutionResult, ExecutorConfig } from "./executor.js";

// Synthesizer
export { synthesizeResults } from "./synthesizer.js";

// Audit
export { createAuditTrail, addEntry, finalizeTrail, formatTrailForDisplay } from "./audit.js";
export type { AuditEntry, AuditTrail } from "./audit.js";

// Orchestrator
export { runAgent } from "./orchestrator.js";
export type { AgentConfig, AgentResult, StepTiming } from "./orchestrator.js";
