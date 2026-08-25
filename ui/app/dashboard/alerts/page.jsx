"use client";
import React, { useState, useEffect } from "react";

export default function AlertLogs() {
  const [alerts, setAlerts] = useState([
    {
      ticker: "NVDA",
      headline: "Nvidia faces new export caps on advanced H20 chips to Asia markets",
      source: "Bloomberg",
      type: "Regulatory Risk",
      severity: "High",
      badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      date: "2026-07-28 10:15 AM EST",
      status: "Triggered",
      impactScore: 88,
      explanation: "Trade restrictions affect high-margin AI product segments directly."
    },
    {
      ticker: "VRT",
      headline: "Vertiv guidance upgraded following Q2 cooling backlogs",
      source: "SEC 10-Q",
      type: "Earnings Catalyst",
      severity: "Medium",
      badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      date: "2026-07-29 08:30 AM EST",
      status: "Triggered",
      impactScore: 74,
      explanation: "Strong backlog growth guarantees hardware shipment revenue for next 3 quarters."
    },
    {
      ticker: "AVGO",
      headline: "Broadcom CEO announces new datacenter custom ASIC collaboration",
      source: "Reuters",
      type: "Corporate Expansion",
      severity: "Medium",
      badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      date: "2026-07-25 04:00 PM EST",
      status: "Acknowledged",
      impactScore: 68,
      explanation: "Diversifies ASIC business lines but requires 18 months research lead time."
    }
  ]);
  
  const [activeDesk, setActiveDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const [catalystAlerts, setCatalystAlerts] = useState([
    { ticker: "NVDA", headline: "Nvidia faces new export caps on advanced H20 chips", source: "Bloomberg", type: "Regulatory Risk", severity: "High", badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    { ticker: "VRT", headline: "Vertiv guidance upgraded following Q2 cooling backlogs", source: "SEC 10-Q", type: "Earnings Catalyst", severity: "Medium", badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" }
  ]);

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
    const ws = new WebSocket("ws://localhost:8000/ws/alerts");

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "NARRATIVE_CHANGE") {
          console.log("Real-time narrative shift received:", message.data);
          
          const newAlert = {
            ticker: message.data.theme.includes("AI") ? "NVDA" : "VRT",
            headline: `Narrative Shift: ${message.data.reasoning}`,
            source: message.data.source,
            type: "Fundamental Shift",
            severity: message.data.severity,
            badgeBg: message.data.severity === "High" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20",
            date: message.data.date + " Live",
            status: "Triggered",
            impactScore: message.data.severity === "High" ? 92 : 78,
            explanation: "Dynamic shift caught via real-time research scraper cascade."
          };
          
          setAlerts(prev => [newAlert, ...prev]);
        }
      } catch (err) {
        console.error("Error parsing real-time websocket message on alerts page:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Websocket connection error on alerts page:", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (activeDesk === "macro") {
      return alert.type === "Regulatory Risk";
    }
    if (activeDesk === "portfolio" || activeDesk === "equity") {
      return alert.type === "Earnings Catalyst" || alert.type === "Corporate Expansion" || alert.type === "Fundamental Shift";
    }
    return true;
  });

  const filteredCatalysts = catalystAlerts.filter(alert => {
    if (activeDesk === "macro") {
      return alert.type === "Regulatory Risk";
    }
    if (activeDesk === "portfolio" || activeDesk === "equity") {
      return alert.type === "Earnings Catalyst" || alert.type === "Corporate Expansion";
    }
    return true;
  });

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {laymanMode ? "Important Stock Warnings" : "System Alert Logs"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode ? "Instant updates on sales reports, rules, and potential threats to our stocks." : "Real-time threat detection and fundamental catalysts feed"}
          </p>
        </div>
        <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-full font-bold shadow-md">
          Agent: Alert Routing Agent
        </span>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: System Alert Logs (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {filteredAlerts.map((alert, idx) => {
            let displayType = alert.type;
            let displayHeadline = alert.headline;

            if (laymanMode) {
              if (alert.type === "Regulatory Risk") {
                displayType = "Government Rule Risk";
                displayHeadline = "Nvidia is blocked from selling high-tech AI chips to China due to government security rules. (Possible sales threat)";
              } else if (alert.type === "Earnings Catalyst") {
                displayType = "Good Sales News";
                displayHeadline = "Vertiv makes record sales because datacenters desperately need their cooling fans to keep AI computers from melting.";
              } else if (alert.type === "Corporate Expansion") {
                displayType = "Company Growth Plan";
                displayHeadline = "Broadcom signs a major deal to design custom computer brain chips for a giant tech client.";
              } else {
                displayType = "Analyst Stance Change";
                displayHeadline = alert.headline;
              }
            }

            return (
              <div key={idx} className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-5 flex flex-col gap-4 shadow-lg shadow-black/20 hover:border-[#22c55e]/30 transition-all duration-300 ${
                activeDesk === "risk" ? "ring-2 ring-rose-500/40" : ""
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-white tracking-tight bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                      {alert.ticker}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${alert.badgeBg}`}>
                      {displayType}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold">{alert.date}</span>
                </div>

                {laymanMode && (
                  <div className={`text-[10px] font-extrabold px-3 py-2 rounded-lg border flex items-center gap-1.5 tracking-wide uppercase ${
                    alert.type === "Regulatory Risk" 
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    {alert.type === "Regulatory Risk" 
                      ? "🔴 Threat (Negative News - Consider Selling/Holding to Avoid Loss)" 
                      : "🟢 Opportunity (Positive News - Consider Buying to Grow Value)"
                    }
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm text-slate-200 font-semibold leading-relaxed">
                    {displayHeadline}
                  </p>
                  {!laymanMode && (
                    <p className="text-xs text-slate-500 italic">
                      Note: {alert.explanation}
                    </p>
                  )}
                </div>

                {/* Scannability Upgrade: Visual Progress Bar representing Impact Score */}
                <div className="border-t border-[#1a1e2e]/50 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase flex items-center gap-1">
                      {laymanMode ? "Threat Level / Importance Score:" : "Estimated Impact Score:"}
                      
                      {/* Interactive Tooltip Icon */}
                      <span 
                        onMouseEnter={() => setHoveredTooltip(idx)}
                        onMouseLeave={() => setHoveredTooltip(null)}
                        className="cursor-help w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[9px] font-extrabold"
                      >
                        ?
                      </span>
                      {hoveredTooltip === idx && (
                        <span className="absolute bg-[#111420] border border-slate-800 p-2.5 rounded shadow-lg text-[10px] text-slate-300 lowercase normal-case max-w-xs z-50 mt-12">
                          {laymanMode 
                            ? "an estimate of how much this news will change our stock value (0 to 100)." 
                            : "calculated score modeling volatility impact on institutional allocations."
                          }
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-white font-extrabold">{alert.impactScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        alert.impactScore > 80 ? "bg-rose-500" : alert.impactScore > 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`} 
                      style={{ width: `${alert.impactScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <span>Source: <strong className="text-slate-400">{alert.source}</strong></span>
                  <span className="flex items-center gap-1.5">
                    {alert.status === "Triggered" && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    )}
                    Status: <strong className={alert.status === "Triggered" ? "text-rose-400" : "text-blue-400"}>{alert.status}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Catalyst Alerts Feed (col-span-2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 transition-all duration-300 ${
            activeDesk === "risk" ? "ring-1 ring-rose-500/40 opacity-100" : "opacity-35 hover:opacity-100"
          }`}>
            <div className="flex justify-between items-center border-b border-[#1a1e2e] pb-3 mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {laymanMode ? "Important Stock Warnings" : "Catalyst Alert Feed"}
              </h3>
              <span className="text-[10px] bg-[#1a1e2e] text-slate-400 px-2 py-0.5 rounded font-bold uppercase">News Agent</span>
            </div>
            <div className="flex flex-col gap-4">
              {filteredCatalysts.map((alert, idx) => {
                let alertMsg = alert.headline;
                if (laymanMode) {
                  if (alert.headline.includes("export caps")) {
                    alertMsg = "Nvidia is blocked from selling high-tech AI chips to China due to government security rules. (Possible sales threat)";
                  } else {
                    alertMsg = "Vertiv makes record sales because datacenters desperately need their cooling fans to keep AI computers from melting.";
                  }
                }
                return (
                  <div key={idx} className="p-4 rounded-lg bg-[#111420]/80 border border-[#1a2035] flex flex-col gap-1 hover:border-blue-500/20 transition-all duration-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-blue-400">{alert.ticker}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${alert.badgeBg}`}>
                        {laymanMode ? (alert.type === "Regulatory Risk" ? "Govt Rule Risk" : "Good Sales News") : alert.type}
                      </span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-semibold mt-1">{alertMsg}</p>
                    <span className="text-[9px] text-slate-500 mt-1">Source: {alert.source}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
