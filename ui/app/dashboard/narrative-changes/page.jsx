"use client";
import React, { useState, useEffect } from "react";

export default function NarrativeChanges() {
  const [narratives, setNarratives] = useState([
    {
      date: "2026-07-28",
      source: "BlackRock CIO Weekly",
      theme: "AI Infrastructure",
      old_stance: "Overweight Technology",
      new_stance: "Strong Overweight Utilities / Power Grid",
      shift_velocity: "Fast",
      reasoning: "Generative AI compute builds outpace power grid supplies. Handlers shift capital to utilities and grid distributors.",
      severity: "High",
      severityColor: "text-rose-400 bg-rose-500/10 border-rose-500/20"
    },
    {
      date: "2026-07-26",
      source: "Goldman Sachs Strategy Note",
      theme: "Defense Grid Modernization",
      old_stance: "Neutral Defense",
      new_stance: "Overweight Defense Technology",
      shift_velocity: "Moderate",
      reasoning: "European modernization budgets accelerating faster than market consensus pricing.",
      severity: "Medium",
      severityColor: "text-amber-400 bg-amber-500/10 border-amber-500/20"
    },
    {
      date: "2026-07-15",
      source: "J.P. Morgan Global Outlook",
      theme: "Consumer Retail Margins",
      old_stance: "Overweight Retail",
      new_stance: "Neutral Retail",
      shift_velocity: "Slow",
      reasoning: "Sticky inflation pressures consumer spending power, compressing mid-tier retail operating margins.",
      severity: "Low",
      severityColor: "text-slate-400 bg-slate-500/10 border-slate-500/20"
    }
  ]);

  const [activeDesk, setActiveDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [selectedSeverityDetail, setSelectedSeverityDetail] = useState(null);
  const [isScraping, setIsScraping] = useState(false);

  const translateText = (text) => {
    if (!laymanMode || !text) return text;
    let t = text;
    // Common stances
    t = t.replace(/Strong Overweight/gi, "Strong Buy");
    t = t.replace(/Overweight/gi, "Buy Stance");
    t = t.replace(/Underweight/gi, "Sell Stance");
    t = t.replace(/Neutral/gi, "Hold Stance");
    // Common rationale terms
    t = t.replace(/capital flows/gi, "money transfers");
    t = t.replace(/earnings visibility/gi, "proof of future profits");
    t = t.replace(/datacenter builds/gi, "computer warehouses");
    t = t.replace(/multiple expansions/gi, "over-expensive stock pricing");
    t = t.replace(/supply chain localization/gi, "making products locally");
    t = t.replace(/secular tailwinds/gi, "long-term positive trends");
    t = t.replace(/labor productivity/gi, "saving work costs");
    return t;
  };
  const [narrativeShifts, setNarrativeShifts] = useState([
    { date: "2026-07-28", event: "BlackRock upgraded technology stance to strong overweight.", type: "Upgrade", velocity: "Fast", badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
    { date: "2026-07-26", event: "Goldman Sachs raised caution flag on utilities multiple expansions.", type: "Neutral", velocity: "Moderate", badgeBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20" }
  ]);

  const fetchNarratives = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/narratives");
      if (response.ok) {
        const data = await response.json();
        setNarratives(data);
        
        const shifts = data.map(item => ({
          date: item.date,
          event: `${item.source} shifted theme "${item.theme}" to ${item.new_stance}.`,
          type: item.new_stance.includes("Sell") || item.new_stance.includes("Neutral") ? "Neutral" : "Upgrade",
          velocity: item.shift_velocity,
          badgeBg: item.new_stance.includes("Sell") || item.new_stance.includes("Neutral")
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }));
        setNarrativeShifts(shifts);
      }

      // Check if background weekly research ingestion is currently running on boot
      const schedulerRes = await fetch("http://localhost:8000/api/schedulers");
      if (schedulerRes.ok) {
        const schedulers = await schedulerRes.json();
        const weekly = schedulers.find(s => s.name === "Weekly Research Ingestion Scheduler");
        if (weekly && weekly.status === "Running") {
          setIsScraping(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch live narratives:", err);
    }
  };

  useEffect(() => {
    fetchNarratives();

    // Establish WebSocket listener for real-time background scraper feeds
    const ws = new WebSocket("ws://localhost:8000/ws/alerts");
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "NARRATIVE_CHANGE") {
          const item = payload.data;
          
          setNarratives(prev => {
            // Local de-duplication check
            const exists = prev.some(n => n.source === item.source && n.theme === item.theme && n.date === item.date);
            if (exists) return prev;
            return [item, ...prev];
          });

          setNarrativeShifts(prev => {
            const shiftEvent = {
              date: item.date,
              event: `${item.source} shifted theme "${item.theme}" to ${item.new_stance}.`,
              type: item.new_stance.includes("Sell") || item.new_stance.includes("Neutral") ? "Neutral" : "Upgrade",
              velocity: item.shift_velocity,
              badgeBg: item.new_stance.includes("Sell") || item.new_stance.includes("Neutral")
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            };
            return [shiftEvent, ...prev];
          });
        } else if (payload.type === "SCHEDULER_TRIGGERED" && payload.scheduler === "Weekly Research Ingestion Scheduler") {
          setIsScraping(true);
        } else if (payload.type === "SCHEDULER_COMPLETED" && payload.scheduler === "Weekly Research Ingestion Scheduler") {
          setIsScraping(false);
        }
      } catch (err) {
        console.error("Error processing real-time narrative WebSocket broadcast:", err);
      }
    };

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
        ws.close();
        window.removeEventListener("deskChanged", handleDesk);
        window.removeEventListener("laymanModeChanged", handleLayman);
      };
    }
  }, []);

  const filteredNarratives = narratives.filter(item => {
    if (activeDesk === "equity") {
      // Equity desk focuses on company themes (e.g. tech, retail, defense) and filters out broad macro rate indicators
      return !item.theme.toLowerCase().includes("benchmark") && !item.theme.toLowerCase().includes("funds rate");
    }
    if (activeDesk === "portfolio") {
      // Portfolio desk aggregates all multi-sector assets
      return true;
    }
    if (activeDesk === "risk") {
      // Risk desk filters to show only high and medium severity inflection points
      return item.severity === "High" || item.severity === "Medium";
    }
    // Macro desk sees the full universe of macro narrative changes
    return true;
  });

  const severityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  const sortedNarratives = [...filteredNarratives].sort((a, b) => {
    const wA = severityWeight[a.severity.toLowerCase()] || 0;
    const wB = severityWeight[b.severity.toLowerCase()] || 0;
    if (wB !== wA) return wB - wA;
    // Keep newer dates first within the same severity level
    return new Date(b.date) - new Date(a.date);
  });

  // Dynamic theme colors for glowing active rings
  const ringColors = {
    macro: "ring-2 ring-blue-500/40",
    equity: "ring-2 ring-emerald-500/40",
    portfolio: "ring-2 ring-purple-500/40",
    risk: "ring-2 ring-rose-500/40"
  };
  const activeRing = ringColors[activeDesk] || "";

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {laymanMode ? "What Big Firms are Doing" : "Narrative Flows"}
            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              ● Live Narrative Feed
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode ? "Recent updates on where major investment firms are changing their stock stances." : "Timeline of institutional rating inflection points and consensus migrations"}
          </p>
        </div>
        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full font-bold shadow-md">
          Agent: Narrative Change Engine
        </span>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Timeline details (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {isScraping && (
            <div className="flex flex-col items-center justify-center p-8 bg-[#0d0f17]/50 border border-dashed border-sky-500/20 rounded-xl animate-pulse">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Scheduled Scraper Ingesting Strategy Commentary...</span>
              <span className="text-[10px] text-slate-500 mt-1 font-semibold">Running local LLM theme models for BlackRock, Vanguard, Goldman & Fidelity concurrently.</span>
            </div>
          )}
          {filteredNarratives.length === 0 && !isScraping && (
            <div className="p-8 text-center bg-[#0d0f17] border border-[#1a1e2e] rounded-xl text-slate-500 text-xs font-semibold">
              No live narrative shifts logged today. Trigger a scheduler or run ingestion to view shifts.
            </div>
          )}
          {sortedNarratives.map((item, idx) => {
            let displayTheme = item.theme;
            let displayOld = item.old_stance;
            let displayNew = item.new_stance;
            let displayVelocity = item.shift_velocity;
            let displayReasoning = item.reasoning;

            if (laymanMode) {
              if (item.theme === "AI Infrastructure") {
                displayTheme = "AI Datacenters & Utilities";
                displayOld = "Buy Tech Stocks";
                displayNew = "Strongly Buy Power Utilities";
                displayVelocity = "Very Fast";
                displayReasoning = "AI software needs way more electricity than grids can supply. Big firms are moving money to power grid companies.";
              } else if (item.theme === "Defense Grid Modernization") {
                displayTheme = "Military Tech Upgrades";
                displayOld = "Hold Defense Stocks";
                displayNew = "Buy Security Tech";
                displayVelocity = "Average";
                displayReasoning = "Governments in Europe are spending a lot more on security technology than normal people expect.";
              } else if (item.theme === "Consumer Retail Margins") {
                displayTheme = "Consumer Spending Power";
                displayOld = "Buy Retail Stores";
                displayNew = "Hold Retail Stocks";
                displayVelocity = "Slow";
                displayReasoning = "High everyday prices are hurting shoppers, making retail stores less profitable.";
              } else {
                displayTheme = translateText(item.theme);
                displayOld = translateText(item.old_stance);
                displayNew = translateText(item.new_stance);
                displayVelocity = item.shift_velocity === "Fast" ? "Very Fast" : (item.shift_velocity === "Moderate" ? "Medium Speed" : "Slow");
                displayReasoning = translateText(item.reasoning);
              }
            }

            return (
              <div key={idx} className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 hover:scale-[1.005] transition-all duration-300 ${activeRing}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold tracking-wider uppercase">{item.source} • {item.date}</span>
                      {item.frequency && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md">
                          ⏳ {item.frequency}
                        </span>
                      )}
                      {item.data_type && (
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          item.data_type === "Live"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        }`}>
                          {item.data_type === "Live" ? "🟢 Live Data" : "⚙️ Seeded Benchmark"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-1">{displayTheme}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      const sev = item.severity.toLowerCase();
                      if (sev === "high") {
                        setSelectedSeverityDetail({
                          title: "High Importance / Severity",
                          metric: "BlackRock & High Confidence Signals",
                          explanation: "Managing over $10 Trillion AUM, BlackRock's guidance shifts directly move market indices. Any theme extraction with confidence scores exceeding 90% is also classified as High Importance due to high AI alignment certainty."
                        });
                      } else if (sev === "medium") {
                        setSelectedSeverityDetail({
                          title: "Medium Importance / Severity",
                          metric: "Goldman Sachs & Average Signals",
                          explanation: "Goldman Sachs guides institutional sell-side broker consensus. While key for trading desks, it represents market-making opinion rather than direct multi-trillion dollar capital index deployments."
                        });
                      } else {
                        setSelectedSeverityDetail({
                          title: "Low Importance / Severity",
                          metric: "JPMorgan & Macro Retail Noise",
                          explanation: "JPMorgan CIO outlooks focus on broad consumer banking flows. These have a slower transmission velocity to high-tech equity sectors and represent broader, slow-moving economic signals."
                        });
                      }
                    }}
                    className={`text-[10px] font-bold px-3 py-1 rounded-full border ${item.severityColor} cursor-pointer hover:scale-[1.03] hover:bg-slate-800 transition-all bg-transparent outline-none flex items-center gap-1`}
                    title="Click to view strategic market impact details"
                  >
                    {item.severity} Importance ℹ️
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6 bg-[#111420]/80 p-4 rounded-lg border border-[#1a2035] mb-4">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                      {laymanMode ? "Old Opinion" : "Previous Stance"}
                    </span>
                    <p className="text-sm font-semibold text-slate-400 mt-1">{displayOld}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                      {laymanMode ? "New Opinion" : "New Stance"}
                    </span>
                    <p className="text-sm font-semibold text-emerald-400 mt-1">{displayNew}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                      {laymanMode ? "Speed of Shift" : "Shift Velocity"}
                    </span>
                    <p className="text-sm font-semibold text-blue-400 mt-1">{displayVelocity}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                    {laymanMode ? "Why They Changed Their Minds" : "Shift Rationale"}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium mt-1">{displayReasoning}</p>
                </div>

                {item.data_type === "Seeded" && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <span className="text-xs">⚠️</span>
                    <span className="text-[10px] font-bold text-amber-300/90 tracking-wide uppercase">
                      Seeded Benchmark: The scheduled scraping routine has not run yet.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Narrative Shifts Logs Feed (col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20">
            <div className="flex justify-between items-center border-b border-[#1a1e2e] pb-3 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {laymanMode ? "Recent Narrative Shifts" : "Narrative Change Timelines"}
              </h3>
              <span className="text-[10px] bg-[#1a1e2e] text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Log Feed</span>
            </div>
            <div className="flex flex-col gap-4">
              {narrativeShifts.map((log, idx) => {
                let eventDesc = log.event;
                if (laymanMode) {
                  eventDesc = translateText(log.event);
                }
                return (
                  <div key={idx} className="border-l-2 border-[#1a1e2e] pl-4 relative">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${log.badgeBg}`}>
                        {laymanMode ? (log.type === "Upgrade" ? "Pos Alert" : "Neutral") : log.type}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">{log.date}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{eventDesc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Slide-out Drawer Menu */}
      {selectedSeverityDetail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedSeverityDetail(null)}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-[#0d0f17] border-l border-slate-900 h-full p-8 shadow-2xl flex flex-col justify-between z-10">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
                <h3 className="text-lg font-bold text-white tracking-tight">{selectedSeverityDetail.title}</h3>
                <button 
                  onClick={() => setSelectedSeverityDetail(null)}
                  className="bg-transparent border-none text-slate-500 hover:text-white text-lg cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Classification Source</span>
                  <p className="text-sm font-semibold text-emerald-400 mt-1">{selectedSeverityDetail.metric}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider block">Strategic Clarification</span>
                  <p className="text-sm text-slate-300 leading-relaxed font-medium mt-1.5">{selectedSeverityDetail.explanation}</p>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedSeverityDetail(null)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold py-2.5 rounded-lg text-xs cursor-pointer tracking-wider transition-all border-none"
            >
              Understand & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
