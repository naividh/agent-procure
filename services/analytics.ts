import express from "express";

import cors from "cors";

import { paymentMiddleware, x402ResourceServer } from "@x402/express";

import { ExactEvmScheme } from "@x402/evm/exact/server";

import { HTTPFacilitatorClient } from "@x402/core/server";



export function createAnalyticsService(port: number, facilitatorUrl: string, payTo: string) {

  const app = express();

    app.use(cors());

      const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });

        const resourceServer = new x402ResourceServer(facilitatorClient).register("eip155:84532", new ExactEvmScheme());



          app.use(paymentMiddleware({

              "GET /api/analytics/market": { accepts: { scheme: "exact", price: "$0.04", network: "eip155:84532", payTo }, description: "Market analytics and trends" },

                  "GET /api/analytics/competitor": { accepts: { scheme: "exact", price: "$0.06", network: "eip155:84532", payTo }, description: "Competitor analysis data" },

                    }, resourceServer));



                      app.get("/api/discover", (_req, res) => {

                          res.json({

                                service: "analytics", name: "DataLens Analytics", description: "Market intelligence and competitor analysis",

                                      endpoints: [

                                              { path: "/api/analytics/market", method: "GET", price: "$0.04", description: "Market trends and metrics", params: { sector: "string" } },

                                                      { path: "/api/analytics/competitor", method: "GET", price: "$0.06", description: "Competitor landscape analysis", params: { sector: "string" } },

                                                            ],

                                                                });

                                                                  });



                                                                    app.get("/api/analytics/market", (req, res) => {

                                                                        const sector = (req.query.sector as string) || "technology";

                                                                            res.json({

                                                                                  sector, marketSize: "$" + (Math.random() * 500 + 100).toFixed(1) + "B",

                                                                                        growthRate: (Math.random() * 20 + 5).toFixed(1) + "%",

                                                                                              topTrends: ["AI-native commerce platforms", "Agent-to-agent payment protocols", "Encrypted conditional transactions", "Gasless blockchain interactions"],

                                                                                                    keyMetrics: { totalTransactions: Math.floor(Math.random() * 1000000), avgTransactionValue: "$" + (Math.random() * 100).toFixed(2), activeAgents: Math.floor(Math.random() * 50000), marketMomentum: "strong" },

                                                                                                          timestamp: new Date().toISOString(), source: "DataLens Analytics (x402-paywalled)",

                                                                                                              });

                                                                                                                });



                                                                                                                  app.get("/api/analytics/competitor", (req, res) => {

                                                                                                                      const sector = (req.query.sector as string) || "technology";

                                                                                                                          res.json({

                                                                                                                                sector,

                                                                                                                                      competitors: [

                                                                                                                                              { name: "AgentPay Corp", marketShare: "23%", strength: "Payment UX", weakness: "Limited chains" },

                                                                                                                                                      { name: "PayFlow AI", marketShare: "18%", strength: "Multi-agent", weakness: "High fees" },

                                                                                                                                                              { name: "ChainCommerce", marketShare: "15%", strength: "DeFi integration", weakness: "No encryption" },

                                                                                                                                                                      { name: "x402 Labs", marketShare: "12%", strength: "Protocol standard", weakness: "Early stage" },

                                                                                                                                                                            ],

                                                                                                                                                                                  insights: { marketConcentration: "moderate", entryBarriers: "low", disruptionRisk: "high", recommendation: "Enter with differentiated privacy features" },

                                                                                                                                                                                        timestamp: new Date().toISOString(), source: "DataLens Competitor Analysis (x402-paywalled)",

                                                                                                                                                                                            });

                                                                                                                                                                                              });



                                                                                                                                                                                                return app.listen(port, () => console.log(`Analytics service on http://localhost:${port}`));

  }
