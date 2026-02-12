# AgentProcure

**Autonomous AI Research Agent with x402 Micropayments**

An AI agent that autonomously discovers, reasons about, pays for, and synthesizes data from x402-paywalled APIs using cryptocurrency micropayments on the Base Sepolia blockchain.

Built for the [San Francisco Agentic Commerce x402 Hackathon](https://dorahacks.io/hackathon/x402/detail).

## How It Works

1. **Discover** - Agent scans configured service URLs to discover available x402-paywalled API endpoints
2. 2. **Rank** - Endpoints are ranked by relevance to the user's query using keyword matching
   3. 3. **Budget** - A budget plan is created, optimizing for value-to-cost ratio within the user's budget
      4. 4. **Execute** - API calls are made using `@x402/fetch` which automatically handles HTTP 402 payment flows with on-chain USDC micropayments
         5. 5. **Synthesize** - Collected data from multiple paid sources is synthesized into a coherent answer using an LLM
            6. 6. **Audit** - Every step is logged in a transparent audit trail showing costs, services used, and payment receipts
              
               7. ## Architecture
              
               8. ```
                  User Query --> [Orchestrator]
                                      |
                              [1. Discovery] --> Scan /api/discover endpoints
                                      |
                              [2. Ranking]   --> Score endpoints by relevance
                                      |
                              [3. Budget]    --> Plan calls within budget
                                      |
                              [4. Executor]  --> @x402/fetch with auto-pay (Base Sepolia USDC)
                                      |
                              [5. Synthesizer] --> LLM fusion of multi-source data
                                      |
                                 [Audit Trail] --> Full transparency of spend
                  ```

                  ## Tech Stack

                  - **x402 Protocol** - HTTP 402 payment standard for machine-to-machine commerce
                  - - **@x402/fetch** - Wraps native fetch to auto-handle 402 Payment Required responses
                    - - **@x402/express** - Express middleware for creating paywalled API endpoints
                      - - **Base Sepolia** - EVM testnet for USDC micropayments (chain ID: 84532)
                        - - **viem** - Ethereum wallet interactions
                          - - **OpenAI** - LLM synthesis of collected data
                            - - **Express** - Web server for services and UI
                              - - **TypeScript** - End-to-end type safety
                               
                                - ## Project Structure
                               
                                - ```
                                  agent-procure/
                                    agent/
                                      discovery.ts    # Service discovery and endpoint ranking
                                      budget.ts       # Budget planning with value optimization
                                      executor.ts     # Executes API calls with x402 payment handling
                                      synthesizer.ts  # LLM-powered multi-source data synthesis
                                      orchestrator.ts # Main agent loop tying all modules together
                                      audit.ts        # Audit trail tracking every action and cost
                                    services/
                                      weather.ts      # x402-paywalled weather API (mock)
                                      news.ts         # x402-paywalled news API (mock)
                                      analytics.ts    # x402-paywalled analytics API (mock)
                                    start.ts          # Entry point - boots services + web UI
                                    package.json
                                    tsconfig.json
                                    .env.example
                                  ```

                                  ## Quick Start

                                  ```bash
                                  # Clone
                                  git clone https://github.com/naividh/agent-procure.git
                                  cd agent-procure

                                  # Install
                                  npm install

                                  # Configure
                                  cp .env.example .env
                                  # Edit .env with your testnet private key, pay-to address, and OpenAI key

                                  # Run
                                  npm start
                                  # Opens web UI at http://localhost:3000
                                  ```

                                  ## Demo Services

                                  The project includes 3 mock x402-paywalled services that simulate real paid APIs:

                                  | Service | Endpoints | Prices |
                                  |---------|-----------|--------|
                                  | WeatherPro API | `/api/weather`, `/api/weather/forecast` | $0.01, $0.03 |
                                  | NewsWire API | `/api/news`, `/api/news/deep` | $0.02, $0.05 |
                                  | DataLens Analytics | `/api/analytics/market`, `/api/analytics/competitor` | $0.04, $0.06 |

                                  Each service uses `@x402/express` payment middleware and accepts USDC on Base Sepolia.

                                  ## Environment Variables

                                  | Variable | Description |
                                  |----------|-------------|
                                  | `PRIVATE_KEY` | EVM wallet private key (testnet only!) |
                                  | `PAY_TO_ADDRESS` | Address to receive service payments |
                                  | `OPENAI_API_KEY` | OpenAI API key for LLM synthesis |
                                  | `FACILITATOR_URL` | x402 facilitator (default: https://facilitator.x402.org) |
                                  | `AGENT_BUDGET` | Default agent budget in USD (default: 1.00) |

                                  ## License

                                  MIT
