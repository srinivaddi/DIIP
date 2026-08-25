"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedDesk, setSelectedDesk] = useState("equity");
  const [laymanMode, setLaymanMode] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I am your DIIP Advisor Copilot. Ask me anything about our strategies, stock recommendations, or macro stances!" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const detailsMap = {
    macro: { name: "Lead Analyst", role: "Macro Desk", avatar: "M", color: "from-blue-500 to-indigo-600" },
    equity: { name: "Senior Analyst", role: "Equity Desk", avatar: "E", color: "from-emerald-500 to-teal-600" },
    portfolio: { name: "Portfolio Mgr", role: "Asset Allocation", avatar: "P", color: "from-purple-500 to-pink-600" },
    risk: { name: "Risk Officer", role: "Compliance Desk", avatar: "R", color: "from-rose-500 to-amber-600" },
    layman: { name: "Retail Investor", role: "Layman Mode (Simplified)", avatar: "L", color: "from-amber-400 to-orange-500" }
  };

  const [activeModel, setActiveModel] = useState("Gemini-2.5-Flash (Local Fallback)");
  const [activeMode, setActiveMode] = useState("Simulation (Mock)");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDesk = localStorage.getItem("activeDesk");
      if (savedDesk) {
        setSelectedDesk(savedDesk);
      }
      const savedLayman = localStorage.getItem("laymanMode") === "true";
      setLaymanMode(savedLayman);
    }

    // Fetch dynamic config from FastAPI backend
    fetch("http://localhost:8000/api/config")
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.model) setActiveModel(data.model);
          if (data.mode) setActiveMode(data.mode);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { name: "📊 Command Center", laymanName: "📊 Overview", path: "/dashboard" },
    { name: "🏆 Stock Rankings", laymanName: "🏆 What to Buy", path: "/dashboard/opportunity-rankings" },
    { name: "📝 Research Memos", laymanName: "📝 Why to Buy", path: "/dashboard/memos" },
    { name: "🔥 Narrative Flows", laymanName: "🔥 Stance Shifts", path: "/dashboard/narrative-changes" },
    { name: "📦 Portfolio Builder", laymanName: "📦 Allocations", path: "/dashboard/portfolio-builder" },
    { name: "🎯 Crowding Reality", laymanName: "🎯 Is it Too Crowded?", path: "/dashboard/crowding-reality" },
    { name: "🎯 Action Signals", laymanName: "🎯 Buy/Sell/Hold Guide", path: "/dashboard/action-signals" },
    { name: "🔔 Alert Logs", laymanName: "🔔 When to React", path: "/dashboard/alerts" },
    { name: "⚙️ System Schedulers", laymanName: "⚙️ System Status", path: "/dashboard/schedulers" }
  ];

  const profile = detailsMap[laymanMode ? "layman" : selectedDesk] || detailsMap.macro;

  const toggleLaymanMode = (checked) => {
    setLaymanMode(checked);
    if (typeof window !== "undefined") {
      localStorage.setItem("laymanMode", checked ? "true" : "false");
      window.dispatchEvent(new CustomEvent("laymanModeChanged", { detail: checked }));
    }
  };

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 min-h-screen font-sans antialiased">
      {/* 1. DISCLAIMER BANNER - Spans complete top */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-8 py-3 text-amber-200 w-full z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-4 h-4 flex-shrink-0 text-amber-400" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" x2="12" y1="8" y2="12"></line>
              <line x1="12" x2="12.01" y1="16" y2="16"></line>
            </svg>
            <span>
              <span className="font-semibold text-amber-300">Disclaimer:</span> Educational research tool. Not investment advice. Past performance is not indicative of future results.
            </span>
          </div>
          <button 
            onClick={() => setShowDrawer(true)}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold uppercase tracking-wider underline focus:outline-none self-start md:self-auto"
          >
            View Full Disclaimer & Advisor Advisory
          </button>
        </div>
      </div>

      {/* 2. ACRONYM HEADER SECTION - Below disclaimer, above sub-tabs */}
      <div className="bg-slate-900/30 border-b border-slate-900/80 px-8 py-4 w-full">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl bg-emerald-500/10 p-2 rounded-xl text-emerald-400 font-bold animate-pulse">⚡</span>
            <div>
              <span className="text-lg font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">DIIP Engine</span>
              <span className="text-xs text-slate-400 font-medium ml-3 border-l border-slate-800 pl-3 uppercase tracking-wider font-semibold">Digital Institutional Intelligence Platform</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-[10px] font-bold">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md shadow-sm">
              📊 Mode: {activeMode}
            </span>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md shadow-sm">
              🤖 Engine: {activeModel}
            </span>
          </div>
        </div>
      </div>

      {/* Main split viewport (Sidebar starts below the acronym header) */}
      <div className="flex flex-grow w-full">
        {/* 3. SIDE NAVIGATION BAR (Aligned with Simple Financial Dashboard) */}
        <aside className="w-72 bg-slate-900/60 backdrop-blur-md border-r border-slate-900 flex flex-col p-8 shrink-0 h-[calc(100vh-105px)] sticky top-[105px]">
          
          {/* Dynamic Sidebar Header Title */}
          <div className="mb-6 pb-4 border-b border-slate-900/80 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Console View</span>
              <span className="text-sm font-extrabold text-white mt-1 block tracking-tight">
                {laymanMode ? "💡 Simple Investment Guide" : "⚙️ Analyst Control Desk"}
              </span>
            </div>
            {/* Advisor Copilot circular mini-button */}
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all duration-200 border ${
                showCopilot
                  ? "bg-sky-500 text-slate-950 border-sky-400/50 shadow-sky-500/25"
                  : "bg-slate-950 border-slate-800 text-slate-300 hover:border-sky-500/40 hover:text-sky-400"
              }`}
              title="Toggle Advisor Copilot"
            >
              <span className="text-sm">💬</span>
            </button>
          </div>

          <nav className="flex flex-col gap-2.5 flex-grow">
            {navItems.map(item => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => item.path !== "#" && router.push(item.path)}
                  className={`w-full text-left text-xs px-4 py-3 rounded-lg border transition-all duration-200 active:scale-95 cursor-pointer font-semibold ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-transparent font-extrabold shadow-lg shadow-emerald-500/25"
                      : "bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400"
                  }`}
                >
                  {laymanMode ? item.laymanName : item.name}
                </button>
              );
            })}
          </nav>
          
          {/* LAYMAN MODE TOGGLE SWITCH (Restored) */}
          <div className="border-t border-slate-900 pt-5 mb-4">
            <div className="flex items-center justify-between bg-slate-950 border border-slate-900 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">💡 Layman Mode</span>
              <input 
                type="checkbox" 
                checked={laymanMode}
                onChange={(e) => toggleLaymanMode(e.target.checked)}
                className="cursor-pointer accent-emerald-500 w-4.5 h-4.5"
              />
            </div>
          </div>

          {/* DYNAMIC INSTITUTIONAL DESK SELECTOR (Restored) */}
          <div className="border-t border-slate-900 pt-4">
            <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Active Desk View</label>
            <select 
              value={selectedDesk}
              onChange={(e) => {
                const selectedValue = e.target.value;
                setSelectedDesk(selectedValue);
                if (typeof window !== "undefined") {
                  localStorage.setItem("activeDesk", selectedValue);
                  window.dispatchEvent(new CustomEvent("deskChanged", { detail: selectedValue }));
                }
              }}
              className="w-full bg-slate-950 text-slate-300 text-xs border border-slate-900 rounded-lg p-2 mb-3 cursor-pointer outline-none focus:border-emerald-500/50 transition-colors"
            >
              <option value="macro">📊 Macro Allocation Desk</option>
              <option value="equity">📈 Quantitative Equity Desk</option>
              <option value="portfolio">📦 Portfolio Strategy Desk</option>
              <option value="risk">🛡️ Risk & Compliance Desk</option>
            </select>


            <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-900">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${profile.color} text-white flex items-center justify-center font-bold shadow-md`}>
                {profile.avatar}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{profile.name}</div>
                <div className="text-[9px] text-slate-500 font-bold tracking-wide uppercase">{profile.role}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* 4. SUB-PAGE CONTENT WRAPPER */}
        <div className="flex-grow bg-slate-950">
          {children}
        </div>
      </div>

      {/* 5. ADVISOR ADVISORY DRAWER MODAL */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowDrawer(false)}></div>
          <div className="relative w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-start overflow-y-auto z-10">
            <button 
              onClick={() => setShowDrawer(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none"
            >
              ✕
            </button>
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-5 h-5 text-indigo-400" aria-hidden="true">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
              <h2 className="text-lg font-extrabold text-white">System Advisory & Disclosure</h2>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              This application is an educational simulation of multi-agent institutional financial decision models. It is designed to illustrate consensus-aggregation and portfolios allocation theory:
            </p>

            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>1. Educational Nature
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All metrics, stock weight matrices, and sentiment indexes are purely simulated. They do not constitute actual investment strategies.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>2. No Advisory Mandate
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This tool does not provide direct trading alerts or formal stock recommendations. You must consult with a certified financial advisor before acting on any simulated metrics.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>3. Simulation Disclaimers
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Past simulated scores are not guarantees of future profitability. Calculations exclude brokerage fees, tax implications, or execution spreads.
                </p>
              </div>

              <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/25 flex justify-between text-xs gap-3">
                <div>
                  <span className="font-extrabold text-indigo-400 block mb-0.5">Simulated Risk Levels:</span>
                  <span className="text-slate-300">Composite thresholds decide strategy weights.</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[9px]">Low Risk</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 text-[9px]">Moderate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* FLOATING COPILOT CHAT PANEL */}
      {showCopilot && (
        <div className="fixed bottom-22 right-6 z-40 w-96 h-[480px] bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black text-sky-400 tracking-wider uppercase">Advisor Copilot</span>
            </div>
            <button 
              onClick={() => setShowCopilot(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[80%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-sky-500/20 text-sky-100 self-end border border-sky-500/20" 
                    : "bg-slate-950 text-slate-300 self-start border border-slate-800"
                }`}
              >
                {msg.content}
              </div>
            ))}
            {isTyping && (
              <div className="bg-slate-950 text-slate-400 border border-slate-800 self-start rounded-xl p-3 text-xs italic">
                Copilot is analyzing allocation metrics...
              </div>
            )}
          </div>

          {/* Input form */}
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              if (!inputValue.trim()) return;
              
              const userMsg = { role: "user", content: inputValue };
              const currentMessages = [...chatMessages, userMsg];
              setChatMessages(currentMessages);
              setInputValue("");
              setIsTyping(true);

              try {
                const response = await fetch("http://localhost:8000/api/copilot/chat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ messages: currentMessages, laymanMode: laymanMode })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  setChatMessages([...currentMessages, { role: "assistant", content: data.response }]);
                } else {
                  setChatMessages([...currentMessages, { role: "assistant", content: "I'm sorry, I'm having trouble connecting to the copilot service right now." }]);
                }
              } catch (err) {
                setChatMessages([...currentMessages, { role: "assistant", content: "API Error: Make sure your FastAPI backend server is running." }]);
              } finally {
                setIsTyping(false);
              }
            }}
            className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2"
          >
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about opportunities or risk..."
              className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-sky-500/50 transition-colors"
            />
            <button 
              type="submit"
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
