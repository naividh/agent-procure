import { config } from "dotenv";
config();

import express from "express";
import cors from "cors";
import { createWeatherService } from "./services/weather.js";
import { createNewsService } from "./services/news.js";
import { createAnalyticsService } from "./services/analytics.js";
import { runAgent } from "./agent/orchestrator.js";

const {
  PRIVATE_KEY = "",
  PAY_TO_ADDRESS = "",
  FACILITATOR_URL = "https://facilitator.x402.org",
  WEATHER_PORT = "4401",
  NEWS_PORT = "4402",
  ANALYTICS_PORT = "4403",
  WEB_PORT = "3000",
  AGENT_BUDGET = "1.00",
} = process.env;

async function main() {
  console.log("\n--- Starting AgentProcure ---\n");

  console.log("Starting paywalled services...");
  createWeatherService(parseInt(WEATHER_PORT), FACILITATOR_URL, PAY_TO_ADDRESS);
  createNewsService(parseInt(NEWS_PORT), FACILITATOR_URL, PAY_TO_ADDRESS);
  createAnalyticsService(parseInt(ANALYTICS_PORT), FACILITATOR_URL, PAY_TO_ADDRESS);

  const serviceUrls = [
    "http://localhost:" + WEATHER_PORT,
    "http://localhost:" + NEWS_PORT,
    "http://localhost:" + ANALYTICS_PORT,
  ];

  const web = express();
  web.use(cors());
  web.use(express.json());

  web.get("/", (_req, res) => {
    res.type("html").send(getHtml());
  });

  web.post("/api/agent", async (req, res) => {
    try {
      const { query, budget } = req.body;
      const result = await runAgent(query || "What is the current state of AI commerce?", {
        privateKey: PRIVATE_KEY,
        serviceUrls,
        budget: parseFloat(budget) || parseFloat(AGENT_BUDGET),
      });

      res.json({
        success: true,
        query: result.query,
        synthesis: result.synthesis,
        trail: result.trail,
        trailDisplay: result.trailDisplay,
        resultsCount: result.results.length,
        successCount: result.results.filter((r) => r.success).length,
        timings: result.timings,
        totalDurationMs: result.totalDurationMs,
      });
    } catch (error: any) {
      console.error("Agent error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  web.listen(parseInt(WEB_PORT), () => {
    console.log("\nWeb UI: http://localhost:" + WEB_PORT);
    console.log("Ready! Open the web UI or POST to /api/agent\n");
  });
}

function getHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AgentProcure - x402 Agentic Commerce</title>
<style>
  :root {
    --bg: #06060a; --surface: #0d0d14; --surface2: #13131f;
    --border: #1e1e30; --text: #e4e4ef; --muted: #6b6b8a;
    --accent: #6366f1; --accent2: #8b5cf6; --green: #22c55e;
    --red: #ef4444; --yellow: #eab308; --cyan: #06b6d4;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  header {
    background: linear-gradient(135deg, #0f0f1a 0%, #1a1030 50%, #0f0f1a 100%);
    border-bottom: 1px solid var(--border);
    padding: 2rem 1rem; text-align: center;
    position: relative; overflow: hidden;
  }
  header::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%);
  }
  header h1 { font-size: 2.2rem; font-weight: 700; position: relative; letter-spacing: -0.5px; }
  header h1 span { background: linear-gradient(135deg, var(--accent), var(--accent2), var(--cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .tagline { color: var(--muted); margin-top: 0.5rem; position: relative; font-size: 0.95rem; }
  .badges { display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem; position: relative; flex-wrap: wrap; }
  .badge { background: var(--surface); border: 1px solid var(--border); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; color: var(--muted); }

  .container { max-width: 960px; margin: 0 auto; padding: 1.5rem 1rem; }

  .input-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.5rem; margin-bottom: 1.5rem;
  }
  .input-row { display: flex; gap: 0.75rem; align-items: stretch; }
  .input-row input[type="text"] {
    flex: 1; padding: 0.875rem 1rem; background: var(--bg); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text); font-size: 1rem; outline: none; transition: border-color 0.2s;
  }
  .input-row input[type="text"]:focus { border-color: var(--accent); }
  .input-row input[type="number"] {
    width: 100px; padding: 0.875rem; background: var(--bg); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text); font-size: 1rem; text-align: center; outline: none;
  }
  .input-row input[type="number"]:focus { border-color: var(--accent); }
  .run-btn {
    padding: 0.875rem 2rem; background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .run-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(99,102,241,0.3); }
  .run-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  .presets { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
  .preset {
    background: var(--bg); border: 1px solid var(--border); padding: 0.35rem 0.75rem;
    border-radius: 8px; font-size: 0.8rem; color: var(--muted); cursor: pointer; transition: all 0.15s;
  }
  .preset:hover { border-color: var(--accent); color: var(--text); }

  .results-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.5rem; display: none;
  }
  .results-card.visible { display: block; }

  .pipeline {
    display: flex; gap: 0.25rem; margin-bottom: 1.5rem; flex-wrap: wrap;
  }
  .pipe-step {
    flex: 1; min-width: 100px; padding: 0.75rem 0.5rem; background: var(--bg);
    border: 1px solid var(--border); border-radius: 10px; text-align: center; transition: all 0.3s;
    position: relative; overflow: hidden;
  }
  .pipe-step.active { border-color: var(--accent); }
  .pipe-step.active::after {
    content: ''; position: absolute; bottom: 0; left: 0; height: 2px; width: 100%;
    background: var(--accent); animation: pulse 1.5s ease-in-out infinite;
  }
  .pipe-step.done { border-color: var(--green); }
  .pipe-step.done::after {
    content: ''; position: absolute; bottom: 0; left: 0; height: 2px; width: 100%; background: var(--green);
  }
  .pipe-step.error { border-color: var(--red); }
  .pipe-icon { font-size: 1.25rem; margin-bottom: 0.25rem; }
  .pipe-label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .pipe-time { font-size: 0.65rem; color: var(--green); margin-top: 0.2rem; }
  @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem; margin: 1.5rem 0; }
  .stat-card {
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 1rem; text-align: center;
  }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--cyan); }
  .stat-label { font-size: 0.7rem; color: var(--muted); margin-top: 0.25rem; text-transform: uppercase; }

  .section-title {
    font-size: 0.85rem; font-weight: 600; color: var(--accent); text-transform: uppercase;
    letter-spacing: 1px; margin: 1.5rem 0 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border);
  }
  .synthesis-box {
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 1.25rem; line-height: 1.8; white-space: pre-wrap; font-size: 0.95rem;
  }
  .audit-box {
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 1rem; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.8rem;
    white-space: pre-wrap; color: var(--muted); max-height: 400px; overflow-y: auto; line-height: 1.6;
  }

  .loading-text { color: var(--muted); font-style: italic; }
  .loading-text::after { content: ''; animation: dots 1.5s steps(4, end) infinite; }
  @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } }

  footer {
    text-align: center; padding: 2rem; color: var(--muted); font-size: 0.8rem;
    border-top: 1px solid var(--border); margin-top: 2rem;
  }
  footer a { color: var(--accent); text-decoration: none; }
  footer a:hover { text-decoration: underline; }
