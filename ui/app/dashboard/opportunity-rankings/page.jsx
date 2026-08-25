"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OpportunityRankings() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState([]);
  const [activeDesk, setActiveDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    fetch("http://localhost:8000/api/opportunities")
      .then(res => res.json())
      .then(data => {
        setOpportunities(data);
        setIsLoading(false);
      })
      .catch(() => {
        setOpportunities([
          { ticker: "NVDA", company_name: "Nvidia Corp", exposure_type: "Pure-Play", exposure_logic: "Dominant AI training GPU chipsets provider.", conviction_score: 92.5, rank: 1, action_recommendation: "Strong Buy", asset_class: "Equity" },
          { ticker: "VRT", company_name: "Vertiv Holdings Co", exposure_type: "Value-Chain", exposure_logic: "Cooling & liquid flow infrastructure essential for datacenters.", conviction_score: 88.4, rank: 2, action_recommendation: "Buy", asset_class: "Equity" },
          { ticker: "ANET", company_name: "Arista Networks Inc", exposure_type: "Value-Chain", exposure_logic: "High-throughput ethernet switching standard.", conviction_score: 83.2, rank: 3, action_recommendation: "Buy", asset_class: "Equity" },
          { ticker: "XLK", company_name: "Technology Select Sector SPDR Fund", exposure_type: "Pure-Play", exposure_logic: "Broad tech sector benchmark ETF", conviction_score: 89.5, rank: 4, action_recommendation: "Buy", asset_class: "ETF" },
          { ticker: "FSELX", company_name: "Fidelity Advisor Semiconductors Fund", exposure_type: "Pure-Play", exposure_logic: "Active mutual fund targeting semiconductor designers", conviction_score: 87.2, rank: 5, action_recommendation: "Buy", asset_class: "Mutual Fund" }
        ]);
        setIsLoading(false);
      });
  }, []);

  const filteredOpps = opportunities.filter(opp => {
    // Filter by Asset Class Toggle
    if (selectedClass !== "all") {
      if (opp.asset_class !== selectedClass) return false;
    }

    return true;
  });

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {laymanMode ? "Simple Asset Rankings" : "Opportunity Leaderboard"}
            {opportunities && opportunities[0]?.source?.startsWith("Live Market Momentum") ? (
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                ● Live Momentum Rankings
              </span>
            ) : (
              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                ○ Simulated Index Rankings
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode ? "A list of recommended stocks, ETFs, and funds ranked by safety." : "Ranked pure-play exposures, benchmarks, and diversified asset classes"}
          </p>
        </div>
        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full font-bold">
          Primary Desk: Quantitative Equity
        </span>
      </header>

      {/* Asset Class Filter Toggles */}
      <div className="flex gap-3 mb-6">
        {["all", "Equity", "ETF", "Mutual Fund"].map(cls => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
              selectedClass === cls
                ? "bg-emerald-600 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                : "bg-[#111420] border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {cls === "all" ? (laymanMode ? "All Asset Types" : "All Asset Classes") : cls + "s"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold">Calculating Live Rankings...</span>
        </div>
      ) : (
        <section className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 mb-8 shadow-xl shadow-black/20 transition-all duration-300 ${
          activeDesk === "equity" ? "ring-2 ring-emerald-500/40" : ""
        }`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1a1e2e] text-slate-500 text-xs font-bold tracking-wider uppercase">
                <th className="pb-3">Rank</th>
                <th className="pb-3">Ticker</th>
                <th className="pb-3">Asset Class</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">{laymanMode ? "Why Buy This?" : "Thematic Logic"}</th>
                <th className="pb-3">{laymanMode ? "Safety Score (1-100)" : "Conviction Score"}</th>
                <th className="pb-3">{laymanMode ? "Action Signal" : "Action Stance"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOpps.map(opp => {
                let explanation = opp.exposure_logic || opp.logic;
                if (laymanMode) {
                  if (opp.ticker === "NVDA") explanation = "Makes the key computer chips that power all modern AI software.";
                  else if (opp.ticker === "VRT") explanation = "AI servers get extremely hot; this company keeps them from melting.";
                  else if (opp.ticker === "XLK") explanation = "A collection of top-tier technology companies in a single bucket.";
                  else explanation = "Diversified semiconductor mutual fund active allocation.";
                }
                return (
                  <tr 
                    key={opp.ticker} 
                    onClick={() => {
                      localStorage.setItem("selectedMemoTicker", opp.ticker);
                      localStorage.setItem("selectedMemoType", "stock");
                      router.push("/dashboard/memos");
                    }}
                    className="border-b border-[#1a1e2e]/30 text-sm text-slate-300 hover:bg-[#111420]/30 transition-colors cursor-pointer"
                  >
                    <td className="py-4 text-blue-400 font-extrabold">#{opp.rank}</td>
                    <td className="py-4 font-bold text-white">{opp.ticker}</td>
                    <td className="py-4">
                      <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded border uppercase ${
                        opp.asset_class === "Equity"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : opp.asset_class === "ETF"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {opp.asset_class}
                      </span>
                    </td>
                    <td className="py-4 font-medium">{opp.company_name}</td>
                    <td className="py-4 text-xs text-slate-400 font-medium max-w-sm">{explanation}</td>
                    <td className="py-4 font-bold text-white">{opp.conviction_score}</td>
                    <td className="py-4">
                      {(() => {
                        const rec = opp.action_recommendation || "Hold";
                        let badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        let label = rec;
                        
                        if (rec === "Strong Buy" || rec === "Buy") {
                          badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          if (laymanMode) label = "Buy (Green Light)";
                        } else if (rec === "Hold") {
                          badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                          if (laymanMode) label = "Hold (Neutral)";
                        } else if (rec === "Underperform") {
                          badgeStyle = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                          if (laymanMode) label = "Avoid (Red Flag)";
                        }
                        return (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border uppercase ${badgeStyle}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
