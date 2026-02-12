import express from "express";

import cors from "cors";

import { paymentMiddleware, x402ResourceServer } from "@x402/express";

import { ExactEvmScheme } from "@x402/evm/exact/server";

import { HTTPFacilitatorClient } from "@x402/core/server";



const MOCK_NEWS: Record<string, Array<{ title: string; summary: string; relevance: number }>> = {

  technology: [

      { title: "AI Agents Now Handle 30% of Enterprise Procurement", summary: "Autonomous purchasing agents are reshaping supply chains across Fortune 500 companies, with x402 payments enabling seamless machine-to-machine commerce.", relevance: 0.95 },

          { title: "Web3 Payment Rails See 400% Growth in Agent Traffic", summary: "HTTP 402-based payment protocols are becoming the standard for agent-to-service interactions.", relevance: 0.88 },

              { title: "SKALE Network Launches Agent Commerce Suite", summary: "The Layer 1 blockchain introduces gasless agent payment infrastructure with built-in threshold encryption.", relevance: 0.82 },

                ],

                  finance: [

                      { title: "DeFi Agents Manage $2B in Autonomous Positions", summary: "AI-driven DeFi agents now managing significant liquidity across multiple chains with built-in risk controls.", relevance: 0.91 },

                          { title: "Stablecoin Payments Dominate Agent Commerce", summary: "USDC and other stablecoins account for 85% of all agent-initiated payments.", relevance: 0.87 },

                            ],

                              general: [

                                  { title: "The Rise of Agentic Commerce", summary: "How autonomous agents are transforming the way businesses buy and sell services.", relevance: 0.90 },

                                    ],

                                    };



                                    export function createNewsService(port: number, facilitatorUrl: string, payTo: string) {

                                      const app = express();

                                        app.use(cors());

                                          const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

                                            const resourceServer = new x402ResourceServer(facilitatorClient).register("eip155:84532", new ExactEvmScheme());



                                              app.use(paymentMiddleware({

                                                  "GET /api/news": { accepts: { scheme: "exact", price: "$0.02", network: "eip155:84532", payTo }, description: "Latest news articles by topic" },

                                                      "GET /api/news/deep": { accepts: { scheme: "exact", price: "$0.05", network: "eip155:84532", payTo }, description: "Deep analysis articles with sentiment" },

                                                        }, resourceServer));



                                                          app.get("/api/discover", (_req, res) => {

                                                              res.json({

                                                                    service: "news", name: "NewsWire API", description: "Curated news articles and deep analysis",

                                                                          endpoints: [

                                                                                  { path: "/api/news", method: "GET", price: "$0.02", description: "Latest news by topic", params: { topic: "string" } },

                                                                                          { path: "/api/news/deep", method: "GET", price: "$0.05", description: "Deep analysis with sentiment", params: { topic: "string" } },

                                                                                                ],

                                                                                                    });

                                                                                                      });



                                                                                                        app.get("/api/news", (req, res) => {

                                                                                                            const topic = (req.query.topic as string) || "general";

                                                                                                                const articles = MOCK_NEWS[topic] || MOCK_NEWS["general"];

                                                                                                                    res.json({ topic, articles, count: articles.length, timestamp: new Date().toISOString(), source: "NewsWire API (x402-paywalled)" });

                                                                                                                      });



                                                                                                                        app.get("/api/news/deep", (req, res) => {

                                                                                                                            const topic = (req.query.topic as string) || "general";

                                                                                                                                const articles = (MOCK_NEWS[topic] || MOCK_NEWS["general"]).map((a) => ({

                                                                                                                                      ...a, sentiment: Math.random() > 0.5 ? "positive" : "neutral",

                                                                                                                                            sentimentScore: +(0.5 + Math.random() * 0.5).toFixed(2),

                                                                                                                                                  keyEntities: ["x402", "SKALE", "AI Agents", "DeFi"], readTime: Math.ceil(Math.random() * 8) + " min",

                                                                                                                                                      }));

                                                                                                                                                          res.json({ topic, articles, analysis: { overallSentiment: "positive", trendDirection: "up", confidence: 0.85 }, timestamp: new Date().toISOString(), source: "NewsWire Deep Analysis (x402-paywalled)" });

                                                                                                                                                            });



                                                                                                                                                              return app.listen(port, () => console.log(`News service on http://localhost:${port}`));

                                                                                                                                                                    }
