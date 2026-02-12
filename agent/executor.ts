import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
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
  txHash?: string;
  retries?: number;
}

export interface ExecutorConfig {
  maxRetries?: number;
  retryDelayMs?: number;
  concurrency?: number;
  query?: string;
}

// Create x402 payment-enabled fetch wrapper
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

// Extract smart query params from user query
function extractQueryParams(query: string): Record<string, string> {
  const q = query.toLowerCase();
  const params: Record<string, string> = {};

  const cities = [
    "san francisco", "new york", "los angeles", "chicago", "seattle",
    "london", "tokyo", "paris", "berlin", "sydney", "toronto", "miami",
  ];
  for (const c of cities) {
    if (q.includes(c)) {
      params.city = c.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
      break;
    }
  }
  if (!params.city) params.city = "San Francisco";

  const topicMap: Record<string, string> = {
    tech: "technology", ai: "technology", agent: "technology",
    crypto: "finance", defi: "finance", market: "finance", stock: "finance",
  };
  for (const [kw, topic] of Object.entries(topicMap)) {
    if (q.includes(kw)) { params.topic = topic; break; }
  }
  if (!params.topic) params.topic = "technology";
  params.sector = params.topic === "finance" ? "finance" : "technology";

  return params;
}

// Build URL with smart query params
function buildUrl(
  baseUrl: string,
  path: string,
  endpointParams: Record<string, string>,
  queryParams: Record<string, string>
): string {
  const url = new URL(path, baseUrl);
  for (const [key] of Object.entries(endpointParams)) {
    url.searchParams.set(key, queryParams[key] || "default");
  }
  return url.toString();
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelay: number
): Promise<{ result: T; retries: number }> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (error: any) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// Execute planned API calls with x402 payments, retry, and concurrency
export async function executePlan(
  plan: BudgetPlan,
  trail: AuditTrail,
  paymentFetch: typeof fetch,
  config: ExecutorConfig = {}
): Promise<ExecutionResult[]> {
  const { maxRetries = 2, retryDelayMs = 500, concurrency = 3, query = "" } = config;
  const queryParams = extractQueryParams(query);
  const results: ExecutionResult[] = [];

  // Execute in batches for controlled concurrency
  const batches: PlannedCall[][] = [];
  for (let i = 0; i < plan.plannedCalls.length; i += concurrency) {
    batches.push(plan.plannedCalls.slice(i, i + concurrency));
  }

  for (const batch of batches) {
    const batchResults = await Promise.allSettled(
      batch.map(async (planned) => {
        const { service, endpoint } = planned;
        const url = buildUrl(service.baseUrl, endpoint.path, endpoint.params, queryParams);
        const startTime = Date.now();

        addEntry(trail, {
          action: "API_CALL",
          service: service.name,
          endpoint: endpoint.path,
          cost: endpoint.price,
          status: "pending",
          reason: planned.reason,
        });

        try {
          const { result: response, retries } = await withRetry(
            () => paymentFetch(url, {
              method: endpoint.method || "GET",
              headers: { "Content-Type": "application/json" },
            }),
            maxRetries,
            retryDelayMs
          );

          const duration = Date.now() - startTime;
          if (!response.ok && response.status !== 402) {
            throw new Error("HTTP " + response.status + ": " + response.statusText);
          }

          const data = await response.json();

          let txHash: string | undefined;
          const paymentHeader = response.headers.get("PAYMENT-RESPONSE");
          if (paymentHeader) {
            try {
              const decoded = decodePaymentResponseHeader(paymentHeader);
              txHash = decoded?.txHash || decoded?.transaction || paymentHeader;
            } catch {
              txHash = paymentHeader;
            }
          }

          addEntry(trail, {
            action: "API_RESPONSE",
            service: service.name,
            endpoint: endpoint.path,
            cost: endpoint.price,
            status: "success",
            reason: "Data received" + (retries > 0 ? " (after " + retries + " retries)" : ""),
            responsePreview: JSON.stringify(data).slice(0, 200),
            txHash,
            duration,
          });

          return {
            service: service.name, endpoint: endpoint.path, data,
            cost: endpoint.price, duration, success: true, txHash, retries,
          } as ExecutionResult;
        } catch (error: any) {
          const duration = Date.now() - startTime;
          addEntry(trail, {
            action: "API_ERROR",
            service: service.name,
            endpoint: endpoint.path,
            cost: "$0.00",
            status: "failed",
            reason: error?.message || "Unknown error",
            duration,
          });
          return {
            service: service.name, endpoint: endpoint.path, data: null,
            cost: "$0.00", duration, success: false, error: error?.message,
          } as ExecutionResult;
        }
      })
    );

    for (const br of batchResults) {
      if (br.status === "fulfilled") results.push(br.value);
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
