import { v4 as uuid } from "uuid";

export interface AuditEntry {
  id: string; timestamp: string; action: string; service: string;
    endpoint: string; cost: string; status: "pending" | "success" | "failed" | "skipped";
      reason: string; responsePreview?: string; txHash?: string; duration?: number;
      }

      export interface AuditTrail {
        sessionId: string; query: string; startedAt: string; completedAt?: string;
          totalSpent: number; budget: number; entries: AuditEntry[]; summary?: string;
          }

          export function createAuditTrail(query: string, budget: number): AuditTrail {
            return { sessionId: uuid(), query, startedAt: new Date().toISOString(), totalSpent: 0, budget, entries: [] };
            }

            export function addEntry(trail: AuditTrail, entry: Omit<AuditEntry, "id" | "timestamp">): AuditEntry {
              const fullEntry: AuditEntry = { ...entry, id: uuid(), timestamp: new Date().toISOString() };
                trail.entries.push(fullEntry);
                  if (entry.status === "success") {
                      const cost = parseFloat(entry.cost.replace("$", "")) || 0;
                          trail.totalSpent += cost;
                            }
                              return fullEntry;
                              }

                              export function finalizeTrail(trail: AuditTrail, summary: string) {
                                trail.completedAt = new Date().toISOString();
                                  trail.summary = summary;
                                  }

                                  export function formatTrailForDisplay(trail: AuditTrail): string {
                                    const lines = [
                                        "\n==== AUDIT TRAIL - Session " + trail.sessionId.slice(0, 8) + " ====",
                                            "Query: " + trail.query, "Budget: $" + trail.budget.toFixed(2),
                                                "Spent: $" + trail.totalSpent.toFixed(4), "Started: " + trail.startedAt,
                                                    trail.completedAt ? "Ended: " + trail.completedAt : "", "---",
                                                      ];
                                                        for (const entry of trail.entries) {
                                                            const icon = entry.status === "success" ? "OK" : entry.status === "failed" ? "FAIL" : entry.status === "skipped" ? "SKIP" : "PEND";
                                                                lines.push("[" + icon + "] " + entry.action + " | " + entry.service + " " + entry.endpoint + " | Cost: " + entry.cost + " | " + entry.reason);
                                                                  }
                                                                    lines.push("====\n");
                                                                      return lines.filter(Boolean).join("\n");
                                                                      }