</style>
</head>
<body>
<header>
  <h1>Agent<span>Procure</span></h1>
  <p class="tagline">Autonomous AI Research Agent with x402 Micropayments</p>
  <div class="badges">
    <span class="badge">x402 Protocol</span>
    <span class="badge">Base Sepolia</span>
    <span class="badge">USDC Micropayments</span>
    <span class="badge">LLM Synthesis</span>
  </div>
</header>

<div class="container">
  <div class="input-card">
    <div class="input-row">
      <input type="text" id="queryInput" placeholder="Ask anything..." value="What is the current state of AI agent commerce?">
      <input type="number" id="budgetInput" value="1.00" step="0.01" min="0.01" max="10">
      <button class="run-btn" id="runBtn" onclick="runAgent()">Run Agent</button>
    </div>
    <div class="presets">
      <span class="preset" onclick="setQuery('What is the weather forecast in San Francisco?')">Weather</span>
      <span class="preset" onclick="setQuery('Latest AI and crypto technology news')">Tech News</span>
      <span class="preset" onclick="setQuery('Market analysis of the DeFi sector')">DeFi Markets</span>
      <span class="preset" onclick="setQuery('Competitive landscape of agentic commerce')">Competitors</span>
      <span class="preset" onclick="setQuery('Weather in Tokyo and technology market trends')">Multi-Source</span>
    </div>
  </div>

  <div class="results-card" id="results">
    <div class="pipeline" id="pipeline">
      <div class="pipe-step" id="step-discover"><div class="pipe-icon">&#x1F50D;</div><div class="pipe-label">Discover</div><div class="pipe-time" id="time-discover"></div></div>
      <div class="pipe-step" id="step-rank"><div class="pipe-icon">&#x1F3AF;</div><div class="pipe-label">Rank</div><div class="pipe-time" id="time-rank"></div></div>
      <div class="pipe-step" id="step-budget"><div class="pipe-icon">&#x1F4B0;</div><div class="pipe-label">Budget</div><div class="pipe-time" id="time-budget"></div></div>
      <div class="pipe-step" id="step-execute"><div class="pipe-icon">&#x26A1;</div><div class="pipe-label">Execute</div><div class="pipe-time" id="time-execute"></div></div>
      <div class="pipe-step" id="step-synthesize"><div class="pipe-icon">&#x1F9E0;</div><div class="pipe-label">Synthesize</div><div class="pipe-time" id="time-synthesize"></div></div>
    </div>

    <div class="stats-grid" id="statsGrid"></div>

    <div class="section-title">Synthesis</div>
    <div class="synthesis-box" id="synthesisBox"></div>

    <div class="section-title">Audit Trail</div>
    <div class="audit-box" id="auditBox"></div>
  </div>
