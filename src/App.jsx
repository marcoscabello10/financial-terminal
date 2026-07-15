import { useState, useRef } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTORS = [
  "Tecnología",
  "Financiero (Bancos / Seguros)",
  "Consumo Discrecional",
  "Consumo No Discrecional (Staples)",
  "Salud / Healthcare",
  "Energía",
  "Materiales",
  "Industrial",
  "Servicios Públicos (Utilities)",
  "Real Estate (REITs)",
  "Telecomunicaciones",
  "Otro",
];

const SECTOR_FOCUS = {
  "Tecnología": "Revenue growth rate YoY, Gross Margin %, R&D/Revenue ratio, FCF Margin, Rule of 40 (FCF margin + growth rate), ARR & NRR (for SaaS), cloud/AI segment growth, operating leverage trajectory, Capex/Revenue, customer concentration.",
  "Financiero (Bancos / Seguros)": "Net Interest Margin (NIM), Return on Equity (ROE), Return on Assets (ROA), CET1 capital ratio, NPL (non-performing loans) ratio, loan loss coverage ratio, loan book growth, efficiency ratio, deposit stability, interest rate sensitivity.",
  "Consumo Discrecional": "Same-store sales (SSS) growth, gross margin, EBITDA margin, inventory turnover days, digital sales penetration %, revenue per store/location, consumer sentiment exposure, ticket size trends, international revenue mix.",
  "Consumo No Discrecional (Staples)": "Organic growth (volume vs. price mix breakdown), gross margin evolution, market share trends, pricing power evidence, working capital efficiency, dividend sustainability, FX headwinds/tailwinds, private label competition.",
  "Salud / Healthcare": "Pipeline stage and asset value, patent cliff timeline, product revenue concentration (top-3 drugs), R&D/Revenue and pipeline efficiency, payer mix, reimbursement risks, approval probabilities, clinical trial readout schedule.",
  "Energía": "Production volumes (boe/d), realized prices vs. benchmark spread, finding & development costs (F&D), reserve replacement ratio (RRR), netback per barrel/MCF, all-in sustaining costs (AISC), breakeven oil price, shareholder return yield, Scope 1–2 emissions trajectory.",
  "Materiales": "Production volumes, cash cost per unit ($/ton or $/oz), EBITDA/unit, realized vs. spot price ratio, reserve life index (years), capex cycle stage, China demand exposure %, working capital days, sustaining vs. growth capex split.",
  "Industrial": "Organic revenue growth, order backlog level, book-to-bill ratio, EBITDA margin, FCF conversion rate, aftermarket/services revenue %, pricing power vs. input costs, supply chain resilience, reshoring exposure.",
  "Servicios Públicos (Utilities)": "Rate base growth CAGR, authorized vs. earned ROE, regulatory environment (constructive/neutral/difficult), dividend growth CAGR, net debt/EBITDA, renewable transition capex plan, load growth forecast, decarbonization timeline.",
  "Real Estate (REITs)": "FFO and AFFO per share, NAV per share (discount/premium), occupancy rates, same-store NOI growth, cap rate vs. WACC, weighted average lease expiry (WALE), net debt/EBITDA, dividend yield & coverage ratio.",
  "Telecomunicaciones": "ARPU (average revenue per user), subscriber net adds/churn rate, Capex/Revenue, EBITDA margin (service revenue), net debt/EBITDA, 5G spectrum position and coverage %, fixed-wireless convergence strategy.",
  "Otro": "Revenue growth, gross margin, EBITDA margin, FCF generation and conversion, leverage (net debt/EBITDA), ROIC vs. WACC, capital allocation policy (buybacks, dividends, M&A), competitive positioning and moat.",
};

