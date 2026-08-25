"use client";
import React, { useState, useEffect } from "react";

export default function SystemSchedulers() {
  const [schedulers, setSchedulers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDesk, setActiveDesk] = useState("macro");
  const [laymanMode, setLaymanMode] = useState(false);
  const [isLive, setIsLive] = useState(false);

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

  const fetchSchedulers = () => {
    setIsLoading(true);
    fetch("http://localhost:8000/api/schedulers")
      .then((res) => res.json())
      .then((data) => {
        setSchedulers(data);
        setIsLive(true);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch schedulers:", err);
        setIsLive(false);
        setSchedulers([
          {
            name: "Hourly News Ingestion Scheduler",
            description: "Monitors real-time financial news alerts for catalyst triggers.",
            source: "Bloomberg News, Reuters, Yahoo Finance RSS",
            interval: "Hourly (Every 60m)",
            status: "Offline",
            last_run: "2026-08-04 18:00:00",
            next_run: "2026-08-04 19:00:00"
          },
          {
            name: "Daily ETF Flow Ingestion Scheduler",
            description: "Analyzes daily sector capital flows and index adjustments.",
            source: "ETF Database & SEC Edgar Filings API",
            interval: "Daily (Every 24h at 04:00 AM)",
            status: "Offline",
            last_run: "2026-08-04 04:00:00",
            next_run: "2026-08-05 04:00:00"
          },
          {
            name: "Weekly Research Ingestion Scheduler",
            description: "Crawls institutional research commentary and PDFs.",
            source: "BlackRock RSS Feed & Goldman Sachs Seed Portal",
            interval: "Weekly (Every Monday at 04:00 AM)",
            status: "Offline",
            last_run: "2026-08-03 04:00:00",
            next_run: "2026-08-10 04:00:00"
          },
          {
            name: "Monthly Macro Classifier Scheduler",
            description: "Recalculates macroeconomic regimes based on CPI/PPI inflation updates.",
            source: "Yahoo Finance (Spread), RateInflation.com (CPI)",
            interval: "Monthly (1st of month at 04:00 AM)",
            status: "Offline",
            last_run: "2026-08-01 04:00:00",
            next_run: "2026-09-01 04:00:00"
          }
        ]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchSchedulers();

    // Establish real-time Pub/Sub WebSocket connection
    const ws = new WebSocket("ws://localhost:8000/ws/alerts");

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "SCHEDULER_TRIGGERED") {
          console.log("Real-time scheduler update received:", message.scheduler);
          // Refetch fresh scheduler run times from backend
          fetchSchedulers();
        }
      } catch (err) {
        console.error("Error parsing real-time websocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("Websocket connection error:", err);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="flex-grow p-10 overflow-y-auto">
      <header className="flex justify-between items-center border-b border-[#1a1e2e] pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            {laymanMode ? "Automatic Data Jobs" : "System Schedulers"}
            {isLive ? (
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                ● Live Feeds Active
              </span>
            ) : (
              <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider animate-pulse">
                ⚠ Local Cache (Server Offline)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            {laymanMode 
              ? "Monitor background updates reading news, files, and market prices automatically." 
              : "Monitor periodic background cron cycles and active data ingestion pipelines."
            }
          </p>
        </div>
        <button
          onClick={fetchSchedulers}
          className="bg-[#111420] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 px-4 py-2 rounded-lg text-xs font-bold transition-all"
        >
          🔄 Refresh Status
        </button>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-bold">Querying Scheduler Daemons...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {schedulers.map((job) => {
            let name = job.name;
            let desc = job.description;
            if (laymanMode) {
              if (job.name.includes("Hourly")) {
                name = "Hourly News Reader";
                desc = "Reads major news sites every hour to spot new business topics.";
              } else if (job.name.includes("Daily")) {
                name = "Daily Fund Flow Tracker";
                desc = "Tracks where big investment money moves inside major stock funds.";
              } else if (job.name.includes("Weekly")) {
                name = "Weekly Report Collector";
                desc = "Checks big investment companies' websites for new outlook articles.";
              } else {
                name = "Monthly Economy Check";
                desc = "Re-evaluates overall inflation and rate trends using official updates.";
              }
            }

            // Calculate elapsed time percentage towards next execution
            let progressPct = 0;
            try {
              const lastTime = new Date(job.last_run).getTime();
              const nextTime = new Date(job.next_run).getTime();
              const currentTime = new Date().getTime();
              if (nextTime > lastTime) {
                progressPct = Math.min(100, Math.max(0, ((currentTime - lastTime) / (nextTime - lastTime)) * 100));
              }
            } catch (e) {
              progressPct = 0;
            }

            return (
              <div 
                key={job.name} 
                className="bg-[#0d0f17] border border-[#1a1e2e] rounded-xl p-6 shadow-xl shadow-black/20 hover:scale-[1.005] hover:border-emerald-500/20 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{name}</h3>
                      <span className="text-[10px] text-slate-500 font-bold tracking-wide uppercase block mt-1">
                        Interval: {job.interval}
                      </span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {job.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4 font-medium">
                    {desc}
                  </p>

                  <div className="bg-[#111420]/80 p-4 rounded-lg border border-[#1a2035] space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-semibold">{laymanMode ? "What it reads:" : "Data Channel:"}</span>
                      <span className="text-slate-300 font-bold text-right pl-2 leading-relaxed">{job.source}</span>
                    </div>
                  </div>

                  {/* Scannability Upgrade: Dynamic Time Progress to next boundary */}
                  <div className="mb-5">
                    <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      <span>Time Elapsed Towards Next Run:</span>
                      <span className="text-slate-300">{Math.round(progressPct)}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#1a1e2e]/50 pt-4 flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Last Run: {job.last_run}</span>
                  <span>Next Run: {job.next_run}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
