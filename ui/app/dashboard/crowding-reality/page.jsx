"use client";
import React, { useState, useEffect } from "react";

export default function CrowdingReality() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [laymanMode, setLaymanMode] = useState(false);
  const [activeDesk, setActiveDesk] = useState("equity");

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

  const fetchPositioning = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/positioning");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch positioning metrics:", err);
      setData([
        { ticker: "NVDA", crowding_score: 81.5, crowding_regime: "Crowded", short_interest_ratio: 1.2, options_call_skew_pct: 85.0, cftc_institutional_net_long: 78.0, action_warning: "High Crowding Risk" },
        { ticker: "VRT", crowding_score: 61.0, crowding_regime: "Neutral", short_interest_ratio: 3.4, options_call_skew_pct: 60.0, cftc_institutional_net_long: 62.0, action_warning: "Normal positioning limits" },
        { ticker: "ANET", crowding_score: 52.0, crowding_regime: "Under-allocated", short_interest_ratio: 4.8, options_call_skew_pct: 54.0, cftc_institutional_net_long: 50.0, action_warning: "Normal positioning limits" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositioning();
  }, []);

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {laymanMode ? "Trade Popularity (Is it too crowded?)" : "Institutional Crowding Reality Check"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode 
              ? "Checking if too many big investors have already bought a stock. Avoid buying at the peak." 
              : "Verifies options skew, CFTC net longs, and short interest to map institutional allocation risks."
            }
          </p>
        </div>
        <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-4 py-2 rounded-full font-bold shadow-md">
          Agent: Positioning Analysis Agent
        </span>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold">Scanning Institutional Holdings...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          
          {/* Main Grid comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {data.map((item, idx) => {
              let statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
              let riskBorder = "hover:border-emerald-500/20";
              let popularity = item.crowding_regime;

              if (item.crowding_regime === "Crowded") {
                statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                riskBorder = "hover:border-rose-500/20 ring-1 ring-rose-500/10";
                if (laymanMode) popularity = "Too Popular (Peak Risk)";
              } else if (item.crowding_regime === "Neutral") {
                statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                riskBorder = "hover:border-amber-500/20";
                if (laymanMode) popularity = "Moderately Popular";
              } else {
                if (laymanMode) popularity = "Unpopular (Good Entry)";
              }

              return (
                <div 
                  key={idx} 
                  className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 transition-all duration-300 flex flex-col justify-between ${riskBorder}`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex justify-between items-start border-b border-[#1a1e2e] pb-4 mb-4">
                      <div>
                        <span className="text-base font-bold text-white tracking-tight bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                          {item.ticker}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase block mt-2">
                          {laymanMode ? "Trade Status:" : "Crowding State:"}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${statusColor}`}>
                        {popularity}
                      </span>
                    </div>

                    {/* Technical breakdown vs Layman translation */}
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                        <span className="text-slate-500 font-semibold">
                          {laymanMode ? "Speculative Bullish Bets:" : "Options Call Skew:"}
                        </span>
                        <span className="text-slate-300 font-bold">{item.options_call_skew_pct}%</span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                        <span className="text-slate-500 font-semibold">
                          {laymanMode ? "Short-sellers betting against stock:" : "Short Interest Ratio:"}
                        </span>
                        <span className="text-slate-300 font-bold">{item.short_interest_ratio}%</span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-slate-900 pb-2">
                        <span className="text-slate-500 font-semibold">
                          {laymanMode ? "Big bank buying ratio:" : "CFTC Institutional Net Longs:"}
                        </span>
                        <span className="text-slate-300 font-bold">{item.cftc_institutional_net_long}%</span>
                      </div>
                    </div>

                    {/* Crowding Score Gauge */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                        <span>{laymanMode ? "Risk of Buying at the Top:" : "Cumulative Crowding Score:"}</span>
                        <span className="text-slate-300">{item.crowding_score}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            item.crowding_score > 75 ? "bg-rose-500" : item.crowding_score > 55 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${item.crowding_score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Warning recommendation box */}
                  <div className={`mt-4 p-3.5 rounded-lg border text-xs font-semibold ${
                    item.crowding_score > 75 
                      ? "bg-rose-500/5 border-rose-500/10 text-rose-400" 
                      : "bg-[#111420]/80 border-[#1a2035] text-slate-400"
                  }`}>
                    {item.crowding_score > 75 ? (
                      laymanMode 
                        ? "⚠️ Warning: Too many people are already buying this stock. High risk of a sudden drop."
                        : `⚠️ Warning: ${item.action_warning}`
                    ) : (
                      laymanMode ? "✓ Safe: Normal amount of buyers. Stable entry point." : `✓ Status: ${item.action_warning}`
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom Educational Panel */}
          <div className="bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-lg shadow-black/20">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              {laymanMode ? "What does this mean?" : "How to read positioning metrics"}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed font-medium">
              <div className="space-y-1">
                <strong className="text-slate-200 block mb-1">
                  {laymanMode ? "1. Avoid the Crowd" : "1. Crowd Regimes"}
                </strong>
                <p>
                  {laymanMode 
                    ? "If a stock is classified as Too Popular (Crowded), it means everyone has already bought it. There are no buyers left to push the price higher, increasing the risk of a sharp fall."
                    : "Crowded allocations signal potential trend exhaustion. When short interest is low and call options skew is high, there is a risk of a correction if positive narratives slow."
                  }
                </p>
              </div>
              <div className="space-y-1">
                <strong className="text-slate-200 block mb-1">
                  {laymanMode ? "2. Speculative Bets" : "2. Options Call Skew"}
                </strong>
                <p>
                  {laymanMode 
                    ? "Options call skew measures how much extra money traders are paying to place leveraged bets that the stock will rise. Extremely high values show greed and potential froth."
                    : "Measures the premium paid for calls vs. puts. High call skew shows institutional bias towards bullish momentum but signals high leverage crowding."
                  }
                </p>
              </div>
              <div className="space-y-1">
                <strong className="text-slate-200 block mb-1">
                  {laymanMode ? "3. The Short-Sellers" : "3. Short Interest"}
                </strong>
                <p>
                  {laymanMode 
                    ? "Short-sellers borrow stocks to sell them, betting the price will fall. When short interest is low, it means no one is betting against the stock, which often happens when the trend is maxed out."
                    : "Low short interest ratios (< 2%) indicate lack of hedging defense, while high short interest ratios can set up a 'short squeeze' catalyst if positive narratives trigger."
                  }
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
