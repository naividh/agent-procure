import OpenAI from "openai";
import type { ExecutionResult } from "./executor.js";
import type { AuditTrail } from "./audit.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function synthesizeResults(
    query: string,
    results: ExecutionResult[],
    trail: AuditTrail
  ): Promise<string> {
    const successfulResults = results.filter((r) => r.success);

  if (successfulResults.length === 0) {
        return "Unable to gather data for: " + query + ". All API calls failed.";
  }

  const dataContext = successfulResults
      .map(
              (r, i) =>
                        "--- Source " + (i + 1) + ": " + r.service + " (" + r.endpoint + ") [Cost: " + r.cost + "] ---\n" + JSON.stringify(r.data, null, 2)
            )
      .join("\n\n");

  const systemPrompt = "You are an AI research synthesis agent. You have autonomously discovered, evaluated, and paid for data from multiple x402-paywalled APIs using cryptocurrency micropayments on the Base Sepolia blockchain.\n\nYour job is to synthesize the collected data into a clear, insightful answer for the user query. Include:\n1. A direct answer to the query\n2. Key findings from each data source\n3. Cross-source insights and patterns\n4. A brief note on data provenance (which paid APIs provided the data)\n\nBe concise but thorough. Format with clear sections.";

  const userPrompt = "User Query: " + query + "\n\nBudget: $" + trail.budget.toFixed(2) + " | Spent: $" + trail.totalSpent.toFixed(4) + " | Sources queried: " + successfulResults.length + "\n\nCollected Data:\n" + dataContext + "\n\nPlease synthesize this into a comprehensive research answer.";

  try {
        const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: userPrompt },
                        ],
                max_tokens: 1500,
                temperature: 0.7,
        });

      return response.choices[0]?.message?.content || "Synthesis failed: no response from LLM.";
  } catch (error: any) {
        console.error("Synthesis error:", error.message);
        return "Synthesis via LLM failed (" + error.message + "). Raw data from " + successfulResults.length + " source(s):\n\n" + successfulResults.map((r) => r.service + ": " + JSON.stringify(r.data).slice(0, 300)).join("\n\n");
  }
}
