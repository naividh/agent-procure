import express from "express";
import cors from "cors";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

export function createWeatherService(port: number, facilitatorUrl: string, payTo: string) {
  const app = express();
    app.use(cors());

      const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
        const resourceServer = new x402ResourceServer(facilitatorClient).register("eip155:84532", new ExactEvmScheme());

          app.use(paymentMiddleware({
              "GET /api/weather": {
                    accepts: { scheme: "exact", price: "$0.01", network: "eip155:84532", payTo },
                          description: "Current weather data for any city",
                              },
                                  "GET /api/weather/forecast": {
                                        accepts: { scheme: "exact", price: "$0.03", network: "eip155:84532", payTo },
                                              description: "7-day weather forecast",
                                                  },
                                                    }, resourceServer));

                                                      app.get("/api/discover", (_req, res) => {
                                                          res.json({
                                                                service: "weather", name: "WeatherPro API",
                                                                      description: "Real-time weather data and forecasts",
                                                                            endpoints: [
                                                                                    { path: "/api/weather", method: "GET", price: "$0.01", description: "Current weather for a city", params: { city: "string" } },
                                                                                            { path: "/api/weather/forecast", method: "GET", price: "$0.03", description: "7-day forecast for a city", params: { city: "string" } },
                                                                                                  ],
                                                                                                      });
                                                                                                        });

                                                                                                          app.get("/api/weather", (req, res) => {
                                                                                                              const city = (req.query.city as string) || "San Francisco";
                                                                                                                  res.json({
                                                                                                                        city, temperature: Math.round(50 + Math.random() * 40),
                                                                                                                              humidity: Math.round(30 + Math.random() * 50),
                                                                                                                                    condition: ["Sunny", "Cloudy", "Rainy", "Windy", "Foggy"][Math.floor(Math.random() * 5)],
                                                                                                                                          windSpeed: Math.round(5 + Math.random() * 25),
                                                                                                                                                timestamp: new Date().toISOString(),
                                                                                                                                                      source: "WeatherPro API (x402-paywalled)",
                                                                                                                                                          });
                                                                                                                                                            });

                                                                                                                                                              app.get("/api/weather/forecast", (req, res) => {
                                                                                                                                                                  const city = (req.query.city as string) || "San Francisco";
                                                                                                                                                                      const forecast = Array.from({ length: 7 }, (_, i) => ({
                                                                                                                                                                            date: new Date(Date.now() + i * 86400000).toISOString().split("T")[0],
                                                                                                                                                                                  high: Math.round(55 + Math.random() * 35), low: Math.round(35 + Math.random() * 20),
                                                                                                                                                                                        condition: ["Sunny", "Cloudy", "Rainy", "Windy", "Foggy"][Math.floor(Math.random() * 5)],
                                                                                                                                                                                            }));
                                                                                                                                                                                                res.json({ city, forecast, source: "WeatherPro API (x402-paywalled)" });
                                                                                                                                                                                                  });

                                                                                                                                                                                                    return app.listen(port, () => console.log(`Weather service on http://localhost:${port}`));
                                                                                                                                                                                                    }