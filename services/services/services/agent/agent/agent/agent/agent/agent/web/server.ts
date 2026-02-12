import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { runAgent, type AgentConfig, type AgentResult } from "../agent/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createWebServer(port: number, agentConfig: AgentConfig) {
  const app = express();
    app.use(cors());
      app.use(express.json());
        app.use(express.static(path.join(__dirname, "public")));

          const sessions = new Map<string, { status: "running" | "complete" | "error"; query: string; result?: AgentResult; error?: string }>();

            app.post("/api/run", async (req, res) => {
                const { query, budget } = req.body;
                    if (!query) { res.status(400).json({ error: "Query required" }); return; }
                        const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
                            const config = { ...agentConfig, budget: budget || agentConfig.budget };
                                sessions.set(sessionId, { status: "running", query });
                                    res.json({ sessionId, status: "running" });
                                        try {
                                              const result = await runAgent(query, config);
                                                    sessions.set(sessionId, { status: "complete", query, result });
                                                        } catch (err: any) {
                                                              sessions.set(sessionId, { status: "error", query, error: err.message });
                                                                  }
                                                                    });

                                                                      app.get("/api/session/:id", (req, res) => {
                                                                          const session = sessions.get(req.params.id);
                                                                              if (!session) { res.status(404).json({ error: "Not found" }); return; }
                                                                                  res.json(session);
                                                                                    });

                                                                                      app.get("/api/sessions", (_req, res) => {
                                                                                          const list = Array.from(sessions.entries()).map(([id, s]) => ({ id, status: s.status, query: s.query }));
                                                                                              res.json(list);
                                                                                                });

                                                                                                  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

                                                                                                    return app.listen(port, () => console.log("Web dashboard on http://localhost:" + port));
                                                                                                    }