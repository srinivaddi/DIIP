"use client";
import React from "react";

export default function FocusDrawer({ isOpen, onClose, item, type, laymanMode, currentHoldings, onHoldingsChange }) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Sliding Drawer Container */}
      <div className="relative w-full max-w-lg h-full bg-[#0d0f17] border-l border-slate-900 shadow-2xl p-8 flex flex-col justify-between overflow-y-auto z-10 animate-slide-in">
        
        {/* Header Block */}
        <div>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-base font-bold bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-2 mb-6 border-b border-slate-900 pb-4">
            <span className="text-xl">{type === "stock" ? "📈" : "📊"}</span>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                {type === "stock" ? `${item.ticker} Detail Panel` : "Theme Focus Panel"}
              </h2>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                {type === "stock" ? "Equity Desk Info" : "Macro Desk Info"}
              </span>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="space-y-6">
            {type === "stock" ? (
              // STOCK DATA VIEW
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Asset Name</label>
                  <div className="text-base font-bold text-white">{item.company_name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111420] p-3 rounded-lg border border-slate-900">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Recommendation</label>
                    <span className="text-xs font-bold text-emerald-400 uppercase">{item.action_recommendation}</span>
                  </div>
                  <div className="bg-[#111420] p-3 rounded-lg border border-slate-900">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Conviction</label>
                    <span className="text-xs font-bold text-white">{item.conviction_score}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111420] p-3 rounded-lg border border-slate-900">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Valuation (P/E)</label>
                    <span className="text-xs font-bold text-white">{item.pe_ratio || "N/A"}</span>
                  </div>
                  <div className="bg-[#111420] p-3 rounded-lg border border-slate-900">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Earnings Growth</label>
                    <span className="text-xs font-bold text-emerald-400">{item.earnings_growth || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    {laymanMode ? "Why this stock is selected" : "Underlying Mapping Logic"}
                  </label>
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111420]/50 p-3 rounded-lg border border-slate-900">
                    {laymanMode ? (
                      item.ticker === "NVDA" 
                        ? "Makes the advanced computer chips that power modern artificial intelligence models. There is huge global demand."
                        : item.ticker === "VRT"
                        ? "Manufactures high-tech cooling systems that prevent massive AI datacenter computers from overheating."
                        : "Creates the networking equipment that connects AI chips together inside hyperscale data hubs."
                    ) : (
                      item.exposure_logic || "Underlying hardware support provider enabling the transition."
                    )}
                  </div>
                </div>

                {/* Portfolio holding slider */}
                {currentHoldings && onHoldingsChange && (
                  <div className="bg-[#111420]/80 p-4 rounded-xl border border-slate-900">
                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                      Adjust My Target Portfolio Allocation
                    </label>
                    <div className="flex items-center justify-between gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        step="1"
                        value={currentHoldings[item.ticker] || 0}
                        onChange={(e) => onHoldingsChange(item.ticker, parseFloat(e.target.value))}
                        className="flex-grow accent-emerald-500 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-white min-w-[40px] text-right">
                        {currentHoldings[item.ticker] || 0}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // THEME DATA VIEW
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Theme Name</label>
                  <div className="text-base font-bold text-white">{item.name}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#111420] p-3 rounded-lg border border-slate-900">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Sentiment Stance</label>
                    <span className="text-xs font-bold text-emerald-400">{item.sentiment}</span>
                  </div>
                  <div className="bg-[#111420] p-3 rounded-lg border border-slate-900">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Time Horizon</label>
                    <span className="text-xs font-bold text-white">{item.horizon}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    {laymanMode ? "What this theme means" : "Thematic Thesis Overview"}
                  </label>
                  <div className="text-xs text-slate-300 leading-relaxed bg-[#111420]/50 p-3 rounded-lg border border-slate-900">
                    {laymanMode ? (
                      item.name.includes("Infrastructure") 
                        ? "Investment in datacenters, chip makers, and power utility companies to build out the foundation for AI applications."
                        : item.name.includes("Defense")
                        ? "Military and government spending updates focused on software, tech grids, and automated security setups."
                        : "Upgrading clean power utilities, battery storage, and grids to support extreme AI computer electricity needs."
                    ) : (
                      item.description || "Thematic consensus mapping derived from institutional Outlook reports."
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Supporting Evidence (Scraped Quotes)</label>
                  <div className="space-y-2">
                    {item.supporting_quotes && item.supporting_quotes.map((quote, idx) => (
                      <div key={idx} className="text-[11px] text-slate-400 italic bg-[#111420]/30 p-2.5 rounded border border-slate-900 leading-normal">
                        "{quote}"
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Consensus Rating</label>
                  <span className="text-xs font-semibold text-slate-300 bg-[#111420] px-3 py-1 rounded border border-slate-900 inline-block mt-1">
                    {item.consensus_status || "Active Consensus"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-900 pt-4 mt-6 flex justify-between text-[9px] text-slate-500 font-semibold uppercase">
          <span>Desk: {type === "stock" ? "Equity Analysis" : "Thematic Outlook"}</span>
          <span>DIIP Intelligence Terminal</span>
        </div>
      </div>
    </div>
  );
}
