# AgentProcure

## Autonomous AI Research Agent with x402 Micropayments

An AI agent that autonomously **discovers, reasons about, pays for, and synthesizes** data from x402-paywalled APIs using cryptocurrency micropayments on the **Base Sepolia** blockchain.

Built for the **San Francisco Agentic Commerce x402 Hackathon**.

---

## How It Works

```
User Query --> [Orchestrator]
                  |
   [1. Discovery]  --> Parallel scan of /api/discover endpoints (with timeout)
                  |
   [2. Ranking]    --> Score endpoints by relevance (keyword + optional LLM)
                  |
   [3. Budget]     --> Optimize call plan within budget (value-to-cost ratio)
                  |
   [4. Executor]   --> @x402/fetch with auto-pay, retry, and concurrency
                  |
   [5. Synthesizer]--> LLM fusion of multi-source data
                  |
   [Audit Trail]   --> Full transparency of spend + tx hashes
```

### Pipeline Steps

1. **Discover** — Agent scans configured service URLs to discover available x402-paywalled API endpoints (parallel with 5s timeout)
2. **Rank** — Endpoints are ranked by relevance using keyword matching or optional LLM-powered scoring via GPT-4o-mini
3. **Budget** — A budget plan is created, optimizing for value-to-cost ratio within the user's budget
4. **Execute** — API calls are made using `@x402/fetch` which automatically handles HTTP 402 payment flows with on-chain USDC micropayments. Includes exponential backoff retry and concurrent execution
5. **Synthesize** — Collected data from multiple paid sources is synthesized into a coherent answer using an LLM
6. **Audit** — Every step is logged in a transparent audit trail showing costs, services used, payment receipts, and timing metrics

---

## Features

- **x402 Protocol** — Native HTTP 402 payment handling for machine-to-machine commerce
- **Smart Query Extraction** — Automatically extracts cities, topics, and sectors from natural language queries
- **LLM-Powered Ranking** — Optional GPT-4o-mini endpoint relevance scoring for complex queries
- **Concurrent Execution** — Batched parallel API calls with configurable concurrency
- **Exponential Backoff Retry** — Resilient API calls with automatic retry on failure
- **Payment Response Decoding** — Decodes x402 payment response headers for transaction details
- **Pipeline Visualization** — Real-time animated 5-step pipeline in the web UI
- **Full Audit Trail** — Every action, cost, and timing logged transparently
- **Preset Queries** — One-click query templates for quick demos

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Payment Protocol | [x402](https://x402.org) — HTTP 402 standard for machine-to-machine commerce |
| Payment Client | [`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch) — Auto-handles 402 Payment Required |
| Payment Server | [`@x402/express`](https://www.npmjs.com/package/@x402/express) — Express middleware for paywalled endpoints |
| Blockchain | Base Sepolia (EVM testnet, chain ID: 84532) |
| Token | USDC micropayments |
| Wallet | [viem](https://viem.sh) — Ethereum wallet interactions |
| LLM | OpenAI GPT-4o-mini — Ranking + synthesis |
| Server | Express.js |
| Language | TypeScript (end-to-end type safety) |

---

## Project Structure

```
agent-procure/
  agent/
    index.ts          # Barrel exports for all agent modules
    discovery.ts      # Service discovery + LLM-powered endpoint ranking
    budget.ts         # Budget planning with value-ratio optimization
    executor.ts       # Executes API calls with x402 payments, retry, concurrency
    synthesizer.ts    # LLM-powered multi-source data synthesis
    orchestrator.ts   # Main agent pipeline with timing metrics
    audit.ts          # Audit trail tracking every action and cost
  services/
    weather.ts        # x402-paywalled weather API (mock)
    news.ts           # x402-paywalled news API (mock)
    analytics.ts      # x402-paywalled analytics API (mock)
  start.ts            # Entry point — boots services + web UI
  package.json
  tsconfig.json
  .env.example
```

---

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

---

## Demo Services

The project includes 3 mock x402-paywalled services that simulate real paid APIs:

| Service | Endpoints | Prices |
|---------|----------|--------|
| WeatherPro API | `/api/weather`, `/api/weather/forecast` | $0.01, $0.03 |
| NewsWire API | `/api/news`, `/api/news/deep` | $0.02, $0.05 |
| DataLens Analytics | `/api/analytics/market`, `/api/analytics/competitor` | $0.04, $0.06 |

Each service uses `@x402/express` payment middleware and accepts USDC on Base Sepolia.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | EVM wallet private key (testnet only!) |
| `PAY_TO_ADDRESS` | Address to receive service payments |
| `OPENAI_API_KEY` | OpenAI API key for LLM synthesis |
| `FACILITATOR_URL` | x402 facilitator (default: `https://facilitator.x402.org`) |
| `AGENT_BUDGET` | Default agent budget in USD (default: 1.00) |

---

## API

### POST `/api/agent`

```json
{
  "query": "What is the current state of AI commerce?",
  "budget": 1.00
}
```

Returns synthesis, audit trail, timing metrics, and cost breakdown.

---

## License

MIT
