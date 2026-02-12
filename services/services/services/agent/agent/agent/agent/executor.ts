import { wrapFetchWithPaymentFromConfig } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import type { PlannedCall } from "./budget.js";
import type { AuditTrail } from "./audit.js";
import { addEntry } from "./audit.js";

export interface ExecutionResult {
  service: string; endpoint: string; cost: string; data: any; success: boolean; error?: string; duration: number;
  }

  export function createPaymentFetch(privateKey: string) {
    const account = privateKeyToAccount(privateKey as `0x${string}`);
      return wrapFetchWithPaymentFromConfig(fetch, {
          schemes: [{ network: "eip155:84532", client: new ExactEvmScheme(account) }],
            });
            }

            export async function executeCall(paymentFetch: typeof fetch, call: PlannedCall, queryParams: Record<string, string>, trail: AuditTrail): Promise<ExecutionResult> {
              const url = new URL(call.endpoint.path, call.service.baseUrl);
                for (const [k, v] of Object.entries(queryParams)) url.searchParams.set(k, v);
                  const startTime = Date.now();
                    try {
                        addEntry(trail, { action: "PAY_AND_FETCH", service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, status: "pending", reason: call.reason });
                            const response = await paymentFetch(url.toString(), { method: "GET" });
                                const duration = Date.now() - startTime;
                                    if (!response.ok) {
                                          const errText = await response.text();
                                                addEntry(trail, { action: "PAYMENT_RESULT", service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, status: "failed", reason: "HTTP " + response.status + ": " + errText.slice(0, 200), duration });
                                                      return { service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, data: null, success: false, error: "HTTP " + response.status, duration };
                                                          }
                                                              const data = await response.json();
                                                                  const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
                                                                      addEntry(trail, { action: "PAYMENT_SUCCESS", service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, status: "success", reason: "Data received (" + JSON.stringify(data).length + " bytes)", responsePreview: JSON.stringify(data).slice(0, 200), txHash: paymentResponse ? "see-payment-response-header" : undefined, duration });
                                                                          return { service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, data, success: true, duration };
                                                                            } catch (err: any) {
                                                                                const duration = Date.now() - startTime;
                                                                                    addEntry(trail, { action: "PAYMENT_ERROR", service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, status: "failed", reason: err.message, duration });
                                                                                        return { service: call.service.name, endpoint: call.endpoint.path, cost: call.endpoint.price, data: null, success: false, error: err.message, duration };
                                                                                          }
                                                                                          }

                                                                                          export async function executePlan(paymentFetch: typeof fetch, calls: PlannedCall[], query: string, trail: AuditTrail): Promise<ExecutionResult[]> {
                                                                                            const results: ExecutionResult[] = [];
                                                                                              const queryParams: Record<string, string> = { city: "San Francisco", topic: "technology", sector: "technology" };
                                                                                                const ql = query.toLowerCase();
                                                                                                  if (ql.includes("finance") || ql.includes("defi")) { queryParams.topic = "finance"; queryParams.sector = "finance"; }
                                                                                                    for (const call of calls) {
                                                                                                        console.log("  Paying " + call.endpoint.price + " for " + call.service.name + call.endpoint.path + "...");
                                                                                                            const result = await executeCall(paymentFetch, call, queryParams, trail);
                                                                                                                results.push(result);
                                                                                                                    console.log(result.success ? "  OK in " + result.duration + "ms" : "  FAILED: " + result.error);
                                                                                                                      }
                                                                                                                        return results;
                                                                                                                        }