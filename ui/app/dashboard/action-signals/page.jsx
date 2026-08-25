"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ActionSignals() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [laymanMode, setLaymanMode] = useState(false);
  const [activeDesk, setActiveDesk] = useState("equity");
  const [horizon, setHorizon] = useState("short"); // "short", "medium", "long"

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

  const fetchOpportunities = async (targetHorizon = horizon) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/opportunities?horizon=${targetHorizon}`);
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
      // Robust local mock fallback if API is offline
      setOpportunities([
        { ticker: "NVDA", company_name: "Nvidia Corp", exposure_logic: "Makes key computer chips for AI but faces heavy threats from government China sale bans.", conviction_score: 45.0, action_recommendation: "Underperform", asset_class: "Equity" },
        { ticker: "VRT", company_name: "Vertiv Holdings", exposure_logic: "AI servers get extremely hot; this company keeps them from melting.", conviction_score: 88.0, action_recommendation: "Buy", asset_class: "Equity" },
        { ticker: "ANET", company_name: "Arista Networks", exposure_logic: "Designs high-speed computer network connectors for AI warehouses.", conviction_score: 86.4, action_recommendation: "Buy", asset_class: "Equity" },
        { ticker: "TSLA", company_name: "Tesla Inc", exposure_logic: "Autonomous driving software and humanoid robotics training grids.", conviction_score: 76.4, action_recommendation: "Hold", asset_class: "Equity" },
        { ticker: "BOTZ", company_name: "Global X Robotics & AI ETF", exposure_logic: "Broad global exposure to industrial automation and machine learning.", conviction_score: 79.5, action_recommendation: "Hold", asset_class: "ETF" },
        { ticker: "ITA", company_name: "iShares U.S. Aerospace & Defense ETF", exposure_logic: "Broad aerospace and security prime contractors basket.", conviction_score: 84.5, action_recommendation: "Underperform", asset_class: "ETF" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities(horizon);
  }, [horizon]);

  // Filter based on active desk view
  const filteredOpps = opportunities.filter(opp => {
    if (activeDesk === "equity") {
      return opp.asset_class === "Equity" || opp.asset_class === "Mutual Fund";
    }
    if (activeDesk === "portfolio") {
      return opp.asset_class === "ETF" || opp.asset_class === "Mutual Fund";
    }
    if (activeDesk === "macro") {
      return opp.asset_class === "ETF" || opp.ticker === "XLU" || opp.ticker === "ETN" || opp.ticker === "GE";
    }
    return true; // Risk shows all
  });

  // Group opportunities into Buy, Hold, and Avoid/Sell
  const buyList = filteredOpps.filter(o => o.action_recommendation === "Strong Buy" || o.action_recommendation === "Buy");
  const holdList = filteredOpps.filter(o => o.action_recommendation === "Hold");
  const avoidList = filteredOpps.filter(o => o.action_recommendation === "Underperform" || o.action_recommendation === "Sell");

  const handleCardClick = (opp) => {
    localStorage.setItem("selectedMemoTicker", opp.ticker);
    localStorage.setItem("selectedMemoType", "stock");
    router.push("/dashboard/memos");
  };

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {laymanMode ? "🎯 Buy / Sell / Hold Guide" : "🎯 Action Signals Dashboard"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode 
              ? "Simple green, yellow, and red lists showing exactly what to do with each stock." 
              : "Grouped thematic allocations classified by institutional buy, hold, and sell stances."
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#0d0f17] border border-[#1a1e2e] p-1.5 rounded-xl">
          <button 
            onClick={() => setHorizon("short")}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              horizon === "short" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            {laymanMode ? "30 Days (Short)" : "30-Day Outlook"}
          </button>
          <button 
            onClick={() => setHorizon("medium")}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              horizon === "medium" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            {laymanMode ? "6 Months (Medium)" : "6-Month Outlook"}
          </button>
          <button 
            onClick={() => setHorizon("long")}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              horizon === "long" ? "bg-emerald-500 text-slate-950 font-black shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            {laymanMode ? "1 Year (Long)" : "1-Year Outlook"}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold">Sorting Action Stances...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* COLUMN 1: BUY LIST */}
          <div className="flex flex-col gap-5 bg-[#0d0f17]/40 border border-[#1a1e2e] rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-emerald-500/20 pb-3">
              <h3 className="text-sm font-black text-emerald-400 tracking-wider flex items-center gap-2 uppercase">
                🟢 {laymanMode ? "Buy (Green Light)" : "Buy Stance"}
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded font-extrabold">
                {buyList.length} Items
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-[-5px]">
              {laymanMode ? "Stocks with strong growth support from large investment firms." : "Securities with momentum and high institutional alignment."}
            </p>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1.5">
              {buyList.map(opp => (
                <div 
                  key={opp.ticker}
                  onClick={() => handleCardClick(opp)}
                  className="bg-[#0d0f17] border border-[#1a1e2e] hover:border-emerald-500/30 p-4 rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-extrabold text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {opp.ticker}
                      </span>
                      <span className="text-xs text-slate-400 block mt-2 font-bold">{opp.company_name}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-extrabold">
                      {laymanMode ? "Safety:" : "Score:"} {opp.conviction_score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2 line-clamp-2">
                    {opp.exposure_logic || opp.logic}
                  </p>
                </div>
              ))}
              {buyList.length === 0 && (
                <span className="text-xs text-slate-500 italic py-4 text-center block">No buy targets found in this desk view.</span>
              )}
            </div>
          </div>

          {/* COLUMN 2: HOLD LIST */}
          <div className="flex flex-col gap-5 bg-[#0d0f17]/40 border border-[#1a1e2e] rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-amber-500/20 pb-3">
              <h3 className="text-sm font-black text-amber-400 tracking-wider flex items-center gap-2 uppercase">
                🟡 {laymanMode ? "Hold (Yellow Light)" : "Hold Stance"}
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded font-extrabold">
                {holdList.length} Items
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-[-5px]">
              {laymanMode ? "Neutral stance. Sit tight, do not buy more, but no need to sell." : "Securities with neutral catalysts or rangebound technical resistance."}
            </p>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1.5">
              {holdList.map(opp => (
                <div 
                  key={opp.ticker}
                  onClick={() => handleCardClick(opp)}
                  className="bg-[#0d0f17] border border-[#1a1e2e] hover:border-amber-500/30 p-4 rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-extrabold text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {opp.ticker}
                      </span>
                      <span className="text-xs text-slate-400 block mt-2 font-bold">{opp.company_name}</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-extrabold">
                      {laymanMode ? "Safety:" : "Score:"} {opp.conviction_score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2 line-clamp-2">
                    {opp.exposure_logic || opp.logic}
                  </p>
                </div>
              ))}
              {holdList.length === 0 && (
                <span className="text-xs text-slate-500 italic py-4 text-center block">No hold targets found in this desk view.</span>
              )}
            </div>
          </div>

          {/* COLUMN 3: AVOID/SELL LIST */}
          <div className="flex flex-col gap-5 bg-[#0d0f17]/40 border border-[#1a1e2e] rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center border-b border-rose-500/20 pb-3">
              <h3 className="text-sm font-black text-rose-400 tracking-wider flex items-center gap-2 uppercase">
                🔴 {laymanMode ? "Avoid (Red Flag)" : "Underperform Stance"}
              </h3>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded font-extrabold">
                {avoidList.length} Items
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold mt-[-5px]">
              {laymanMode ? "Declining support or heavy institutional selling. Avoid or consider selling." : "Securities facing regulatory shifts, negative capital flows, or crowding risk."}
            </p>
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1.5">
              {avoidList.map(opp => (
                <div 
                  key={opp.ticker}
                  onClick={() => handleCardClick(opp)}
                  className="bg-[#0d0f17] border border-[#1a1e2e] hover:border-rose-500/30 p-4 rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:scale-[1.01]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-extrabold text-white bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                        {opp.ticker}
                      </span>
                      <span className="text-xs text-slate-400 block mt-2 font-bold">{opp.company_name}</span>
                    </div>
                    <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-extrabold">
                      {laymanMode ? "Safety:" : "Score:"} {opp.conviction_score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-2 line-clamp-2">
                    {opp.exposure_logic || opp.logic}
                  </p>
                </div>
              ))}
              {avoidList.length === 0 && (
                <span className="text-xs text-slate-500 italic py-4 text-center block text-slate-500/80">No sell targets found in this desk view.</span>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
