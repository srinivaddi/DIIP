"use client";
import React, { useState, useEffect } from "react";

export default function ResearchMemos() {
  const [memos, setMemos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDesk, setActiveDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [memoCategory, setMemoCategory] = useState("themes"); // "themes" or "assets"

  const translatePoint = (txt) => {
    if (!laymanMode) return txt;
    let t = txt;
    t = t.replace(/Strong institutional momentum backing the transition\./gi, "Many big banks are buying this stock.");
    t = t.replace(/Valuation support following recent Multiple expansions\./gi, "The stock price is fair compared to company earnings.");
    t = t.replace(/High earnings growth visibility backed by backlogs\./gi, "Clear proof of future sales from existing orders.");
    t = t.replace(/Intensifying competitive landscape in hardware nodes\./gi, "Strong competition from other computer chip makers.");
    t = t.replace(/Potential macroeconomic slowing in capital expenditure budgets\./gi, "Risk of big companies spending less on technology.");
    t = t.replace(/Consensus support across major Wall Street Outlook releases\./gi, "All big investment firms agree this is a buy.");
    t = t.replace(/Positive ETF inflows confirming capital migrations\./gi, "Lots of investors are putting money into these funds.");
    t = t.replace(/Supportive disinflationary macro environment\./gi, "Lower inflation is good for technology growth.");
    t = t.replace(/Delays in secondary grid electrical supply hookups\./gi, "Bottlenecks in connecting new datacenters to power.");
    t = t.replace(/Valuation multiple expansions exceeding historical ceilings\./gi, "Risk of the stock becoming too expensive.");
    return t;
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

  const fetchAllMemos = async (category = memoCategory) => {
    setIsLoading(true);
    try {
      const ticker = localStorage.getItem("selectedMemoTicker");
      const type = localStorage.getItem("selectedMemoType");

      if (ticker && type === "stock") {
        setSelectedStock(ticker);
        const response = await fetch("http://localhost:8000/api/generate-thesis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: ticker, type: "stock" })
        });
        if (response.ok) {
          const data = await response.json();
          setMemos([data]);
        }
      } else {
        setSelectedStock(null);
        let targetList = [];
        let targetType = "theme";

        if (category === "themes") {
          targetList = ["AI Infrastructure", "Defense Grid Modernization", "Energy Transition Infrastructure"];
          targetType = "theme";
        } else {
          targetList = ["NVDA", "VRT", "ANET", "XLK", "FSELX", "ITA", "XLU"];
          targetType = "stock";
        }

        const response = await fetch("http://localhost:8000/api/generate-theses-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targets: targetList, type: targetType })
        });
        if (response.ok) {
          const data = await response.json();
          setMemos(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch research memos:", err);
      setMemos([
        {
          title: "Thematic Outlook Memo: AI Infrastructure",
          confidence_score: 9.1,
          why_now: [
            "Consensus support across Wall Street Outlook releases.",
            "Positive ETF inflows confirming capital migrations."
          ],
          beneficiaries: ["NVDA", "VRT", "ANET"],
          risks: ["Delays in secondary grid electrical supply hookups."]
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMemos();
  }, [memoCategory]);

  const handleClearSelectedStock = () => {
    localStorage.removeItem("selectedMemoTicker");
    localStorage.removeItem("selectedMemoType");
    setSelectedStock(null);
    fetchAllMemos(memoCategory);
  };

  const handleCategoryChange = (cat) => {
    localStorage.removeItem("selectedMemoTicker");
    localStorage.removeItem("selectedMemoType");
    setSelectedStock(null);
    setMemoCategory(cat);
  };

  const filteredMemos = memos.filter(memo => {
    if (selectedStock) return true;

    const title = memo.title.toLowerCase();
    const isTheme = title.includes("thematic outlook") || title.includes("infrastructure") || title.includes("transition") || title.includes("modernization");

    if (isTheme) {
      if (activeDesk === "macro") {
        return title.includes("infrastructure") || title.includes("transition");
      }
      if (activeDesk === "equity") {
        return title.includes("infrastructure") || title.includes("modernization");
      }
      return true;
    } else {
      const tickerMatch = memo.title.match(/Investment Thesis Memo:\s*([A-Z0-9]+)/i);
      const ticker = tickerMatch ? tickerMatch[1].toUpperCase() : "";

      const isETFOrMF = ["XLK", "FSELX", "ITA", "XLU", "SMH", "SOXX", "BOTZ", "FDGRX", "FBGRX", "VTSAX"].includes(ticker);
      const isUtilityOrIndex = ["XLK", "XLU", "SMH", "SOXX", "ITA", "VTSAX"].includes(ticker);

      if (activeDesk === "equity") {
        return !isETFOrMF;
      }
      if (activeDesk === "portfolio") {
        return isETFOrMF;
      }
      if (activeDesk === "macro") {
        return isUtilityOrIndex;
      }
      return true;
    }
  });

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {selectedStock 
              ? `${selectedStock} Research Memo`
              : (laymanMode ? "Simple Research Summaries" : "Institutional Research Memos")
            }
            {memos && memos[0]?.source === "Live LLM Generation" ? (
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                ● Live LLM Memos
              </span>
            ) : (
              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                ○ Seeded/Simulated Memos
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {selectedStock 
              ? `Dynamic analyst-grade thesis generated for individual security: ${selectedStock}`
              : (laymanMode ? "AI-generated summaries detailing risks, targets, and key buying reasons." : "Analyst-grade investment theses generated automatically from multi-agent synthesis")
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedStock && (
            <button 
              onClick={handleClearSelectedStock}
              className="bg-[#111420] hover:bg-slate-800 text-slate-300 font-bold border border-slate-800 px-4 py-2 rounded-lg text-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              ← Back to Overview
            </button>
          )}
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold shadow-md">
            Agent: Thesis Generation Engine
          </span>
        </div>
      </header>

      {/* Category selector toggles (only show if not viewing a single focused stock memo) */}
      {!selectedStock && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => handleCategoryChange("themes")}
              className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                memoCategory === "themes"
                  ? "bg-emerald-600 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                  : "bg-[#111420] border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              📌 Thematic Outlooks
            </button>
            <button
              onClick={() => handleCategoryChange("assets")}
              className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                memoCategory === "assets"
                  ? "bg-emerald-600 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                  : "bg-[#111420] border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              📈 Single Asset Memos
            </button>
          </div>
        </div>
      )}

      {/* Scannability Upgrade: Dynamic High-Conviction Leaderboard Summary */}
      {!isLoading && filteredMemos.length > 1 && (
        <div className="bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-5 mb-8 flex flex-col gap-3 shadow-lg shadow-black/20">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {laymanMode ? "Highly Recommended Allocations" : "Thematic Conviction Leaderboard"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredMemos.slice(0, 4).map((memo, idx) => (
              <div key={idx} className="bg-[#111420]/80 p-3 rounded-lg border border-[#1a2035] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white font-extrabold truncate block max-w-[140px]">{memo.title.replace(/Thematic Outlook Memo: |Investment Thesis Memo: /g, "")}</span>
                  <span className="text-[9px] text-slate-500 block">Rank #{idx+1}</span>
                </div>
                <span className={`text-xs font-extrabold px-2 py-1 rounded ${
                  memo.confidence_score > 9 ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                }`}>
                  {memo.confidence_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold">Synthesizing Memos...</span>
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${filteredMemos.length === 1 ? "max-w-2xl mx-auto" : "xl:grid-cols-2"} gap-8`}>
          {filteredMemos.map((memo, idx) => (
            <div 
              key={idx} 
              className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 hover:scale-[1.002] hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between ${
                activeDesk === "macro" || activeDesk === "equity" ? "ring-1 ring-emerald-500/10" : ""
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex justify-between items-start border-b border-[#1a1e2e] pb-4 mb-5">
                  <div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                      Official Release
                    </span>
                    <h3 className="text-lg font-bold text-white tracking-tight mt-2.5 leading-snug">{memo.title}</h3>
                  </div>

                  {/* Redesigned Premium Conviction Badge */}
                  <div className="flex items-center justify-center bg-[#111420] border border-slate-800 w-14 h-14 rounded-full shadow-inner shadow-black/50">
                    <div className="text-center">
                      <span className="text-[7px] text-slate-500 font-bold uppercase block leading-none">Score</span>
                      <span className={`text-base font-black ${
                        memo.confidence_score > 9 ? "text-emerald-400" : "text-blue-400"
                      }`}>{memo.confidence_score}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body - Grid Layout for Scannability */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Why Invest Now & Beneficiaries */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Why Invest Now</span>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300 leading-relaxed">
                        {memo.why_now && memo.why_now.map((pt, idx) => <li key={idx}>{translatePoint(pt)}</li>)}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Key Sector Beneficiaries</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {memo.beneficiaries && memo.beneficiaries.map((ticker, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] bg-slate-900 text-emerald-400 border border-slate-800 px-2 py-0.5 rounded font-extrabold hover:border-emerald-500/30 transition-colors"
                          >
                            {ticker}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Risk Factors */}
                  <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-[#1a1e2e]/50 pt-4 md:pt-0 md:pl-6">
                    <span className="text-[9px] text-rose-400/80 font-bold uppercase tracking-wider block">Key Risk Factors</span>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400 leading-relaxed">
                      {memo.risks && memo.risks.map((risk, idx) => <li key={idx}>{translatePoint(risk)}</li>)}
                    </ul>
                  </div>

                </div>
              </div>

              {/* Card Footer */}
              <div className="border-t border-[#1a1e2e]/50 pt-4 mt-6 flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                <span>Desk: {memoCategory === "assets" || selectedStock ? "Equity Strategy" : "Macro Strategy"}</span>
                <span>Security Clearance: Level-1</span>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
