import dotenv from "dotenv";
dotenv.config();

import { createWeatherService } from "./services/weather.js";
import { createNewsService } from "./services/news.js";
import { createAnalyticsService } from "./services/analytics.js";
import { createWebServer } from "./web/server.js";

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const PAY_TO = process.env.PAY_TO_ADDRESS!;
const WEATHER_PORT = parseInt(process.env.WEATHER_PORT || "4401");
const NEWS_PORT = parseInt(process.env.NEWS_PORT || "4402");
const ANALYTICS_PORT = parseInt(process.env.ANALYTICS_PORT || "4403");
const WEB_PORT = parseInt(process.env.WEB_PORT || "3000");
const BUDGET = parseFloat(process.env.AGENT_BUDGET || "1.00");
const FACILITATOR_URL = process.env.FACILITATOR_URL || "https://facilitator.x402.org";

if (!PRIVATE_KEY) { console.error("PRIVATE_KEY is required in .env"); process.exit(1); }
if (!PAY_TO) { console.error("PAY_TO_ADDRESS is required in .env"); process.exit(1); }

async function boot() {
  console.log("\n=== AgentProcure v1.0 ===\nAutonomous Research Agent with x402\n");
    console.log("Starting x402-paywalled microservices...\n");

      createWeatherService(WEATHER_PORT, FACILITATOR_URL, PAY_TO);
        createNewsService(NEWS_PORT, FACILITATOR_URL, PAY_TO);
          createAnalyticsService(ANALYTICS_PORT, FACILITATOR_URL, PAY_TO);

            console.log("\nStarting web dashboard...\n");
              const serviceUrls = [
                  "http://localhost:" + WEATHER_PORT,
                      "http://localhost:" + NEWS_PORT,
                          "http://localhost:" + ANALYTICS_PORT,
                            ];

                              createWebServer(WEB_PORT, {
                                  privateKey: PRIVATE_KEY, budget: BUDGET, serviceUrls,
                                      openaiApiKey: process.env.OPENAI_API_KEY,
                                        });

                                          console.log("\n=== All systems online! ===");
                                            console.log("Dashboard:   http://localhost:" + WEB_PORT);
                                              console.log("Weather API: http://localhost:" + WEATHER_PORT + "/api/discover");
                                                console.log("News API:    http://localhost:" + NEWS_PORT + "/api/discover");
                                                  console.log("Analytics:   http://localhost:" + ANALYTICS_PORT + "/api/discover");
                                                    console.log("Payments:    x402 (Base Sepolia)");
                                                      console.log("Facilitator: " + FACILITATOR_URL + "\n");
                                                      }

                                                      boot().catch(console.error);