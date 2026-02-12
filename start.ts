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
        res.send(getHtml());
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
    return [
          "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>AgentProcure</title>",
          "<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0a0a0f;color:#e0e0e0;min-height:100vh}",
          "header{background:linear-gradient(135deg,#1a1a2e,#16213e);padding:2rem;text-align:center;border-bottom:2px solid #0f3460}",
          "h1{font-size:2rem;color:#00d4ff}h1 b{color:#7b68ee}.sub{color:#888}",
          ".box{max-width:900px;margin:2rem auto;padding:0 1rem}",
          ".card{background:#111;border:1px solid #222;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}",
          ".row{display:flex;gap:1rem;margin-bottom:1rem}",
          "input[type=text]{flex:1;padding:.75rem;background:#1a1a2e;border:1px solid #333;border-radius:8px;color:#fff;font-size:1rem}",
          "input[type=number]{width:120px;padding:.75rem;background:#1a1a2e;border:1px solid #333;border-radius:8px;color:#fff}",
          "button{padding:.75rem 2rem;background:linear-gradient(135deg,#0f3460,#533483);color:#fff;border:none;border-radius:8px;cursor:pointer}",
          "button:disabled{opacity:.5}.hide{display:none}.show{display:block}",
          ".syn{background:#1a1a2e;border-radius:8px;padding:1.5rem;line-height:1.7;white-space:pre-wrap;margin:1rem 0}",
          ".aud{background:#0d0d12;border:1px solid #1a1a2e;border-radius:8px;padding:1rem;font-family:monospace;font-size:.85rem;white-space:pre-wrap;color:#888;max-height:400px;overflow-y:auto}",
          ".stats{display:flex;gap:1rem;margin:1rem 0;flex-wrap:wrap}",
          ".st{background:#1a1a2e;padding:.75rem;border-radius:8px;text-align:center;flex:1;min-width:100px}",
          ".sv{font-size:1.5rem;font-weight:bold;color:#00d4ff}.sl{font-size:.75rem;color:#666}",
          ".tl{color:#00d4ff;font-size:1.1rem;margin:1rem 0 .5rem}",
          "</style></head><body>",
          "<header><h1>Agent<b>Procure</b></h1><p class='sub'>Autonomous AI Research Agent with x402 Micropayments</p></header>",
          "<div class='box'><div class='card'><div class='row'>",
          "<input type='text' id='q' value='What is the current state of AI agent commerce?'>",
          "<input type='number' id='b' value='1.00' step='0.01' min='0.01'>",
          "</div><button id='btn' onclick='go()'>Run Agent</button></div>",
          "<div class='card hide' id='res'>",
          "<div class='stats' id='stats'></div>",
          "<div class='tl'>Synthesis</div><div class='syn' id='syn'></div>",
          "<div class='tl'>Audit Trail</div><div class='aud' id='aud'></div>",
          "</div></div>",
          "<script>async function go(){var q=document.getElementById('q').value,b=document.getElementById('b').value,btn=document.getElementById('btn'),r=document.getElementById('res');btn.disabled=true;btn.textContent='Working...';r.className='card show';document.getElementById('syn').textContent='Discovering, planning, paying...';document.getElementById('aud').textContent='';document.getElementById('stats').innerHTML='';try{var d=await(await fetch('/api/agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q,budget:+b})})).json();if(d.success){document.getElementById('stats').innerHTML=\"<div class='st'><div class='sv'>\"+d.resultsCount+\"</div><div class='sl'>APIs Called</div></div><div class='st'><div class='sv'>\"+d.successCount+\"</div><div class='sl'>Successful</div></div><div class='st'><div class='sv'>$\"+d.trail.totalSpent.toFixed(4)+\"</div><div class='sl'>Spent</div></div><div class='st'><div class='sv'>$\"+(d.trail.budget-d.trail.totalSpent).toFixed(4)+\"</div><div class='sl'>Remaining</div></div>\";document.getElementById('syn').textContent=d.synthesis;document.getElementById('aud').textContent=d.trailDisplay}else{document.getElementById('syn').textContent='Error: '+d.error}}catch(e){document.getElementById('syn').textContent='Failed: '+e.message}btn.disabled=false;btn.textContent='Run Agent'}</script>",
          "</body></html>",
        ].join("");
}

main().catch(console.error);
