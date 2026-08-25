"use client";
import React, { useState, useEffect } from "react";

export default function PortfolioBuilder() {
  const [currentHoldings, setCurrentHoldings] = useState({
    NVDA: 25.0,
    VRT: 20.0,
    ANET: 15.0,
    XLK: 15.0,
    FSELX: 10.0,
    ITA: 10.0,
    XLU: 5.0
  });
  const [rebalancePlan, setRebalancePlan] = useState(null);
  const [activeDesk, setActiveDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newWeight, setNewWeight] = useState(0);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isExecutingOrders, setIsExecutingOrders] = useState(false);
  const [orderExecutions, setOrderExecutions] = useState(null);

  const [etfFlows, setEtfFlows] = useState([
    { sector: "Technology (XLK)", net_flow: "+$1.25B", trend: "Strong Inflow", isPositive: true },
    { sector: "Utilities (XLU)", net_flow: "+$450M", trend: "Moderate Inflow", isPositive: true },
    { sector: "Energy (XLE)", net_flow: "-$890M", trend: "Heavy Outflow", isPositive: false }
  ]);

  const addAsset = (e) => {
    e.preventDefault();
    if (!newTicker) return;
    const tickerUpper = newTicker.toUpperCase();
    setCurrentHoldings(prev => ({
      ...prev,
      [tickerUpper]: parseFloat(newWeight) || 0
    }));
    setNewTicker("");
    setNewWeight(0);
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

  const triggerRebalance = async () => {
    setIsCalculating(true);
    setShowSuccessToast(false);
    setOrderExecutions(null);
    try {
      const response = await fetch("http://localhost:8000/api/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_holdings: currentHoldings })
      });
      if (response.ok) {
        const data = await response.json();
        setRebalancePlan(data);
        setShowSuccessToast(true);
      }
    } catch (err) {
      console.error("Rebalance modeling error:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExecuteOrders = async () => {
    if (!rebalancePlan || !rebalancePlan.recommended_trades) return;
    setIsExecutingOrders(true);
    setOrderExecutions(null);
    try {
      const response = await fetch("http://localhost:8000/api/execute-trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trades: rebalancePlan.recommended_trades })
      });
      if (response.ok) {
        const data = await response.json();
        setOrderExecutions(data.executions || []);
      }
    } catch (err) {
      console.error("Error executing broker orders:", err);
    } finally {
      setIsExecutingOrders(false);
    }
  };

  let displayStrategyDesc = rebalancePlan?.strategy_desc;
  if (laymanMode && rebalancePlan) {
    if (activeDesk === "macro") displayStrategyDesc = "Defensive Setup (Saves 25% cash for safety)";
    else if (activeDesk === "equity") displayStrategyDesc = "Growth Focus (Invests 100% in stocks, 0% cash)";
    else displayStrategyDesc = "Standard Balanced Setup (Invests 90% in stocks, 10% cash)";
  }

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {laymanMode ? "Simple Portfolio Helper" : "Portfolio Rebalancer"}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode ? "Calculate how much of each stock to buy to match your target goals." : "Model capital allocations and execute targeted rebalance weights"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full font-bold">
            Primary Desk: Portfolio Strategy
          </span>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white border-none px-6 py-3 rounded-xl font-bold cursor-pointer shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => triggerRebalance()}
            disabled={isCalculating}
          >
            {isCalculating ? "Calculating..." : (laymanMode ? "Calculate Trades" : "Execute Rebalance Model")}
          </button>
        </div>
      </header>

      {/* Grid of Portfolio Inputs & Sector capital flows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Main Portfolio Configurations Card */}
        <section className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 transition-all duration-300 ${
          activeDesk === "portfolio" ? "ring-2 ring-purple-500/40" : ""
        }`}>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#1a1e2e] pb-3 mb-6">
            {laymanMode ? "My Stocks (Current Holdings)" : "Current Holding Allocations"}
          </h3>
          <div className="flex flex-col gap-4">
            {Object.entries(currentHoldings).map(([ticker, weight]) => (
              <div key={ticker} className="flex items-center justify-between gap-4 text-sm font-semibold">
                <span className="w-16 text-white font-bold">{ticker}</span>
                <div className="flex-grow h-2 bg-[#1a1e2e] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${weight}%` }}></div>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={weight}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setCurrentHoldings(prev => ({ ...prev, [ticker]: val }));
                    }}
                    className="w-16 bg-[#111420] text-white text-xs border border-slate-800 rounded p-1 text-center outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Form to Add New Asset to Portfolio */}
          <form onSubmit={addAsset} className="flex items-center gap-3 border-t border-[#1a1e2e]/55 pt-5 mt-5">
            <input 
              type="text"
              placeholder={laymanMode ? "Stock Ticker (e.g. AAPL)" : "Ticker"}
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              className="flex-grow bg-[#111420] text-white text-xs border border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 uppercase"
            />
            <input 
              type="number"
              min="0"
              max="100"
              step="0.5"
              placeholder="%"
              value={newWeight || ""}
              onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
              className="w-20 bg-[#111420] text-white text-xs border border-slate-800 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-center"
            />
            <button 
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold border-none px-4 py-2 rounded-lg text-xs cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {laymanMode ? "Add Stock" : "Add Asset"}
            </button>
          </form>
        </section>

        {/* Sector ETF Flows Card */}
        <section className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 transition-all duration-300 ${
          activeDesk === "portfolio" ? "ring-2 ring-purple-500/40" : ""
        }`}>
          <div className="flex justify-between items-center border-b border-[#1a1e2e] pb-3 mb-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {laymanMode ? "Where Funds are Flowing" : "ETF Capital Flows"}
            </h3>
            <span className="text-[10px] bg-[#1a1e2e] text-slate-400 px-2 py-0.5 rounded font-bold uppercase">Flow Agent</span>
          </div>
          <div className="flex flex-col gap-4">
            {etfFlows.map(flow => (
              <div key={flow.sector} className="flex justify-between items-center bg-[#111420]/80 p-4 rounded-lg border border-[#1a2035] hover:bg-[#111420] transition-colors">
                <div>
                  <div className="font-semibold text-sm text-white">{flow.sector}</div>
                  <div className="text-xs text-slate-500 font-semibold">{laymanMode ? (flow.isPositive ? "Funds entering sector" : "Funds leaving sector") : flow.trend}</div>
                </div>
                <span className={`text-base font-bold ${flow.isPositive ? "text-emerald-400" : "text-rose-500"}`}>{flow.net_flow}</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {showSuccessToast && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl mb-6 text-xs font-bold animate-fade-in flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          {laymanMode ? "Recommended trades calculated successfully! Setup updated." : "Asset rebalance model recalculated successfully! Target allocations updated."}
        </div>
      )}

      {/* Display Rebalance Plan details */}
      {rebalancePlan && (
        <section className={`bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 animate-fade-in transition-all duration-300 ${
          activeDesk === "portfolio" ? "ring-2 ring-purple-500/40" : ""
        }`}>
          <div className="flex justify-between items-center border-b border-[#1a1e2e] pb-3 mb-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {laymanMode ? "Recommended Trades to Make" : "Recommended Rebalancing Executions"}
            </h3>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">{displayStrategyDesc}</span>
          </div>
          <div className="grid grid-cols-2 gap-10">
            {/* Trades */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                {laymanMode ? "What to Buy / Sell" : "Trade Actions"}
              </h4>
              {rebalancePlan.recommended_trades.map(trade => (
                <div key={trade.ticker} className="flex justify-between items-center bg-[#111420]/80 p-4 rounded-lg border border-[#1a2035] mb-3 hover:bg-[#111420] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                      trade.action === "Buy" ? "bg-emerald-600" : "bg-rose-600"
                    }`}>{trade.action}</span>
                    <strong className="text-white text-sm tracking-tight">{trade.ticker}</strong>
                  </div>
                  <div className="text-xs text-slate-300">
                    {laymanMode ? "Trade Size: " : "Size: "} 
                    <strong className="text-white font-semibold">{trade.trade_size_pct}%</strong> | 
                    {laymanMode ? " Target Share: " : " Target: "}
                    <strong className="text-white font-semibold">{trade.target_weight_pct}%</strong>
                  </div>
                </div>
              ))}



              {/* Execution reports logs */}
              {orderExecutions && (
                <div className="mt-6 space-y-3 border-t border-slate-900 pt-5 animate-fade-in">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Execution Broker Report</h5>
                  {orderExecutions.map((exec, idx) => (
                    <div key={idx} className="bg-[#111420] border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block mb-0.5">{exec.ticker}</span>
                        <span className="text-[10px] text-slate-400">{exec.msg}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                        exec.status.includes("Filled") || exec.status.includes("Submitted")
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}>{exec.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Target Allocations Matrix */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                {laymanMode ? "My Target Investments" : "Target Allocations Matrix"}
              </h4>
              <div className="flex flex-col gap-4">
                {Object.entries(rebalancePlan.target_allocation_matrix).map(([ticker, weight]) => (
                  <div key={ticker} className="flex items-center justify-between gap-4 text-xs font-semibold">
                    <span className="w-12 text-white">{ticker}</span>
                    <div className="flex-grow h-2 bg-[#1a1e2e] rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${weight}%` }}></div>
                    </div>
                    <span className="w-10 text-right text-slate-400">{weight}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-xs text-slate-500 font-bold uppercase tracking-wider">
                {laymanMode ? "Cash Saved for Safety: " : "Cash Reserve Allocation: "} {rebalancePlan.cash_reserve_pct}%
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
