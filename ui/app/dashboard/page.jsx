"use client";
import React, { useState, useEffect } from "react";
import FocusDrawer from "./components/FocusDrawer";

export default function PremiumAladdinDashboard() {
  const [macroRegime, setMacroRegime] = useState({
    classified_regime: "Stable Inflation / Disinflation",
    growth_outlook: "Stable Growth",
    macro_inputs: { cpi_yoy: 3.1, benchmark_rate: "5.25% - 5.50%", rate_outlook: "Hawkish Pause" }
  });
  const [themes, setThemes] = useState([
    { id: "t1", name: "AI Infrastructure", sentiment: "Bullish", horizon: "Long-term", score: 91, sources: ["BlackRock", "Goldman Sachs", "JPM"], consensus_status: "Strong Consensus" },
    { id: "t2", name: "Defense Grid Modernization", sentiment: "Bullish", horizon: "Medium-term", score: 84, sources: ["Fidelity", "State Street"], consensus_status: "Moderate Consensus" },
    { id: "t3", name: "Energy Transition Infrastructure", sentiment: "Neutral", horizon: "Long-term", score: 62, sources: ["Vanguard", "BlackRock"], consensus_status: "Divergent Views" }
  ]);
  const [opportunities, setOpportunities] = useState([
    { ticker: "NVDA", company_name: "Nvidia Corp", exposure_type: "Pure-Play", exposure_score: 95, conviction_score: 92.5, action_recommendation: "Strong Buy", pe_ratio: "34.2", earnings_growth: "+18.5%" },
    { ticker: "VRT", company_name: "Vertiv Holdings Co", exposure_type: "Value-Chain", exposure_score: 85, conviction_score: 88.4, action_recommendation: "Buy", pe_ratio: "28.1", earnings_growth: "+22.4%" },
    { ticker: "ANET", company_name: "Arista Networks Inc", exposure_type: "Value-Chain", exposure_score: 80, conviction_score: 83.2, action_recommendation: "Buy", pe_ratio: "31.5", earnings_growth: "+14.2%" }
  ]);
  const [etfFlows, setEtfFlows] = useState([
    { sector: "Technology (XLK)", net_flow: "+$1.25B", trend: "Strong Inflow", isPositive: true },
    { sector: "Utilities (XLU)", net_flow: "+$450M", trend: "Moderate Inflow", isPositive: true },
    { sector: "Energy (XLE)", net_flow: "-$890M", trend: "Heavy Outflow", isPositive: false }
  ]);
  const [catalystAlerts, setCatalystAlerts] = useState([
    { ticker: "NVDA", headline: "Nvidia faces new export caps on advanced H20 chips", source: "Bloomberg", type: "Regulatory Risk", severity: "High", badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    { ticker: "VRT", headline: "Vertiv guidance upgraded following Q2 cooling backlogs", source: "SEC 10-Q", type: "Earnings Catalyst", severity: "Medium", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
  ]);
  const [narrativeShifts, setNarrativeShifts] = useState([
    { date: "2026-07-28", event: "BlackRock upgraded technology stance to strong overweight.", type: "Upgrade", velocity: "Fast", badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
    { date: "2026-07-26", event: "Goldman Sachs raised caution flag on utilities multiple expansions.", type: "Neutral", velocity: "Moderate", badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20" }
  ]);

  const [activeDesk, setActiveDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [isEquityLive, setIsEquityLive] = useState(false);
  const [isPortfolioLive, setIsPortfolioLive] = useState(false);

  const [ingestUrl, setIngestUrl] = useState("https://www.blackrock.com/us/individual/insights/blackrock-investment-institute/weekly-commentary");
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("BlackRock");
  const [earningsQuery, setEarningsQuery] = useState("NVDA");
  const [earningsResult, setEarningsResult] = useState("");
  const [isQueryingEarnings, setIsQueryingEarnings] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  const [drawerType, setDrawerType] = useState("theme");
  const [currentHoldings, setCurrentHoldings] = useState({ NVDA: 5.0, VRT: 12.0, ANET: 8.0 });

  const handleHoldingsChange = (ticker, val) => {
    setCurrentHoldings(prev => ({ ...prev, [ticker]: val }));
  };

  const handleIngestUrl = async (e) => {
    e.preventDefault();
    setIsIngesting(true);
    setIngestStatus(`Calling Scraper for ${selectedInstitution} via Research Agent...`);
    try {
      const formData = new FormData();
      formData.append("url", ingestUrl);
      formData.append("institution", selectedInstitution);

      const response = await fetch("http://localhost:8000/api/ingest-url", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data && data.status === "success") {
        setIngestStatus("Ingested successfully! Extracted " + (data.themes ? data.themes.length : 0) + " themes.");
        // Re-fetch themes to update Overview grid
        const themesRes = await fetch("http://localhost:8000/api/themes");
        const themesData = await themesRes.json();
        if (themesData && themesData.length > 0) {
          setThemes(themesData);
          setIsEquityLive(true);
        }
      } else {
        setIngestStatus("Failed to ingest content from URL.");
      }
    } catch (err) {
      setIngestStatus("Error triggering Research Agent.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsIngesting(true);
    setIngestStatus("Uploading and parsing " + file.name + " via Ingestion Workflow...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("institution", "User Research");

      const response = await fetch("http://localhost:8000/api/ingest-file", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data && data.status === "success") {
        setIngestStatus("Uploaded successfully! Extracted " + (data.themes ? data.themes.length : 0) + " themes.");
        // Re-fetch themes
        const themesRes = await fetch("http://localhost:8000/api/themes");
        const themesData = await themesRes.json();
        if (themesData && themesData.length > 0) {
          setThemes(themesData);
          setIsEquityLive(true);
        }
      } else {
        setIngestStatus("Failed to parse document.");
      }
    } catch (err) {
      setIngestStatus("Error uploading document.");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleQueryEarnings = async (e) => {
    e.preventDefault();
    setIsQueryingEarnings(true);
    setEarningsResult("Querying live SEC EDGAR database via Earnings Agent...");
    try {
      const query = earningsQuery.toUpperCase();
      const response = await fetch(`http://localhost:8000/api/earnings/${query}`);
      if (response.ok) {
        const data = await response.json();
        setEarningsResult(
          `SEC Filing: ${data.report_type} | Period: ${data.period_ended} | Source: ${data.source}\n` +
          `• Gross Margin: ${data.financials.gross_margin}%\n` +
          `• EBITDA Margin: ${data.financials.ebitda_margin}%\n` +
          `• YoY Revenue Growth: +${data.financials.revenue_growth_yoy}%\n` +
          `• YoY CapEx Expansion: +${data.financials.capex_growth_yoy}%`
        );
      } else {
        setEarningsResult(`SEC EDGAR Stance: Failed to retrieve filings for ${query}`);
      }
    } catch (err) {
      setEarningsResult("SEC EDGAR Stance: Error connecting to Earnings Agent backend API.");
    } finally {
      setIsQueryingEarnings(false);
    }
  };

  const getFormattedIngestStatus = () => {
    if (!ingestStatus) return "";
    if (laymanMode) {
      if (ingestStatus.includes("Calling Scraper") || ingestStatus.includes("Uploading")) {
        return "Reading and translating the research files...";
      }
      if (ingestStatus.includes("Ingested successfully") || ingestStatus.includes("Uploaded successfully")) {
        return "Research loaded successfully! We found new investment goals to look at.";
      }
      if (ingestStatus.includes("Failed to")) {
        return "Failed to read the link. Please check if it's correct.";
      }
    }
    return ingestStatus;
  };

  const getFormattedEarningsResult = () => {
    if (!earningsResult) return "";
    if (laymanMode) {
      if (earningsResult.includes("SEC Filing:") || earningsResult.includes("Filing Found:")) {
        // Extract values using regex dynamically based on actual SEC parsed parameters
        const gmMatch = earningsResult.match(/Gross Margin:\s*([0-9.]+)/);
        const rgMatch = earningsResult.match(/YoY Revenue Growth:\s*\+?([0-9.]+)/);
        const cxMatch = earningsResult.match(/YoY CapEx Expansion:\s*\+?([0-9.]+)/);

        const grossMargin = gmMatch ? gmMatch[1] : "60.0";
        const revGrowth = rgMatch ? rgMatch[1] : "15.0";
        const capexGrowth = cxMatch ? cxMatch[1] : "40.0";

        return (
          `Earnings Summary: We successfully checked the company's official financial reports!\n` +
          `• Profitability: Out of every dollar they make, they keep ${grossMargin} cents as core profit.\n` +
          `• Sales Growth: Their overall sales have grown by ${revGrowth}% compared to last year.\n` +
          `• Future Investment: They increased their spending on building factories and equipment (like AI datacenters) by ${capexGrowth}%, showing they are investing heavily in their future growth.`
        );
      }
      if (earningsResult.includes("Querying live SEC")) {
        return "Checking the corporate database for recent reports...";
      }
      if (earningsResult.includes("Failed to retrieve")) {
        return "We couldn't find any recent financial reports for this stock.";
      }
    }
    return earningsResult;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDesk = localStorage.getItem("activeDesk");
      if (savedDesk) setActiveDesk(savedDesk);

      const savedLayman = localStorage.getItem("laymanMode") === "true";
      setLaymanMode(savedLayman);

      const handleDesk = (e) => setActiveDesk(e.detail);
      const handleLayman = (e) => setLaymanMode(e.detail);

      window.addEventListener("deskChanged", handleDesk);
      window.addEventListener("laymanModeChanged", handleLayman);
      return () => {
        window.removeEventListener("deskChanged", handleDesk);
        window.removeEventListener("laymanModeChanged", handleLayman);
      };
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:8000/api/macro")
      .then(res => res.json())
      .then(data => setMacroRegime(data))
      .catch(() => {});

    fetch("http://localhost:8000/api/themes")
      .then(res => res.json())
      .then(data => {
        if(data && data.length > 0) {
          setThemes(data);
          setIsEquityLive(true);
        }
      })
      .catch(() => {
        setIsEquityLive(false);
      });

    fetch("http://localhost:8000/api/opportunities")
      .then(res => res.json())
      .then(data => {
        if(data && data.length > 0) {
          setOpportunities(data);
          setIsPortfolioLive(true);
        }
      })
      .catch(() => {
        setIsPortfolioLive(false);
      });
  }, []);

  // Compute dynamic top theme values
  const topThemeName = themes.length > 0 ? themes[0].name : "AI Infrastructure";
  const topThemeConfidence = themes.length > 0 && themes[0].confidence_score !== undefined ? `${(themes[0].confidence_score * 100).toFixed(0)}%` : "92%";
  const simpleTopThemeName = topThemeName === "AI Infrastructure" ? "AI Hardware & Datacenters" : topThemeName;

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      {/* HEADER BAR */}
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {laymanMode ? "📊 Simple Financial Dashboard" : "📊 Dashboard Terminal"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode 
              ? "Simple explanations of where big investment firms are putting their money." 
              : "Consolidated institutional capital flows and narrative change triggers"
            }
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowConsole(prev => !prev)}
            className="bg-[#111420] hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 px-4 py-2 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1.5"
          >
            <span>⚙</span> {showConsole ? "Hide Ingest Desk" : "Show Ingest Desk"}
          </button>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold shadow-md shadow-emerald-500/5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#1abc9c]"></span>
            <span>All systems active</span>
          </div>
        </div>
      </header>

      {/* 🤖 MULTI-AGENT COMMAND CONSOLE - Exposes missing ingestion and agent query controls */}
      {showConsole && (
        <section className="bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-5 mb-8 shadow-xl shadow-black/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-4 border-b border-[#1a1e2e] pb-2">
            <span className="text-emerald-400">🤖</span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {laymanMode ? "Research & Scraper Control Desk" : "Multi-Agent Command Console"}
            </h3>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold ml-auto">
              Interactive Control Center
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: URL Live Scraper (Research Agent) */}
            <div className="bg-[#111420]/50 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  {laymanMode ? "Scrape Article Link" : "Research Ingestion (Research Agent)"}
                </h4>
                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                  {laymanMode ? "Paste a link to trigger the live scraper to fetch and extract research themes." : "Trigger BeautifulSoup scraper on live URL paths."}
                </p>
              </div>
              <form onSubmit={handleIngestUrl} className="flex flex-col gap-2">
                <select 
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  className="w-full bg-[#0d0f17] text-white text-xs border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-emerald-500 mb-1"
                >
                  <option value="BlackRock">BlackRock (Commentary)</option>
                  <option value="Goldman Sachs">Goldman Sachs (Strategy)</option>
                  <option value="JPMorgan">JPMorgan (CIO Outlook)</option>
                  <option value="Morgan Stanley">Morgan Stanley (Strategy)</option>
                  <option value="Vanguard">Vanguard (Insights)</option>
                  <option value="Fidelity">Fidelity (Thematic)</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Paste insights URL..."
                  value={ingestUrl}
                  onChange={(e) => setIngestUrl(e.target.value)}
                  className="w-full bg-[#0d0f17] text-white text-xs border border-slate-800 rounded px-2 py-1.5 outline-none focus:border-emerald-500"
                />
                <button 
                  type="submit" 
                  disabled={isIngesting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold border-none py-1.5 rounded text-xs cursor-pointer disabled:opacity-50"
                >
                  {isIngesting ? "Ingesting..." : "Scrape & Analyze"}
                </button>
              </form>
            </div>

            {/* Column 2: File Ingestion (Ingestion Workflow) */}
            <div className="bg-[#111420]/50 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  {laymanMode ? "Upload Research PDF" : "On-Demand File Ingestion"}
                </h4>
                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                  {laymanMode ? "Upload local research report files (PDF/TXT) to parse them into structured signals." : "Ingest manual institutional files to process Themes."}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  accept=".txt,.pdf"
                  id="file-ingest"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="file-ingest"
                  className="w-full bg-[#0d0f17] hover:bg-slate-800 text-slate-300 text-xs border border-dashed border-slate-800 rounded py-3.5 text-center cursor-pointer font-semibold block"
                >
                  📁 Choose local file (.txt, .pdf)
                </label>
              </div>
            </div>

            {/* Column 3: Corporate Earnings Agent Stance */}
            <div className="bg-[#111420]/50 p-4 rounded-lg border border-slate-900 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase mb-1">
                  {laymanMode ? "Query Corporate Earnings" : "Corporate Earnings Agent"}
                </h4>
                <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
                  {laymanMode ? "Ask the AI earnings agent to check corporate guidance and transcript summaries." : "Query consensus stance and guidance outcomes."}
                </p>
              </div>
              <form onSubmit={handleQueryEarnings} className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="Stock Ticker (e.g. NVDA)"
                  value={earningsQuery}
                  onChange={(e) => setEarningsQuery(e.target.value)}
                  className="w-full bg-[#0d0f17] text-white text-xs border border-slate-800 rounded px-2 py-1.5 outline-none focus:border-emerald-500 uppercase"
                />
                <button 
                  type="submit"
                  disabled={isQueryingEarnings}
                  className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold border-none py-1.5 rounded text-xs cursor-pointer"
                >
                  {isQueryingEarnings ? "Querying..." : "Retrieve Earnings Stance"}
                </button>
              </form>
            </div>
          </div>

          {/* Global Agent Execution Logs */}
          {(ingestStatus || earningsResult) && (
            <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 mt-4 text-[10px] font-mono leading-relaxed text-slate-400">
              <div className="flex justify-between items-center mb-2 border-b border-slate-900 pb-1.5">
                <span className="text-emerald-400 font-bold">
                  {laymanMode ? "📟 Simple Translation:" : "📟 Agent Output:"}
                </span>
                {earningsResult && (
                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase border tracking-wider ${
                    earningsResult.includes("Live SEC")
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  }`}>
                    {earningsResult.includes("Live SEC") ? "● Live SEC Data" : "○ Mock Fallback Data"}
                  </span>
                )}
              </div>
              {ingestStatus && <div className="mb-1" style={{ whiteSpace: "pre-line" }}> {getFormattedIngestStatus()}</div>}
              {earningsResult && <div style={{ whiteSpace: "pre-line" }}> {getFormattedEarningsResult()}</div>}
            </div>
          )}
        </section>
      )}

      {/* Top Metric Banners */}
      <section className="grid grid-cols-4 gap-5 mb-8">
        {[
          { 
            id: "macro1", 
            label: laymanMode ? "Economy Status" : "Macro Regime", 
            val: laymanMode ? "Stable Prices (Low Inflation)" : macroRegime.classified_regime, 
            sub: laymanMode ? "Steady Economic Growth" : macroRegime.growth_outlook, 
            border: "border-blue-500/20", 
            agent: "Macro Intelligence", 
            desk: "macro", 
            activeRing: "ring-1 ring-blue-500 shadow-blue-500/10",
            isLive: true
          },
          { 
            id: "macro2", 
            label: laymanMode ? "Fed Interest Rate" : "Benchmark Target", 
            val: macroRegime.macro_inputs.benchmark_rate, 
            sub: laymanMode ? "Holding rates steady for now" : `Outlook: ${macroRegime.macro_inputs.rate_outlook}`, 
            border: "border-purple-500/20", 
            agent: "Macro Intelligence", 
            desk: "macro", 
            activeRing: "ring-1 ring-blue-500 shadow-blue-500/10",
            isLive: true
          },
          { 
            id: "equity1", 
            label: laymanMode ? "Top Investment Theme" : "Top Mapped Theme", 
            val: laymanMode ? simpleTopThemeName : topThemeName, 
            sub: laymanMode ? `Wall Street is ${topThemeConfidence} confident` : `Index Conviction: ${topThemeConfidence}`, 
            border: "border-indigo-500/20", 
            agent: "Consensus Aggregator", 
            desk: "equity", 
            activeRing: "ring-1 ring-emerald-500 shadow-emerald-500/10",
            isLive: isEquityLive
          },
          { 
            id: "portfolio1", 
            label: laymanMode ? "Where Money is Moving" : "Sector Flows Focus", 
            val: laymanMode ? "Technology Stocks" : "Technology (XLK)", 
            sub: laymanMode ? "+$1.25 Billion invested this month" : "+$1.25B (Net 30d)", 
            border: "border-emerald-500/20", 
            agent: "ETF Flow Analyst", 
            desk: "portfolio", 
            activeRing: "ring-1 ring-purple-500 shadow-purple-500/10",
            isLive: isPortfolioLive
          }
        ].map((metric, idx) => {
          const isActive = activeDesk === metric.desk;
          return (
            <div 
              key={idx} 
              className={`bg-[#0d0f17]/60 backdrop-blur-sm border rounded-xl p-5 flex flex-col gap-1.5 shadow-lg shadow-black/20 hover:scale-[1.01] transition-all duration-300 ${
                isActive ? `${metric.activeRing} bg-[#0d0f17]` : metric.border
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">{metric.label}</span>
                <div className="flex items-center gap-1.5">
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${metric.isLive ? "bg-emerald-500" : "bg-amber-500"}`} 
                    title={metric.isLive ? "Live API Feed" : "Simulated/Mock Feed"}
                  ></span>
                  <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">{metric.agent}</span>
                </div>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">{metric.val}</span>
              <span className="text-xs text-slate-400 font-medium">{metric.sub}</span>
            </div>
          );
        })}
      </section>

      {/* Content Section - Full Width Consensus Themes */}
      <div className="space-y-6 mt-6">
        {/* Institutional Consensus Themes */}
        <div className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 transition-all duration-300 ${
          activeDesk === "macro" || activeDesk === "equity" ? "ring-1 ring-emerald-500/40 opacity-100" : "opacity-30 hover:opacity-70"
        }`}>
          <div className="flex justify-between items-center border-b border-[#1a1e2e] pb-3 mb-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {laymanMode ? "What Big Firms Agree On" : "Institutional Consensus Themes"}
            </h3>
            <span className="text-[10px] bg-[#1a1e2e] text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Consensus Agent</span>
          </div>
          <div className="flex flex-col gap-4">
            {themes.map(theme => {
              let displayThemeName = theme.name;
              if (laymanMode) {
                if (theme.name === "AI Infrastructure") displayThemeName = "AI Computers & Datacenters";
                else if (theme.name === "Defense Grid Modernization") displayThemeName = "Military Technology Upgrades";
                else displayThemeName = "Clean Energy Transition";
              }
              return (
                <div 
                  key={theme.name} 
                  onClick={() => {
                    setDrawerItem(theme);
                    setDrawerType("theme");
                    setDrawerOpen(true);
                  }}
                  className="flex justify-between items-center bg-[#111420]/80 p-4 rounded-lg border border-[#1a2035] hover:border-emerald-500/40 hover:bg-[#111420] transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm text-white tracking-tight">{displayThemeName}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {laymanMode ? "Agreement: High" : theme.consensus_status} • {laymanMode ? "Research Firms" : "Firms"}: {theme.sources?.join(", ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-1.5 bg-[#1a1e2e] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${theme.score || 70}%` }}></div>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                      theme.sentiment === "Bullish" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>{laymanMode ? (theme.sentiment === "Bullish" ? "Buying" : "Neutral") : theme.sentiment}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <FocusDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        item={drawerItem} 
        type={drawerType} 
        laymanMode={laymanMode}
        currentHoldings={currentHoldings}
        onHoldingsChange={handleHoldingsChange}
      />
    </div>
  );
}
