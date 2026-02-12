import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import type { PlannedCall, BudgetPlan } from "./budget.js";
import type { AuditTrail } from "./audit.js";
import { addEntry } from "./audit.js";

export interface ExecutionResult {
    service: string;
    endpoint: string;
    data: any;
    cost: string;
    duration: number;
    success: boolean;
    error?: string;
}

export function createPaymentFetch(privateKey: string) {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    return wrapFetchWithPaymentFromConfig(fetch, {
          schemes: [
            {
                      network: "eip155:84532",
                      client: new ExactEvmScheme(account),
            },
                ],
    });
}

export async function executePlan(
    plan: BudgetPlan,
    trail: AuditTrail,
    paymentFetch: typeof fetch
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

  for (const planned of plan.plannedCalls) {
        const { service, endpoint } = planned;
        const url = buildUrl(service.baseUrl, endpoint.path, endpoint.params);
        const startTime = Date.now();

      try {
              addEntry(trail, {
                        action: "API_CALL",
                        service: service.name,
                        endpoint: endpoint.path,
                        cost: endpoint.price,
                        status: "pending",
                        reason: planned.reason,
              });

          const response = await paymentFetch(url, {
                    method: endpoint.method || "GET",
                    headers: { "Content-Type": "application/json" },
          });

          const duration = Date.now() - startTime;

          if (!response.ok && response.status !== 402) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          const txHash = response.headers.get("PAYMENT-RESPONSE") || undefined;

          addEntry(trail, {
                    action: "API_RESPONSE",
                    service: service.name,
                    endpoint: endpoint.path,
                    cost: endpoint.price,
                    status: "success",
                    reason: "Data received successfully",
                    responsePreview: JSON.stringify(data).slice(0, 200),
                    txHash,
                    duration,
          });

          results.push({
                    service: service.name,
                    endpoint: endpoint.path,
                    data,
                    cost: endpoint.price,
                    duration,
                    success: true,
          });
      } catch (error: any) {
              const duration = Date.now() - startTime;
              const errorMsg = error?.message || "Unknown error";

          addEntry(trail, {
                    action: "API_ERROR",
                    service: service.name,
                    endpoint: endpoint.path,
                    cost: "$0.00",
                    status: "failed",
                    reason: errorMsg,
                    duration,
          });

          results.push({
                    service: service.name,
                    endpoint: endpoint.path,
                    data: null,
                    cost: "$0.00",
                    duration,
                    success: false,
                    error: errorMsg,
          });
      }
  }

  for (const skipped of plan.skippedCalls) {
        addEntry(trail, {
                action: "SKIPPED",
                service: skipped.service.name,
                endpoint: skipped.endpoint.path,
                cost: "$0.00",
                status: "skipped",
                reason: skipped.reason,
        });
  }

  return results;
}

function buildUrl(
    baseUrl: string,
    path: string,
    params: Record<string, string>
  ): string {
    const url = new URL(path, baseUrl);
    for (const [key, _type] of Object.entries(params)) {
          if (key === "city") url.searchParams.set(key, "San Francisco");
          else if (key === "topic") url.searchParams.set(key, "technology");
          else if (key === "sector") url.searchParams.set(key, "technology");
          else url.searchParams.set(key, "default");
    }
    return url.toString();
}