const SECTOR_METRICS_REF = {
  "Tecnología": ["Revenue Growth YoY", "Gross Margin", "Operating Margin", "FCF Margin", "R&D / Revenue", "Rule of 40", "ARR (SaaS)", "NRR (SaaS)", "Cloud Revenue Growth"],
  "Financiero (Bancos / Seguros)": ["NIM", "ROE", "ROA", "CET1 Ratio", "NPL Ratio", "Coverage Ratio", "Loan Growth", "Efficiency Ratio", "Deposits Growth"],
  "Consumo Discrecional": ["SSS Growth", "Gross Margin", "EBITDA Margin", "Inventory Turnover", "Digital Penetration", "Rev/Store", "ARPU"],
  "Consumo No Discrecional (Staples)": ["Organic Growth", "Volume vs Price Mix", "Gross Margin", "Market Share", "Working Capital Days", "Dividend Payout"],
  "Salud / Healthcare": ["Pipeline Assets", "Patent Cliff", "R&D / Revenue", "Top Drug Revenue %", "Approval Rate", "NDA/BLA Submissions"],
  "Energía": ["Production (boe/d)", "Realized Price", "F&D Costs", "RRR", "Netback/bbl", "Breakeven Price", "Shareholder Yield"],
  "Materiales": ["Production Volume", "Cash Cost/Unit", "EBITDA/Ton", "Reserve Life", "Realized Price", "Capex/Sustaining"],
  "Industrial": ["Organic Growth", "Backlog", "Book-to-Bill", "EBITDA Margin", "FCF Conversion", "Services Mix"],
  "Servicios Públicos (Utilities)": ["Rate Base Growth", "Earned ROE", "Dividend CAGR", "Net Debt/EBITDA", "Renewable %", "Load Growth"],
  "Real Estate (REITs)": ["FFO/Share", "NAV/Share", "Occupancy %", "Same-Store NOI", "WALE", "Cap Rate", "Dividend Yield"],
  "Telecomunicaciones": ["ARPU", "Churn Rate", "Net Adds", "EBITDA Margin", "Capex/Revenue", "5G Coverage %"],
  "Otro": ["Revenue Growth", "Gross Margin", "EBITDA Margin", "FCF Margin", "Net Debt/EBITDA", "ROIC"],
};

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(sector) {
  const focus = SECTOR_FOCUS[sector] || SECTOR_FOCUS["Otro"];
  const metrics = (SECTOR_METRICS_REF[sector] || []).join(", ");
  return `You are a senior buy-side fundamental analyst covering ${sector} companies. You produce institutional-grade research reports for portfolio managers.

SECTOR: ${sector}
SECTOR-SPECIFIC METRICS TO EMPHASIZE: ${focus}
KEY METRICS TO ALWAYS INCLUDE: ${metrics}

YOUR TASK: Perform a comprehensive fundamental analysis using all available knowledge about:
1. Latest quarterly or annual financial results (income statement, balance sheet, cash flow)
2. Analyst consensus: ratings, price targets, buy/hold/sell counts
3. Company-provided forward guidance (next quarter + full year)
4. Sector trends, competitive dynamics, and macro factors
5. Specific risks tied to this company and sector

Be precise with numbers. If data is unavailable, use "N/D".

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no backticks, no preamble, no explanation after.

{
  "company_name": "Full legal name",
  "ticker": "TICKER",
  "exchange": "NYSE/NASDAQ/etc",
  "report_period": "e.g. Q1 FY2025 or FY2024",
  "report_date": "e.g. January 30, 2025",
  "sector": "${sector}",
  "executive_summary": "4-6 sentence comprehensive narrative: recent performance, key financial trends, competitive position, and main investment consideration. Be specific, not generic.",
  "investment_highlights": ["Concrete positive 1", "Concrete positive 2", "Concrete positive 3"],
  "key_metrics": [
    {
      "name": "Metric name",
      "value": "Current value with units",
      "previous": "Prior period value",
      "trend": "up|down|flat",
      "vs_consensus": "beat|miss|in-line|n/a",
      "comment": "1-sentence interpretation"
    }
  ],
  "income_statement": {
    "revenue": {"value": "$X.Xb", "growth_yoy": "+X.X%", "vs_est": "beat/miss/in-line"},
    "gross_profit": {"value": "$X.Xb", "margin": "XX.X%"},
    "operating_income": {"value": "$X.Xb", "margin": "XX.X%"},
    "ebitda": {"value": "$X.Xb", "margin": "XX.X%"},
    "net_income": {"value": "$X.Xb", "margin": "XX.X%"},
    "eps": {"value": "$X.XX", "growth_yoy": "+X.X%", "vs_est": "beat/miss/in-line"}
  },
  "balance_sheet": {
    "cash": "$X.Xb",
    "total_debt": "$X.Xb",
    "net_debt": "$X.Xb",
    "net_debt_ebitda": "X.Xx",
    "equity": "$X.Xb",
    "current_ratio": "X.Xx",
    "observation": "Most important balance sheet takeaway in 2 sentences"
  },
  "cash_flow": {
    "operating_cf": "$X.Xb",
    "capex": "$X.Xb",
    "fcf": "$X.Xb",
    "fcf_margin": "XX.X%",
    "shareholder_returns": "$X.Xb (buybacks + dividends)",
    "observation": "Most important cash flow takeaway in 2 sentences"
  },
  "sector_metrics": [
    {"name": "Sector-specific metric", "value": "Value with units", "context": "What this implies for the company in 1 sentence"}
  ],
  "risks": [
    {
      "title": "Risk title",
      "severity": "high|medium|low",
      "category": "Macro|Competitivo|Regulatorio|Operacional|Financiero|Sector",
      "description": "2-3 sentences: what the risk is and its potential financial/business impact.",
      "mitigation": "What management is doing to reduce this risk."
    }
  ],
  "sector_outlook": "2-3 paragraphs: (1) current state of the sector with key data points, (2) main growth catalysts and structural headwinds, (3) how this specific company is positioned competitively.",
  "analyst_views": {
    "consensus_rating": "Strong Buy|Buy|Hold|Sell|Strong Sell",
    "avg_price_target": "$XXX",
    "current_price": "$XXX",
    "implied_upside": "+XX%",
    "high_target": "$XXX",
    "low_target": "$XXX",
    "buy_count": 0,
    "hold_count": 0,
    "sell_count": 0,
    "recent_changes": "Summary of rating/target changes in the past 30-60 days",
    "bull_case": "The bull thesis in 2 sentences",
    "bear_case": "The bear thesis in 2 sentences"
  },
  "guidance": {
    "next_quarter_revenue": "Range or midpoint",
    "next_quarter_eps": "Range or midpoint",
    "full_year_revenue": "Range or midpoint",
    "full_year_eps": "Range or midpoint",
    "vs_consensus": "above|in-line|below",
    "management_tone": "bullish|cautious|neutral|mixed",
    "key_points": ["Specific guidance point 1", "Specific guidance point 2", "Specific guidance point 3"],
    "narrative": "2-3 paragraphs: what guidance implies about management confidence, key assumptions embedded, how the market is likely to react, and risks to the guidance."
  },
  "valuation": {
    "pe_forward": "XXx",
    "ev_ebitda": "XXx",
    "ps_ratio": "XXx",
    "pb_ratio": "XXx",
    "fcf_yield": "X.X%",
    "vs_peers": "premium|discount|in-line",
    "comment": "2 sentences: is current valuation justified given growth and risk profile?"
  }
}

Include 7-10 key_metrics (sector-relevant), 4-6 risks, 4-6 sector_metrics.`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseFolderName(a) {
  const t = (a.ticker || "UNKNOWN").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const rp = (a.report_period || "").trim();
  const qMatch = rp.match(/Q(\d)/i) || rp.match(/(\d)Q/i);
  const yrMatch = rp.match(/20\d{2}/);
  const q = qMatch ? `Q${qMatch[1]}` : null;
  const yr = yrMatch ? yrMatch[0] : null;
  if (q && yr) return `${t}_${q}_${yr}`;
  if (yr) return `${t}_FY${yr}`;
  return `${t}_${rp.replace(/\s+/g, "_").replace(/[^A-Z0-9_]/gi, "")}` || `${t}_Analysis`;
}

// ─── HTML Report Generator ───────────────────────────────────────────────────

function generateReportHTML(a) {
  const cc = (r) => r?.includes("Buy") ? "#10b981" : r?.includes("Hold") ? "#f59e0b" : r?.includes("Sell") ? "#f87171" : "#8090a4";
  const sv = { high: ["#ef4444", "ALTO"], medium: ["#f59e0b", "MEDIO"], low: ["#10b981", "BAJO"] };
  const fmt = v => v || "N/D";
  const rows = (items) => items.map(([l, v, c]) =>
    `<tr><td class="lbl">${l}</td><td class="val" style="color:${c || "#d1d9e0"}">${fmt(v)}</td></tr>`
  ).join("");

  const risks = (a.risks || []).map(r => {
    const [col, lbl] = sv[r.severity] || sv.medium;
    return `<div class="risk-card" style="border-left:3px solid ${col};background:${col}10">
      <div class="risk-head">
        <span class="risk-dot" style="background:${col}"></span>
        <span class="risk-title">${r.title}</span>
        <span class="badge" style="color:${col};border-color:${col}">${lbl}</span>
        ${r.category ? `<span class="cat-badge">${r.category}</span>` : ""}
      </div>
      <p class="risk-desc">${r.description}</p>
      ${r.mitigation ? `<div class="mit"><span class="mit-lbl">Mitigación:</span> ${r.mitigation}</div>` : ""}
    </div>`;
  }).join("");

  const metricCards = (a.key_metrics || []).map(m => {
    const tc = m.trend === "up" ? "#10b981" : m.trend === "down" ? "#f87171" : "#4b5a6a";
    const vc = m.vs_consensus === "beat" ? "#10b981" : m.vs_consensus === "miss" ? "#f87171" : "#f59e0b";
    return `<div class="metric-card">
      <div class="mc-top">
        <span class="mc-name">${m.name}</span>
        ${m.vs_consensus && m.vs_consensus !== "n/a" ? `<span class="mc-badge" style="color:${vc};border-color:${vc}">${m.vs_consensus.toUpperCase()}</span>` : ""}
      </div>
      <div class="mc-val">${fmt(m.value)} ${m.trend ? `<span style="color:${tc}">${m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}</span>` : ""}</div>
      ${m.previous ? `<div class="mc-prev">vs ${m.previous}</div>` : ""}
      ${m.comment ? `<div class="mc-comment">${m.comment}</div>` : ""}
    </div>`;
  }).join("");

  const sectorMetrics = (a.sector_metrics || []).map(m => `
    <div class="sm-card">
      <div class="sm-name">${m.name}</div>
      <div class="sm-val">${fmt(m.value)}</div>
      ${m.context ? `<div class="sm-ctx">${m.context}</div>` : ""}
    </div>`).join("");

  const highlights = (a.investment_highlights || []).map(h => `<li>${h}</li>`).join("");
  const guidPoints = (a.guidance?.key_points || []).map((p, i) =>
    `<div class="gp"><span class="gp-n">0${i + 1}</span><span>${p}</span></div>`
  ).join("");

  const totalA = (a.analyst_views?.buy_count || 0) + (a.analyst_views?.hold_count || 0) + (a.analyst_views?.sell_count || 0);
  const pB = totalA ? Math.round((a.analyst_views.buy_count / totalA) * 100) : 0;
  const pH = totalA ? Math.round((a.analyst_views.hold_count / totalA) * 100) : 0;
  const pS = totalA ? Math.round((a.analyst_views.sell_count / totalA) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${a.ticker} · ${a.report_period} · Financial Intelligence Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#070b12;color:#d1d9e0;font-family:'DM Sans',sans-serif;font-size:14px;line-height:1.6}
  .page{max-width:960px;margin:0 auto;padding:28px 20px}
  .hdr{background:rgba(0,0,0,0.4);border-bottom:1px solid rgba(245,158,11,0.15);padding:18px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-bottom:28px}
  .hdr-ticker{font-family:'IBM Plex Mono',monospace;font-size:26px;font-weight:700;color:#f59e0b;letter-spacing:.06em}
  .hdr-exch{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#374151;letter-spacing:.12em;margin-top:3px}
  .hdr-name{font-size:18px;font-weight:600;margin-bottom:4px}
  .hdr-meta{font-size:11px;color:#374151}
  .hdr-consensus{margin-left:auto;text-align:right}
  .cons-lbl{font-size:9px;color:#2d3748;text-transform:uppercase;letter-spacing:.18em;margin-bottom:4px}
  .cons-val{font-size:18px;font-weight:700}
  .divider{width:1px;height:44px;background:rgba(255,255,255,0.05)}
  .section{margin-bottom:26px}
  .sl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:rgba(245,158,11,.5);letter-spacing:.22em;text-transform:uppercase;margin-bottom:12px}
  .card{background:rgba(255,255,255,0.018);border:1px solid rgba(255,255,255,0.055);border-radius:10px;padding:16px 18px;margin-bottom:12px}
  .prose{font-size:13px;line-height:1.75;color:#8090a4;margin-bottom:10px}
  table.data{width:100%;border-collapse:collapse}
  table.data td{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:13px}
  td.lbl{color:#5a6a7e;width:55%}
  td.val{font-family:'IBM Plex Mono',monospace;font-size:13px;color:#d1d9e0;font-weight:500;text-align:right}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .metrics-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:9px}
  .metric-card{background:rgba(255,255,255,.015);border:1px solid rgba(255,255,255,.045);border-radius:9px;padding:12px 14px}
  .mc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:7px}
  .mc-name{font-size:10px;color:#4b5a6a;text-transform:uppercase;letter-spacing:.08em;line-height:1.3}
  .mc-badge{font-size:9px;padding:2px 5px;border:1px solid;border-radius:4px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
  .mc-val{font-family:'IBM Plex Mono',monospace;font-size:16px;color:#d1d9e0;font-weight:600}
  .mc-prev{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#2d3748;margin-top:3px}
  .mc-comment{font-size:11px;color:#374151;margin-top:6px;line-height:1.45}
  .sm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:9px}
  .sm-card{background:rgba(245,158,11,.035);border:1px solid rgba(245,158,11,.09);border-radius:9px;padding:12px 14px}
  .sm-name{font-size:9px;color:#4b5a6a;text-transform:uppercase;letter-spacing:.12em;margin-bottom:5px}
  .sm-val{font-family:'IBM Plex Mono',monospace;font-size:17px;color:#f59e0b;font-weight:600}
  .sm-ctx{font-size:11px;color:#374151;margin-top:5px;line-height:1.45}
  .risk-card{border-radius:9px;padding:14px 16px;margin-bottom:9px}
  .risk-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
  .risk-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .risk-title{font-size:14px;font-weight:600;color:#d1d9e0;flex:1}
  .badge{font-size:9px;font-weight:700;padding:2px 7px;border:1px solid;border-radius:4px;letter-spacing:.1em}
  .cat-badge{font-size:9px;color:#374151;padding:2px 6px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.05);border-radius:4px}
  .risk-desc{font-size:13px;color:#8090a4;line-height:1.6;margin-bottom:7px}
  .mit{display:flex;gap:7px}
  .mit-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#10b981;letter-spacing:.12em;text-transform:uppercase;flex-shrink:0;margin-top:2px}
  .cons-bar{height:8px;border-radius:5px;overflow:hidden;display:flex;margin:9px 0}
  .bar-b{background:#10b981}.bar-h{background:#f59e0b}.bar-s{background:#ef4444}
  .bar-legend{display:flex;gap:12px;font-size:11px}
  .gp{display:flex;gap:9px;margin-bottom:10px}
  .gp-n{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#f59e0b;min-width:20px;margin-top:2px}
  ul.hl{list-style:none;padding:0}
  ul.hl li{display:flex;gap:8px;align-items:flex-start;margin-bottom:9px;font-size:13px;color:#8090a4;line-height:1.55}
  ul.hl li::before{content:"✓";color:#10b981;font-size:11px;flex-shrink:0;margin-top:2px}
  .footer{margin-top:36px;padding-top:14px;border-top:1px solid rgba(255,255,255,.04);font-size:10px;color:#1e293b;font-family:'IBM Plex Mono',monospace;letter-spacing:.07em}
  @media(max-width:600px){.grid2,.grid3{grid-template-columns:1fr}.hdr{gap:10px}.hdr-ticker{font-size:22px}}
  @media print{body{background:#fff;color:#111}.card{border-color:#ddd;background:#fff}.prose,.mc-comment,.risk-desc{color:#444}.sl{color:#b45309}}
</style>
</head>
<body>
<div class="hdr">
  <div>
    <div class="hdr-ticker">${fmt(a.ticker)}</div>
    <div class="hdr-exch">${fmt(a.exchange)}</div>
  </div>
  <div class="divider"></div>
  <div>
    <div class="hdr-name">${fmt(a.company_name)}</div>
    <div class="hdr-meta">${fmt(a.sector)} &nbsp;·&nbsp; ${fmt(a.report_period)} &nbsp;·&nbsp; ${fmt(a.report_date)}</div>
  </div>
  ${a.analyst_views ? `<div class="hdr-consensus">
    <div class="cons-lbl">Consenso</div>
    <div class="cons-val" style="color:${cc(a.analyst_views.consensus_rating)}">${fmt(a.analyst_views.consensus_rating)}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#374151;margin-top:3px">PT ${fmt(a.analyst_views.avg_price_target)}</div>
  </div>` : ""}
</div>

<div class="page">

<div class="section"><div class="sl">Resumen Ejecutivo</div>
  <div class="card"><p class="prose" style="font-size:14px;line-height:1.8">${fmt(a.executive_summary)}</p></div>
</div>

<div class="grid2 section">
  ${highlights ? `<div class="card"><div class="sl">Puntos Destacados</div><ul class="hl">${highlights}</ul></div>` : ""}
  ${a.valuation ? `<div class="card"><div class="sl">Valoración</div>
    <table class="data"><tbody>
      ${rows([["P/E Forward", a.valuation.pe_forward], ["EV/EBITDA", a.valuation.ev_ebitda], ["P/Ventas", a.valuation.ps_ratio], ["P/Libro", a.valuation.pb_ratio], ["FCF Yield", a.valuation.fcf_yield, "#10b981"], ["vs. Peers", a.valuation.vs_peers, "#f59e0b"]])}
    </tbody></table>
    ${a.valuation.comment ? `<p class="prose" style="margin-top:11px;font-size:12px">${a.valuation.comment}</p>` : ""}
  </div>` : ""}
</div>

${sectorMetrics ? `<div class="section"><div class="sl">Métricas Específicas · ${fmt(a.sector)}</div><div class="sm-grid">${sectorMetrics}</div></div>` : ""}

<div class="section"><div class="sl">KPIs Principales</div><div class="metrics-grid">${metricCards}</div></div>

<div class="grid3 section">
  ${a.income_statement ? `<div class="card"><div class="sl">P&L</div>
    <table class="data"><tbody>
      ${rows([["Ingresos", `${fmt(a.income_statement.revenue?.value)} <small>${a.income_statement.revenue?.growth_yoy || ""}</small>`], ["Gross Profit", `${fmt(a.income_statement.gross_profit?.value)} <small>${a.income_statement.gross_profit?.margin || ""}</small>`], ["EBITDA", `${fmt(a.income_statement.ebitda?.value)} <small>${a.income_statement.ebitda?.margin || ""}</small>`], ["EBIT", fmt(a.income_statement.operating_income?.value)], ["Net Income", `${fmt(a.income_statement.net_income?.value)} <small>${a.income_statement.net_income?.margin || ""}</small>`], ["EPS", a.income_statement.eps?.value, "#f59e0b"]])}
    </tbody></table></div>` : ""}
  ${a.balance_sheet ? `<div class="card"><div class="sl">Balance</div>
    <table class="data"><tbody>
      ${rows([["Caja", a.balance_sheet.cash, "#10b981"], ["Deuda Total", a.balance_sheet.total_debt, "#f87171"], ["Deuda Neta", a.balance_sheet.net_debt], ["ND/EBITDA", a.balance_sheet.net_debt_ebitda], ["Patrimonio", a.balance_sheet.equity], ["Current Ratio", a.balance_sheet.current_ratio]])}
    </tbody></table>
    ${a.balance_sheet.observation ? `<p class="prose" style="margin-top:10px;font-size:12px">${a.balance_sheet.observation}</p>` : ""}
  </div>` : ""}
  ${a.cash_flow ? `<div class="card"><div class="sl">Cash Flow</div>
    <table class="data"><tbody>
      ${rows([["FCO", a.cash_flow.operating_cf, "#10b981"], ["CapEx", a.cash_flow.capex, "#f87171"], ["FCF", a.cash_flow.fcf, (a.cash_flow.fcf || "").startsWith("-") ? "#f87171" : "#10b981"], ["FCF Margin", a.cash_flow.fcf_margin], ["Returns", a.cash_flow.shareholder_returns, "#f59e0b"]])}
    </tbody></table>
    ${a.cash_flow.observation ? `<p class="prose" style="margin-top:10px;font-size:12px">${a.cash_flow.observation}</p>` : ""}
  </div>` : ""}
</div>

<div class="section"><div class="sl">Análisis de Riesgos</div>${risks || "<p class='prose'>Sin datos.</p>"}</div>

<div class="section"><div class="sl">Outlook del Sector</div>
  <div class="card">${(a.sector_outlook || "Sin datos.").split(/\n\n+/).map(p => `<p class="prose">${p}</p>`).join("")}</div>
</div>

${a.analyst_views ? `<div class="section"><div class="sl">Consenso de Analistas</div>
  <div class="grid2">
    <div class="card">
      <div style="display:flex;align-items:center;gap:18px;margin-bottom:14px">
        <div>
          <div style="font-size:19px;font-weight:700;color:${cc(a.analyst_views.consensus_rating)}">${fmt(a.analyst_views.consensus_rating)}</div>
          ${totalA > 0 ? `<div style="font-size:10px;color:#374151;margin-top:2px">${totalA} analistas</div>` : ""}
        </div>
        ${totalA > 0 ? `<div style="flex:1">
          <div class="cons-bar"><div class="bar-b" style="width:${pB}%"></div><div class="bar-h" style="width:${pH}%"></div><div class="bar-s" style="width:${pS}%"></div></div>
          <div class="bar-legend"><span style="color:#10b981">Compra ${a.analyst_views.buy_count}</span><span style="color:#f59e0b">Neutro ${a.analyst_views.hold_count}</span><span style="color:#f87171">Venta ${a.analyst_views.sell_count}</span></div>
        </div>` : ""}
      </div>
      <table class="data"><tbody>
        ${rows([["Precio Actual", a.analyst_views.current_price], ["PT Promedio", a.analyst_views.avg_price_target, "#f59e0b"], ["Potencial", a.analyst_views.implied_upside, (a.analyst_views.implied_upside || "").startsWith("-") ? "#f87171" : "#10b981"], ["PT Máx.", a.analyst_views.high_target], ["PT Mín.", a.analyst_views.low_target]])}
      </tbody></table>
    </div>
    <div>
      <div class="card" style="margin-bottom:9px"><div class="sl">Cambios Recientes</div><p class="prose">${fmt(a.analyst_views.recent_changes)}</p></div>
      <div class="card" style="border-left:3px solid rgba(16,185,129,.4);margin-bottom:9px"><div class="sl">Bull Case</div><p class="prose" style="color:#4ade80">${fmt(a.analyst_views.bull_case)}</p></div>
      <div class="card" style="border-left:3px solid rgba(239,68,68,.4)"><div class="sl">Bear Case</div><p class="prose" style="color:#f87171">${fmt(a.analyst_views.bear_case)}</p></div>
    </div>
  </div>
</div>` : ""}

${a.guidance ? `<div class="section"><div class="sl">Forward Guidance</div>
  <div class="grid2">
    <div>
      <div class="card" style="margin-bottom:9px"><div class="sl">Próximo Trimestre</div>
        <table class="data"><tbody>${rows([["Revenue", a.guidance.next_quarter_revenue], ["EPS", a.guidance.next_quarter_eps]])}</tbody></table></div>
      <div class="card" style="margin-bottom:9px"><div class="sl">Año Completo</div>
        <table class="data"><tbody>${rows([["Revenue", a.guidance.full_year_revenue], ["EPS", a.guidance.full_year_eps]])}</tbody></table></div>
      <div class="card"><div class="sl">Evaluación</div>
        <table class="data"><tbody>${rows([["vs. Consenso", a.guidance.vs_consensus, a.guidance.vs_consensus === "above" ? "#10b981" : a.guidance.vs_consensus === "below" ? "#f87171" : "#f59e0b"], ["Tono Mgmt", a.guidance.management_tone]])}</tbody></table></div>
    </div>
    <div>
      ${guidPoints ? `<div class="card" style="margin-bottom:9px"><div class="sl">Puntos Clave</div>${guidPoints}</div>` : ""}
      <div class="card"><div class="sl">Análisis del Guidance</div>
        ${(a.guidance.narrative || "Sin datos.").split(/\n\n+/).map(p => `<p class="prose">${p}</p>`).join("")}
      </div>
    </div>
  </div>
</div>` : ""}

<div class="footer">Financial Intelligence Terminal &nbsp;·&nbsp; ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })} &nbsp;·&nbsp; Solo para uso informativo.</div>
</div>
</body></html>`;
}

// ─── Helper UI Components ─────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 11, padding: "16px 18px", ...style }}>
      {children}
    </div>
  );
}
function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(245,158,11,0.55)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12 }}>
      ── {children}
    </div>
  );
}
function DataRow({ label, value, sub, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <span style={{ fontSize: 12, color: "#5a6a7e" }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: color || "#d1d9e0", fontWeight: 500 }}>{value || "N/D"}</span>
        {sub && <span style={{ fontSize: 10, color: "#374151", marginLeft: 7 }}>{sub}</span>}
      </div>
    </div>
  );
}
function Prose({ children, style = {} }) {
  return <p style={{ fontSize: 13, lineHeight: 1.72, color: "#8090a4", ...style }}>{children}</p>;
}
function consensusColor(r) {
  if (!r) return "#6b7280";
  const l = r.toLowerCase();
  if (l.includes("strong buy")) return "#10b981";
  if (l.includes("buy")) return "#34d399";
  if (l.includes("hold") || l.includes("neutral")) return "#f59e0b";
  if (l.includes("sell")) return "#f87171";
  return "#6b7280";
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function SummaryTab({ a }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card>
        <SectionLabel>Resumen Ejecutivo</SectionLabel>
        <Prose style={{ fontSize: 14, lineHeight: 1.8 }}>{a.executive_summary}</Prose>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {a.investment_highlights?.length > 0 && (
          <Card>
            <SectionLabel>Puntos Destacados</SectionLabel>
            {a.investment_highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 9, marginBottom: 11, alignItems: "flex-start" }}>
                <div style={{ width: 19, height: 19, borderRadius: "50%", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 9, color: "#10b981" }}>✓</span>
                </div>
                <span style={{ fontSize: 13, color: "#8090a4", lineHeight: 1.55 }}>{h}</span>
              </div>
            ))}
          </Card>
        )}
        {a.valuation && (
          <Card>
            <SectionLabel>Valoración</SectionLabel>
            <DataRow label="P/E Forward" value={a.valuation.pe_forward} />
            <DataRow label="EV/EBITDA" value={a.valuation.ev_ebitda} />
            <DataRow label="P/Ventas (P/S)" value={a.valuation.ps_ratio} />
            <DataRow label="FCF Yield" value={a.valuation.fcf_yield} color="#10b981" />
            <DataRow label="vs. Peers" value={a.valuation.vs_peers} color={a.valuation.vs_peers === "premium" ? "#f59e0b" : "#34d399"} />
            {a.valuation.comment && <Prose style={{ marginTop: 12, fontSize: 12 }}>{a.valuation.comment}</Prose>}
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricsTab({ a, sector }) {
  const focus = SECTOR_FOCUS[sector] || SECTOR_FOCUS["Otro"];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {a.sector_metrics?.length > 0 && (
        <Card>
          <SectionLabel>Métricas Específicas · {sector}</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 9 }}>
            {a.sector_metrics.map((m, i) => (
              <div key={i} style={{ background: "rgba(245,158,11,0.035)", border: "1px solid rgba(245,158,11,0.09)", borderRadius: 9, padding: "12px 14px" }}>
                <div style={{ fontSize: 9, color: "#4b5a6a", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{m.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, color: "#f59e0b", fontWeight: 600 }}>{m.value || "N/D"}</div>
                {m.context && <div style={{ fontSize: 11, color: "#374151", marginTop: 6, lineHeight: 1.45 }}>{m.context}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card>
        <SectionLabel>KPIs Principales</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 9 }}>
          {(a.key_metrics || []).map((m, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.045)", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: "#4b5a6a", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.35 }}>{m.name}</span>
                {m.vs_consensus && m.vs_consensus !== "n/a" && (
                  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, fontWeight: 700, background: m.vs_consensus === "beat" ? "rgba(16,185,129,0.12)" : m.vs_consensus === "miss" ? "rgba(248,113,113,0.12)" : "rgba(245,158,11,0.12)", color: m.vs_consensus === "beat" ? "#10b981" : m.vs_consensus === "miss" ? "#f87171" : "#f59e0b", textTransform: "uppercase" }}>
                    {m.vs_consensus}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 16, color: "#d1d9e0", fontWeight: 600 }}>{m.value || "N/D"}</span>
                {m.previous && <span style={{ fontSize: 10, color: "#2d3748" }}>vs {m.previous}</span>}
                {m.trend && <span style={{ marginLeft: "auto", fontSize: 14, color: m.trend === "up" ? "#10b981" : m.trend === "down" ? "#f87171" : "#4b5a6a" }}>{m.trend === "up" ? "↑" : m.trend === "down" ? "↓" : "→"}</span>}
              </div>
              {m.comment && <div style={{ fontSize: 11, color: "#374151", marginTop: 7, lineHeight: 1.45 }}>{m.comment}</div>}
            </div>
          ))}
        </div>
      </Card>
      <div style={{ padding: "9px 13px", background: "rgba(245,158,11,0.025)", border: "1px solid rgba(245,158,11,0.07)", borderRadius: 8 }}>
        <div style={{ fontSize: 9, color: "rgba(245,158,11,0.45)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>Referencia · {sector}</div>
        <Prose style={{ fontSize: 11, color: "#374151" }}>{focus}</Prose>
      </div>
    </div>
  );
}

function FinancialTab({ a }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
      <Card>
        <SectionLabel>P&L</SectionLabel>
        {a.income_statement ? (
          <>
            <DataRow label="Ingresos" value={a.income_statement.revenue?.value} sub={a.income_statement.revenue?.growth_yoy} />
            <DataRow label="Gross Profit" value={a.income_statement.gross_profit?.value} sub={a.income_statement.gross_profit?.margin} />
            <DataRow label="EBITDA" value={a.income_statement.ebitda?.value} sub={a.income_statement.ebitda?.margin} />
            <DataRow label="EBIT" value={a.income_statement.operating_income?.value} sub={a.income_statement.operating_income?.margin} />
            <DataRow label="Net Income" value={a.income_statement.net_income?.value} sub={a.income_statement.net_income?.margin} />
            <DataRow label="EPS" value={a.income_statement.eps?.value} sub={a.income_statement.eps?.growth_yoy} color="#f59e0b" />
          </>
        ) : <Prose>Sin datos.</Prose>}
      </Card>
      <Card>
        <SectionLabel>Balance Sheet</SectionLabel>
        {a.balance_sheet ? (
          <>
            <DataRow label="Caja & Equiv." value={a.balance_sheet.cash} color="#10b981" />
            <DataRow label="Deuda Total" value={a.balance_sheet.total_debt} color="#f87171" />
            <DataRow label="Deuda Neta" value={a.balance_sheet.net_debt} />
            <DataRow label="Net Debt / EBITDA" value={a.balance_sheet.net_debt_ebitda} />
            <DataRow label="Patrimonio Neto" value={a.balance_sheet.equity} />
            <DataRow label="Current Ratio" value={a.balance_sheet.current_ratio} />
            {a.balance_sheet.observation && <Prose style={{ marginTop: 12, fontSize: 12 }}>{a.balance_sheet.observation}</Prose>}
          </>
        ) : <Prose>Sin datos.</Prose>}
      </Card>
      <Card>
        <SectionLabel>Flujo de Caja</SectionLabel>
        {a.cash_flow ? (
          <>
            <DataRow label="FCO" value={a.cash_flow.operating_cf} color="#10b981" />
            <DataRow label="CapEx" value={a.cash_flow.capex} color="#f87171" />
            <DataRow label="Free Cash Flow" value={a.cash_flow.fcf} color={(a.cash_flow.fcf || "").startsWith("-") ? "#f87171" : "#10b981"} />
            <DataRow label="FCF Margin" value={a.cash_flow.fcf_margin} />
            <DataRow label="Returns (BB+Div)" value={a.cash_flow.shareholder_returns} color="#f59e0b" />
            {a.cash_flow.observation && <Prose style={{ marginTop: 12, fontSize: 12 }}>{a.cash_flow.observation}</Prose>}
          </>
        ) : <Prose>Sin datos.</Prose>}
      </Card>
    </div>
  );
}

function RisksTab({ a }) {
  const cfg = {
    high: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.18)", dot: "#ef4444", badge: "#f87171", label: "ALTO" },
    medium: { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.18)", dot: "#f59e0b", badge: "#f59e0b", label: "MEDIO" },
    low: { bg: "rgba(16,185,129,0.04)", border: "rgba(16,185,129,0.15)", dot: "#10b981", badge: "#10b981", label: "BAJO" },
  };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {(a.risks || []).map((r, i) => {
        const s = cfg[r.severity] || cfg.medium;
        return (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: "14px 17px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9, flexWrap: "wrap" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, boxShadow: `0 0 5px ${s.dot}66`, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#d1d9e0", flex: 1 }}>{r.title}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4, border: `1px solid ${s.border}`, color: s.badge, letterSpacing: "0.1em" }}>{s.label}</span>
              {r.category && <span style={{ fontSize: 9, color: "#374151", padding: "2px 6px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 4 }}>{r.category}</span>}
            </div>
            <Prose style={{ fontSize: 13, marginBottom: 7 }}>{r.description}</Prose>
            {r.mitigation && (
              <div style={{ display: "flex", gap: 7 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#10b981", letterSpacing: "0.12em", textTransform: "uppercase", flexShrink: 0, marginTop: 2 }}>Mitigación:</span>
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{r.mitigation}</span>
              </div>
            )}
          </div>
        );
      })}
      {(!a.risks || a.risks.length === 0) && <Prose>Sin datos de riesgos.</Prose>}
    </div>
  );
}

function SectorTab({ a }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card>
        <SectionLabel>Outlook del Sector · {a.sector}</SectionLabel>
        {(a.sector_outlook || "Sin datos.").split(/\n\n+/).map((p, i) => <Prose key={i} style={{ marginBottom: 12 }}>{p}</Prose>)}
      </Card>
      {a.sector_metrics?.length > 0 && (
        <Card>
          <SectionLabel>Posicionamiento Competitivo</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 9 }}>
            {a.sector_metrics.map((m, i) => (
              <div key={i} style={{ padding: "11px 13px", background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.07)", borderRadius: 8 }}>
                <div style={{ fontSize: 9, color: "#4b5a6a", textTransform: "uppercase", letterSpacing: "0.12em" }}>{m.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: "#f59e0b", marginTop: 4, fontWeight: 600 }}>{m.value || "N/D"}</div>
                {m.context && <div style={{ fontSize: 11, color: "#374151", marginTop: 4, lineHeight: 1.45 }}>{m.context}</div>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function AnalystsTab({ a }) {
  const av = a.analyst_views;
  if (!av) return <Card><Prose>Sin datos de analistas.</Prose></Card>;
  const total = (av.buy_count || 0) + (av.hold_count || 0) + (av.sell_count || 0);
  const pB = total ? Math.round((av.buy_count / total) * 100) : 0;
  const pH = total ? Math.round((av.hold_count / total) * 100) : 0;
  const pS = total ? Math.round((av.sell_count / total) * 100) : 0;
  const upsidePositive = !(av.implied_upside || "").startsWith("-");
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
      <Card>
        <SectionLabel>Consenso Wall Street</SectionLabel>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: consensusColor(av.consensus_rating) }}>{av.consensus_rating || "N/D"}</div>
            {total > 0 && <div style={{ fontSize: 10, color: "#374151", marginTop: 2 }}>{total} analistas</div>}
          </div>
          {total > 0 && (
            <div style={{ flex: 1 }}>
              <div style={{ height: 8, borderRadius: 5, overflow: "hidden", display: "flex", marginBottom: 7 }}>
                <div style={{ width: `${pB}%`, background: "#10b981" }} />
                <div style={{ width: `${pH}%`, background: "#f59e0b" }} />
                <div style={{ width: `${pS}%`, background: "#ef4444" }} />
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                <span style={{ color: "#10b981" }}>Compra {av.buy_count}</span>
                <span style={{ color: "#f59e0b" }}>Neutro {av.hold_count}</span>
                <span style={{ color: "#f87171" }}>Venta {av.sell_count}</span>
              </div>
            </div>
          )}
        </div>
        <DataRow label="Precio Actual" value={av.current_price} />
        <DataRow label="PT Promedio" value={av.avg_price_target} color="#f59e0b" />
        <DataRow label="Potencial" value={av.implied_upside} color={upsidePositive ? "#10b981" : "#f87171"} />
        <DataRow label="PT Máximo" value={av.high_target} />
        <DataRow label="PT Mínimo" value={av.low_target} />
      </Card>
      <div style={{ display: "grid", gap: 10 }}>
        <Card><SectionLabel>Cambios Recientes</SectionLabel><Prose style={{ fontSize: 13 }}>{av.recent_changes || "Sin cambios recientes."}</Prose></Card>
        <Card style={{ borderLeft: "3px solid rgba(16,185,129,0.3)" }}><SectionLabel>Bull Case</SectionLabel><Prose style={{ fontSize: 13, color: "#4ade80" }}>{av.bull_case || "N/D"}</Prose></Card>
        <Card style={{ borderLeft: "3px solid rgba(239,68,68,0.3)" }}><SectionLabel>Bear Case</SectionLabel><Prose style={{ fontSize: 13, color: "#f87171" }}>{av.bear_case || "N/D"}</Prose></Card>
      </div>
    </div>
  );
}

function GuidanceTab({ a }) {
  const g = a.guidance;
  if (!g) return <Card><Prose>Sin datos de guidance.</Prose></Card>;
  const toneColor = { bullish: "#10b981", cautious: "#f87171", neutral: "#8090a4", mixed: "#f59e0b" };
  const toneLabel = { bullish: "Optimista", cautious: "Cauteloso", neutral: "Neutral", mixed: "Mixto" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <Card><SectionLabel>Próximo Trimestre</SectionLabel><DataRow label="Revenue" value={g.next_quarter_revenue || "N/D"} /><DataRow label="EPS" value={g.next_quarter_eps || "N/D"} /></Card>
        <Card><SectionLabel>Año Completo</SectionLabel><DataRow label="Revenue" value={g.full_year_revenue || "N/D"} /><DataRow label="EPS" value={g.full_year_eps || "N/D"} /></Card>
        <Card>
          <SectionLabel>Evaluación</SectionLabel>
          <DataRow label="vs. Consenso" value={g.vs_consensus || "N/D"} color={g.vs_consensus === "above" ? "#10b981" : g.vs_consensus === "below" ? "#f87171" : "#f59e0b"} />
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 11, color: "#4b5a6a" }}>Tono mgmt:</span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600, color: toneColor[g.management_tone] || "#8090a4" }}>{toneLabel[g.management_tone] || g.management_tone || "N/D"}</span>
          </div>
        </Card>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {g.key_points?.length > 0 && (
          <Card>
            <SectionLabel>Puntos Clave del Guidance</SectionLabel>
            {g.key_points.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: 9, marginBottom: 10 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#f59e0b", flexShrink: 0, marginTop: 2, minWidth: 18 }}>0{i + 1}</span>
                <Prose style={{ fontSize: 13 }}>{p}</Prose>
              </div>
            ))}
          </Card>
        )}
        <Card>
          <SectionLabel>Análisis del Guidance</SectionLabel>
          {(g.narrative || "Sin datos.").split(/\n\n+/).map((p, i) => <Prose key={i} style={{ marginBottom: 10, fontSize: 13 }}>{p}</Prose>)}
        </Card>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function FinancialTerminal() {
  const [ticker, setTicker] = useState("");
  const [sector, setSector] = useState("Tecnología");
  const [balanceFile, setBalanceFile] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptMode, setTranscriptMode] = useState("none");
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [error, setError] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const balanceRef = useRef();
  const transcriptRef = useRef();

  const STEPS = [
    "Preparando documentos...",
    "Analizando resultados financieros...",
    "Evaluando métricas del sector...",
    "Investigando riesgos...",
    "Consultando consenso de analistas...",
    "Generando informe de inversión...",
  ];

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  async function toB64(file) {
    return new Promise((ok, fail) => {
      const r = new FileReader();
      r.onload = () => ok(r.result.split(",")[1]);
      r.onerror = fail;
      r.readAsDataURL(file);
    });
  }

  // ── Export: iOS uses Web Share API → "Guardar en Archivos" ──────────────────
  async function exportReport(a) {
    if (!a) return;
    setExportStatus("saving");
    const fileName = parseFolderName(a);
    const htmlContent = generateReportHTML(a);

    try {
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });
      const htmlFile = new File([htmlBlob], `${fileName}_Report.html`, { type: "text/html" });

      // iOS / Mobile: use Web Share API with file → opens iOS Share Sheet
      // User can tap "Guardar en Archivos" → iCloud Drive / On My iPhone
      if (navigator.canShare && navigator.canShare({ files: [htmlFile] })) {
        await navigator.share({
          files: [htmlFile],
          title: `${a.ticker} · ${a.report_period} · Financial Report`,
          text: `Informe de análisis fundamental — ${a.company_name}`,
        });
        setExportStatus({ ok: true, fileName, method: "share" });
        setTimeout(() => setExportStatus(null), 5000);
        return;
      }

      // Desktop Chrome/Edge: File System Access API → choose folder
      if (window.showDirectoryPicker) {
        const dirHandle = await window.showDirectoryPicker({ mode: "readwrite", startIn: "desktop" });
        const subDir = await dirHandle.getDirectoryHandle(fileName, { create: true });

        const htmlFileH = await subDir.getFileHandle(`${fileName}_Report.html`, { create: true });
        const w1 = await htmlFileH.createWritable();
        await w1.write(htmlContent);
        await w1.close();

        const jsonFileH = await subDir.getFileHandle(`${fileName}_Data.json`, { create: true });
        const w2 = await jsonFileH.createWritable();
        await w2.write(JSON.stringify(a, null, 2));
        await w2.close();

        setExportStatus({ ok: true, fileName, method: "folder" });
        setTimeout(() => setExportStatus(null), 5000);
        return;
      }

      // Universal fallback: trigger download
      const url = URL.createObjectURL(htmlBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}_Report.html`;
      link.click();
      URL.revokeObjectURL(url);
      setExportStatus({ ok: true, fileName, method: "download" });
      setTimeout(() => setExportStatus(null), 5000);

    } catch (e) {
      if (e.name === "AbortError") { setExportStatus(null); return; }
      setExportStatus({ err: e.message });
      setTimeout(() => setExportStatus(null), 6000);
    }
  }

  // ── Export to PDF via print dialog ─────────────────────────────────────────
  function exportToPDF(a) {
    if (!a) return;
    const html = generateReportHTML(a);
    const fileName = parseFolderName(a);
    const printHTML = html.replace(
      "</body>",
      `<script>
        document.body.style.background = '#fff';
        document.body.style.color = '#111';
        window.onload = function() {
          document.title = '${fileName}_Report';
          setTimeout(function() { window.print(); }, 400);
        };
      <\/script></body>`
    );
    const blob = new Blob([printHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
      const a2 = document.createElement("a");
      a2.href = url; a2.download = `${fileName}_Report.html`; a2.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ── Analyze ─────────────────────────────────────────────────────────────────
  async function run() {
    if (!ticker.trim() && !balanceFile) {
      setError("Ingresá un ticker o cargá el balance en PDF para continuar.");
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setLoadingIdx(0);

    const interval = setInterval(() => setLoadingIdx(i => Math.min(i + 1, STEPS.length - 1)), 3500);

    try {
      const content = [];
      let basePrompt = `Sector: ${sector}.\n`;
      if (ticker.trim()) basePrompt += `Ticker: ${ticker.trim().toUpperCase()}.\n`;
      basePrompt += `\nPerform a comprehensive fundamental analysis using your most recent available knowledge. Return only the JSON object described in the system prompt.`;
      content.push({ type: "text", text: basePrompt });

      if (balanceFile) {
        const data = await toB64(balanceFile);
        content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
        content.push({ type: "text", text: "Extract all financial data from this filing document (income statement, balance sheet, cash flow)." });
      }

      if (transcriptMode === "file" && transcriptFile) {
        const data = await toB64(transcriptFile);
        content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
        content.push({ type: "text", text: "Extract guidance, management commentary, tone, and Q&A insights from this earnings call transcript." });
      } else if (transcriptMode === "text" && transcriptText.trim()) {
        content.push({ type: "text", text: `EARNINGS CALL TRANSCRIPT:\n\n${transcriptText.trim()}` });
      }

      // Call our secure Vercel API route (key stored server-side)
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: [
            {
              type: "text",
              text: buildSystemPrompt(sector),
              cache_control: { type: "ephemeral" },
            }
          ],
          messages: [{ role: "user", content }],
        }),
      });

      const d = await resp.json();
      if (d.error) throw new Error(typeof d.error === "string" ? d.error : d.error.message || JSON.stringify(d.error));

      const rawText = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error(`Respuesta inesperada. Fragmento: ${rawText.slice(0, 180)}`);

      let parsed;
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        let attempt = match[0].trimEnd().replace(/,\s*$/, "");
        const opens = (attempt.match(/\{/g) || []).length;
        const closes = (attempt.match(/\}/g) || []).length;
        attempt += "}".repeat(Math.max(0, opens - closes));
        try { parsed = JSON.parse(attempt); }
        catch { throw new Error("Respuesta cortada. Intentá de nuevo."); }
      }
      setAnalysis(parsed);
      setActiveTab("summary");

    } catch (e) {
      setError("Error: " + e.message);
    } finally {
      setLoading(false);
      clearInterval(interval);
      setLoadingIdx(0);
    }
  }

  const TABS = [
    { id: "summary",   icon: "◉", label: "Resumen"   },
    { id: "metrics",   icon: "◈", label: "Métricas"  },
    { id: "financial", icon: "◆", label: "Financiero" },
    { id: "risks",     icon: "▲", label: "Riesgos"   },
    { id: "sector",    icon: "◎", label: "Sector"    },
    { id: "analysts",  icon: "◇", label: "Analistas" },
    { id: "guidance",  icon: "→", label: "Guidance"  },
  ];

  const exportLabel = () => {
    if (exportStatus === "saving") return "Guardando...";
    if (exportStatus?.ok) {
      if (exportStatus.method === "share") return "✓ Compartido";
      if (exportStatus.method === "folder") return "✓ Guardado";
      return "✓ Descargado";
    }
    return isIOS ? "↑ Compartir Informe" : "↓ Exportar Informe";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#070b12", color: "#d1d9e0", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0a0e18; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.25); border-radius: 3px; }
        input, select, textarea { background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.07); color: #d1d9e0; border-radius: 8px; padding: 11px 13px; font-family: 'DM Sans', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s; width: 100%; }
        input:focus, select:focus, textarea:focus { border-color: rgba(245,158,11,0.38); box-shadow: 0 0 0 3px rgba(245,158,11,0.05); }
        select option { background: #111827; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dot-pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes fade-up { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fade-up 0.4s ease-out; }
        .pulse { animation: dot-pulse 2s ease-in-out infinite; }
        .tab-btn { background:none; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; white-space:nowrap; transition:all 0.15s; }
        .upload-area { cursor:pointer; transition:all 0.2s; }
        .upload-area:hover { border-color: rgba(245,158,11,0.35) !important; }
        @media(max-width:600px) { .hide-mobile { display:none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(245,158,11,0.1)", padding: "14px 18px", display: "flex", alignItems: "center", gap: 11, background: "rgba(0,0,0,0.25)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", boxShadow: "0 0 7px rgba(245,158,11,0.6)", flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#f59e0b", letterSpacing: "0.24em", textTransform: "uppercase" }}>Financial Intelligence Terminal</div>
          <div className="hide-mobile" style={{ fontSize: 9, color: "#2d3748", marginTop: 1, letterSpacing: "0.04em" }}>Análisis Fundamental · IA</div>
        </div>
        {analysis && (
          <div style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#374151", textAlign: "right" }}>
            <div style={{ color: "#f59e0b", fontSize: 11, fontWeight: 600 }}>{analysis.ticker}</div>
            <div style={{ marginTop: 1 }}>{analysis.report_period}</div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 14px" }}>

        {/* Input Panel */}
        <div style={{ background: "rgba(255,255,255,0.012)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 13, padding: "18px 16px", marginBottom: 18 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(245,158,11,0.5)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 16 }}>── Parámetros de Análisis</div>

          <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>Ticker</div>
              <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="AAPL"
                style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 20, fontWeight: 600, color: "#f59e0b", letterSpacing: "0.08em", textAlign: "center", padding: "10px 8px" }} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>Sector</div>
              <select value={sector} onChange={e => setSector(e.target.value)}>
                {SECTORS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12, marginBottom: 16 }}>
            {/* Balance */}
            <div>
              <div style={{ fontSize: 9, color: "#374151", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 5 }}>
                Filing PDF · 10-K / 10-Q <span style={{ color: "#1e293b" }}>(opcional)</span>
              </div>
              <div className="upload-area" onClick={() => balanceRef.current?.click()}
                style={{ border: `1px dashed ${balanceFile ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, padding: "11px 13px", display: "flex", alignItems: "center", gap: 9, background: balanceFile ? "rgba(245,158,11,0.04)" : "transparent" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>📄</span>
                <span style={{ fontSize: 12, color: balanceFile ? "#f59e0b" : "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {balanceFile ? balanceFile.name : "Cargar documento..."}
                </span>
                {balanceFile && (
                  <button onClick={e => { e.stopPropagation(); setBalanceFile(null); if (balanceRef.current) balanceRef.current.value = ""; }}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 15, padding: 0 }}>×</button>
                )}
              </div>
              <input ref={balanceRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setBalanceFile(e.target.files[0]); }} />
            </div>

            {/* Transcript */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 9, color: "#374151", letterSpacing: "0.15em", textTransform: "uppercase" }}>Transcript</span>
                {["none", "file", "text"].map(m => (
                  <button key={m} onClick={() => setTranscriptMode(m)} style={{
                    background: transcriptMode === m ? "rgba(245,158,11,0.12)" : "transparent",
                    border: `1px solid ${transcriptMode === m ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.07)"}`,
                    color: transcriptMode === m ? "#f59e0b" : "#374151",
                    borderRadius: 4, padding: "2px 7px", fontSize: 9, cursor: "pointer", textTransform: "uppercase",
                  }}>
                    {m === "none" ? "No" : m === "file" ? "PDF" : "Texto"}
                  </button>
                ))}
              </div>
              {transcriptMode === "none" && (
                <div style={{ border: "1px dashed rgba(255,255,255,0.05)", borderRadius: 8, padding: "11px 13px", color: "#1e293b", fontSize: 12 }}>
                  Sin transcript — análisis web/conocimiento base
                </div>
              )}
              {transcriptMode === "file" && (
                <>
                  <div className="upload-area" onClick={() => transcriptRef.current?.click()}
                    style={{ border: `1px dashed ${transcriptFile ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, padding: "11px 13px", display: "flex", alignItems: "center", gap: 9, background: transcriptFile ? "rgba(245,158,11,0.04)" : "transparent" }}>
                    <span style={{ fontSize: 14 }}>🎙</span>
                    <span style={{ fontSize: 12, color: transcriptFile ? "#f59e0b" : "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {transcriptFile ? transcriptFile.name : "Cargar transcript PDF..."}
                    </span>
                    {transcriptFile && (
                      <button onClick={e => { e.stopPropagation(); setTranscriptFile(null); if (transcriptRef.current) transcriptRef.current.value = ""; }}
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 15, padding: 0 }}>×</button>
                    )}
                  </div>
                  <input ref={transcriptRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) setTranscriptFile(e.target.files[0]); }} />
                </>
              )}
              {transcriptMode === "text" && (
                <textarea value={transcriptText} onChange={e => setTranscriptText(e.target.value)}
                  placeholder="Pegá el transcript aquí..." style={{ height: 80, resize: "vertical", fontSize: 12 }} />
              )}
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 13px", color: "#f87171", fontSize: 13, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button onClick={run} disabled={loading} style={{
            width: "100%", background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#f59e0b,#d97706)",
            color: loading ? "#374151" : "#07090f", border: "none", borderRadius: 9,
            padding: "13px", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.03em",
          }}>
            {loading ? "Analizando..." : "▶  Analizar"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <div style={{ display: "inline-block", position: "relative", width: 44, height: 44 }}>
              <div style={{ position: "absolute", inset: 0, border: "1.5px solid rgba(245,158,11,0.1)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", inset: 0, border: "1.5px solid transparent", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
            </div>
            <div style={{ marginTop: 16, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#f59e0b", letterSpacing: "0.1em" }}>{STEPS[loadingIdx]}</div>
            <div style={{ marginTop: 5, fontSize: 11, color: "#1e293b" }}>Puede tomar 25–40 segundos</div>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="fade-up">
            {/* Banner */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 16px", background: "rgba(245,158,11,0.035)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 22, fontWeight: 600, color: "#f59e0b", letterSpacing: "0.06em" }}>{analysis.ticker || ticker.toUpperCase()}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#374151", marginTop: 2 }}>{analysis.exchange}</div>
              </div>
              <div style={{ borderLeft: "1px solid rgba(255,255,255,0.05)", paddingLeft: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#d1d9e0" }}>{analysis.company_name}</div>
                <div style={{ fontSize: 11, color: "#374151", marginTop: 2 }}>{analysis.sector} · {analysis.report_period}</div>
              </div>

              {/* Consensus */}
              {analysis.analyst_views && (
                <div className="hide-mobile" style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 9, color: "#2d3748", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 3 }}>Consenso</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: consensusColor(analysis.analyst_views.consensus_rating) }}>{analysis.analyst_views.consensus_rating}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: "#374151", marginTop: 2 }}>PT {analysis.analyst_views.avg_price_target}</div>
                </div>
              )}

              {/* Export */}
              <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                <div style={{ display: "flex", gap: 7 }}>
                  {/* PDF */}
                  <button onClick={() => exportToPDF(analysis)}
                    style={{
                      background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)",
                      color: "#a5b4fc", borderRadius: 8, padding: "8px 12px",
                      fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
                    }}>
                    ⬡ PDF
                  </button>
                  {/* Share / Folder / Download */}
                  <button onClick={() => exportReport(analysis)} disabled={exportStatus === "saving"}
                    style={{
                      background: exportStatus?.ok ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.08)",
                      border: `1px solid ${exportStatus?.ok ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.25)"}`,
                      color: exportStatus?.ok ? "#10b981" : "#f59e0b",
                      borderRadius: 8, padding: "8px 12px",
                      fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12,
                      cursor: exportStatus === "saving" ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                    }}>
                    {exportStatus === "saving" && <span style={{ display: "inline-block", width: 11, height: 11, border: "1.5px solid transparent", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />}
                    {exportLabel()}
                  </button>
                </div>
                {exportStatus?.ok && (
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "#10b981" }}>
                    {exportStatus.method === "share" ? "iOS · Guardar en Archivos" : exportStatus.method === "folder" ? `📁 ${exportStatus.fileName}/` : `${exportStatus.fileName}.html`}
                  </div>
                )}
                {exportStatus?.err && <div style={{ fontSize: 10, color: "#f87171" }}>Error: {exportStatus.err}</div>}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.055)", marginBottom: 16, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              {TABS.map(t => (
                <button key={t.id} className="tab-btn" onClick={() => setActiveTab(t.id)}
                  style={{ borderBottom: `2px solid ${activeTab === t.id ? "#f59e0b" : "transparent"}`, color: activeTab === t.id ? "#f59e0b" : "#374151", padding: "9px 14px", fontWeight: activeTab === t.id ? 600 : 400, fontSize: 13, marginBottom: -1 }}>
                  <span className="hide-mobile">{t.icon} </span>{t.label}
                </button>
              ))}
            </div>

            {activeTab === "summary"   && <SummaryTab   a={analysis} />}
            {activeTab === "metrics"   && <MetricsTab   a={analysis} sector={sector} />}
            {activeTab === "financial" && <FinancialTab  a={analysis} />}
            {activeTab === "risks"     && <RisksTab     a={analysis} />}
            {activeTab === "sector"    && <SectorTab    a={analysis} />}
            {activeTab === "analysts"  && <AnalystsTab  a={analysis} />}
            {activeTab === "guidance"  && <GuidanceTab  a={analysis} />}
          </div>
        )}

        {/* Sector Reference */}
        {!analysis && !loading && (
          <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 11, padding: "16px 16px" }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "rgba(245,158,11,0.4)", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 12 }}>── Métricas Clave por Sector</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 9 }}>
              {Object.entries(SECTOR_METRICS_REF).map(([s, metrics]) => (
                <div key={s} style={{ padding: "10px 12px", background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 600, marginBottom: 6, opacity: 0.7 }}>{s}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {metrics.map((m, i) => (
                      <span key={i} style={{ fontSize: 9, padding: "2px 5px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 4, color: "#374151" }}>{m}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