</div>

<footer>
  Built for the <a href="https://x402.org" target="_blank">x402 Agentic Commerce Hackathon</a> |
  Powered by <a href="https://www.npmjs.com/package/@x402/fetch" target="_blank">@x402/fetch</a> on Base Sepolia
</footer>

<script>
function setQuery(q) {
  document.getElementById('queryInput').value = q;
}

function resetPipeline() {
  ['discover','rank','budget','execute','synthesize'].forEach(s => {
    const el = document.getElementById('step-' + s);
    el.className = 'pipe-step';
    document.getElementById('time-' + s).textContent = '';
  });
}

function activateStep(name) {
  document.getElementById('step-' + name).className = 'pipe-step active';
}

function completeStep(name, ms) {
  const el = document.getElementById('step-' + name);
  el.className = 'pipe-step done';
  if (ms !== undefined) {
    document.getElementById('time-' + name).textContent = ms + 'ms';
  }
}

async function runAgent() {
  const query = document.getElementById('queryInput').value;
  const budget = document.getElementById('budgetInput').value;
  const btn = document.getElementById('runBtn');
  const results = document.getElementById('results');

  btn.disabled = true;
  btn.textContent = 'Working...';
  results.className = 'results-card visible';

  resetPipeline();
  document.getElementById('statsGrid').innerHTML = '';
  document.getElementById('synthesisBox').innerHTML = '<span class="loading-text">Discovering, planning, paying for, and synthesizing data</span>';
  document.getElementById('auditBox').textContent = '';

  // Animate pipeline steps
  const steps = ['discover', 'rank', 'budget', 'execute', 'synthesize'];
  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      activateStep(steps[stepIdx]);
      stepIdx++;
    }
  }, 800);

  try {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, budget: +budget }),
    });
    const d = await res.json();

    clearInterval(stepInterval);

    if (d.success) {
      // Complete all pipeline steps with timings
      const stepMap = ['discovery', 'ranking', 'budgeting', 'execution', 'synthesis'];
      const stepNames = ['discover', 'rank', 'budget', 'execute', 'synthesize'];
      stepNames.forEach((name, i) => {
        const timing = d.timings?.find(t => t.step === stepMap[i]);
        completeStep(name, timing?.durationMs);
      });

      // Stats
      const totalTime = d.totalDurationMs ? (d.totalDurationMs / 1000).toFixed(1) + 's' : '-';
      document.getElementById('statsGrid').innerHTML =
        '<div class="stat-card"><div class="stat-value">' + d.resultsCount + '</div><div class="stat-label">APIs Called</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + d.successCount + '</div><div class="stat-label">Successful</div></div>' +
        '<div class="stat-card"><div class="stat-value">$' + d.trail.totalSpent.toFixed(4) + '</div><div class="stat-label">Total Spent</div></div>' +
        '<div class="stat-card"><div class="stat-value">$' + (d.trail.budget - d.trail.totalSpent).toFixed(4) + '</div><div class="stat-label">Remaining</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + totalTime + '</div><div class="stat-label">Total Time</div></div>' +
        '<div class="stat-card"><div class="stat-value">' + d.trail.entries.length + '</div><div class="stat-label">Audit Entries</div></div>';

      document.getElementById('synthesisBox').textContent = d.synthesis;
      document.getElementById('auditBox').textContent = d.trailDisplay;
    } else {
      steps.forEach(s => document.getElementById('step-' + s).className = 'pipe-step error');
      document.getElementById('synthesisBox').textContent = 'Error: ' + d.error;
    }
  } catch (e) {
    clearInterval(stepInterval);
    document.getElementById('synthesisBox').textContent = 'Connection failed: ' + e.message;
  }

  btn.disabled = false;
  btn.textContent = 'Run Agent';
}
</script>
</body>
</html>`;
}

main().catch(console.error);
