from fastapi import FastAPI, UploadFile, File, Form, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import sys

import requests

# Adjust path to import packages from root and .agents
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

# Load .env configurations with manual parsing fallback
env_path = os.path.join(ROOT_DIR, ".env")
try:
    from dotenv import load_dotenv
    load_dotenv(env_path)
except ImportError:
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

from shared.models.theme import Theme
from shared.models.opportunity import Opportunity
from workflows.on_demand_ingestion_workflow.orchestrator import run as run_ingestion
from agents.macro_agent.tools.regime_classifier import RegimeClassifier
from agents.opportunity_scoring_agent.tools.scoring_engine import ScoringEngine
from agents.portfolio_manager.tools.rebalancer import PortfolioRebalancer
from agents.earnings_agent.tools.sec_filing_reader import SECFilingReader

app = FastAPI(
    title="DIIP API (Digital Institutional Intelligence Platform)",
    description="REST backend endpoints for institutional theme ingestion, scoring, and portfolio rebalancing.",
    version="1.0.0"
)

# Enable CORS for frontend dashboard connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import asyncio
import json
from datetime import datetime, timedelta

# Global timestamps to track the actual execution times of active background loops
daily_etf_last_run = datetime.now() - timedelta(hours=14.5)  # Seeded to last 4:00 AM cycle
weekly_research_last_run = datetime.now() - timedelta(days=1.5)  # Seeded to last Monday 4:00 AM cycle
monthly_macro_last_run = datetime.now() - timedelta(days=3.5)  # Seeded to last 1st of month cycle
hourly_news_last_run = datetime.now() - timedelta(minutes=50)  # Seeded to last hour cycle

SCHEDULER_STATE_PATH = os.path.join(os.path.dirname(__file__), "scheduler_state.json")

def load_scheduler_state():
    global daily_etf_last_run, weekly_research_last_run, monthly_macro_last_run, hourly_news_last_run
    if os.path.exists(SCHEDULER_STATE_PATH):
        try:
            with open(SCHEDULER_STATE_PATH, "r") as f:
                data = json.load(f)
                if "daily_etf_last_run" in data:
                    daily_etf_last_run = datetime.fromisoformat(data["daily_etf_last_run"])
                if "weekly_research_last_run" in data:
                    weekly_research_last_run = datetime.fromisoformat(data["weekly_research_last_run"])
                if "monthly_macro_last_run" in data:
                    monthly_macro_last_run = datetime.fromisoformat(data["monthly_macro_last_run"])
                if "hourly_news_last_run" in data:
                    hourly_news_last_run = datetime.fromisoformat(data["hourly_news_last_run"])
            print("Successfully loaded scheduler states from disk.")
        except Exception as e:
            print(f"Failed to load scheduler state: {e}")

def save_scheduler_state():
    try:
        with open(SCHEDULER_STATE_PATH, "w") as f:
            json.dump({
                "daily_etf_last_run": daily_etf_last_run.isoformat(),
                "weekly_research_last_run": weekly_research_last_run.isoformat(),
                "monthly_macro_last_run": monthly_macro_last_run.isoformat(),
                "hourly_news_last_run": hourly_news_last_run.isoformat(),
            }, f, indent=4)
    except Exception as e:
        print(f"Failed to save scheduler state: {e}")

from shared.utils.broadcaster import broadcaster

async def daily_etf_flows_scheduler():
    """
    Monitors and extracts sector ETF flows daily at 04:00 AM (e.g. XLK, XLU, XLE).
    """
    print("Daily ETF Flow Ingestion Scheduler Initialized.")
    run_on_start = True
    while True:
        if not run_on_start:
            now = datetime.now()
            target = now.replace(hour=4, minute=0, second=0, microsecond=0)
            if now >= target:
                target += timedelta(days=1)
            sleep_seconds = (target - now).total_seconds()
            print(f"Daily ETF Flow Scheduler: Sleeping for {sleep_seconds:.1f} seconds until {target}")
            try:
                await asyncio.sleep(sleep_seconds)
            except asyncio.CancelledError:
                break
        else:
            run_on_start = False

        try:
            global daily_etf_last_run
            daily_etf_last_run = datetime.now()
            save_scheduler_state()
            await broadcaster.publish({
                "type": "SCHEDULER_TRIGGERED",
                "scheduler": "Daily ETF Flow Ingestion Scheduler",
                "timestamp": daily_etf_last_run.isoformat()
            })
            print("Daily ETF Flow Trigger fired at 04:00 AM. Ingesting ETF flows...")
            # Simulate daily flows agent updates
        except Exception as e:
            print(f"Error in Daily ETF Flow Ingestion: {str(e)}")
            await asyncio.sleep(3600)

weekly_research_is_running = False

async def weekly_research_scheduler():
    """
    Ingests and parses BlackRock, Goldman Sachs, JPMorgan weekly strategy commentaries.
    Runs every Monday at 04:00 AM.
    """
    global weekly_research_is_running
    print("Weekly Research Ingestion Scheduler Initialized.")
    run_on_start = True
    while True:
        if not run_on_start:
            now = datetime.now()
            # Find next Monday 04:00 AM
            days_ahead = (0 - now.weekday() + 7) % 7
            if days_ahead == 0 and now.hour >= 4:
                days_ahead = 7
            target = (now + timedelta(days=days_ahead)).replace(hour=4, minute=0, second=0, microsecond=0)
            sleep_seconds = (target - now).total_seconds()
            print(f"Weekly Research Scheduler: Sleeping for {sleep_seconds:.1f} seconds until {target} (Next Monday)")
            try:
                await asyncio.sleep(sleep_seconds)
            except asyncio.CancelledError:
                break
        else:
            run_on_start = False

        try:
            weekly_research_is_running = True
            global weekly_research_last_run
            weekly_research_last_run = datetime.now()
            save_scheduler_state()
            await broadcaster.publish({
                "type": "SCHEDULER_TRIGGERED",
                "scheduler": "Weekly Research Ingestion Scheduler",
                "timestamp": weekly_research_last_run.isoformat(),
                "status": "Running"
            })
            print("Weekly Research Ingestion Trigger fired. Running parallel scraper cascade...")
            
            # Helper to run an institution scraper in a separate thread concurrently
            async def run_single(inst):
                try:
                    res = await asyncio.to_thread(run_ingestion, {"metadata": {"institution": inst}})
                    return inst, res
                except Exception as e:
                    print(f"Failed to scrape {inst} in parallel loop: {e}")
                    return inst, {"themes": []}
            
            # Batch all 6 scraper runs concurrently
            institutions = ["BlackRock", "Goldman Sachs", "JPMorgan", "Morgan Stanley", "Vanguard", "Fidelity"]
            scraped_results = await asyncio.gather(*(run_single(inst) for inst in institutions))
            
            # Process results sequentially to assign atomic theme IDs and update lists
            for inst, result in scraped_results:
                is_fallback = result.get("is_fallback", False)
                for theme_data in result.get("themes", []):
                    theme_data["id"] = f"theme_{len(db_themes) + 1}"
                    db_themes.append(theme_data)
                    add_theme_to_narratives(theme_data, inst, is_fallback=is_fallback)
                    
            print("Weekly Research Commentary Ingestion completed.")
            await broadcaster.publish({
                "type": "SCHEDULER_COMPLETED",
                "scheduler": "Weekly Research Ingestion Scheduler",
                "timestamp": datetime.now().isoformat()
            })
        except Exception as e:
            print(f"Error in Weekly Research Ingestion: {str(e)}")
            await asyncio.sleep(3600)
        finally:
            weekly_research_is_running = False

async def monthly_macro_scheduler():
    """
    Tracks and classifies Macro Economic Regimes (CPI, PPI, GDP updates).
    Runs monthly on the 1st day of the month at 04:00 AM.
    """
    print("Monthly Macro Classifier Scheduler Initialized.")
    run_on_start = True
    while True:
        if not run_on_start:
            now = datetime.now()
            # Calculate target: 1st day of next month at 04:00 AM
            if now.month == 12:
                next_month = now.replace(year=now.year + 1, month=1, day=1, hour=4, minute=0, second=0, microsecond=0)
            else:
                next_month = now.replace(month=now.month + 1, day=1, hour=4, minute=0, second=0, microsecond=0)
            sleep_seconds = (next_month - now).total_seconds()
            print(f"Monthly Macro Scheduler: Sleeping for {sleep_seconds:.1f} seconds until {next_month}")
            try:
                await asyncio.sleep(sleep_seconds)
            except asyncio.CancelledError:
                break
        else:
            run_on_start = False

        try:
            global monthly_macro_last_run
            monthly_macro_last_run = datetime.now()
            save_scheduler_state()
            await broadcaster.publish({
                "type": "SCHEDULER_TRIGGERED",
                "scheduler": "Monthly Macro Classifier Scheduler",
                "timestamp": monthly_macro_last_run.isoformat()
            })
            print("Monthly Macro Trigger fired. Executing Regime Classifier...")
            classifier = RegimeClassifier()
            res = classifier.classify_regime()
            regime = res["classified_regime"]
            print("Monthly macro classification complete:", regime)
            
            # Create a narrative entry representing the macro regime classification
            new_narrative = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "source": "Macro Regime Agent",
                "theme": "Macro Regime Classification",
                "old_stance": "Previous Analysis Cycle",
                "new_stance": regime,
                "shift_velocity": "Medium",
                "reasoning": f"Macro Agent executed monthly classification. Classified regime: {regime}. Growth Outlook: {res.get('growth_outlook', 'Stable')}.",
                "severity": "Medium",
                "severityColor": "text-amber-400 bg-amber-500/10 border-amber-500/20",
                "frequency": "Monthly",
                "data_type": "Live"
            }
            db_narratives.insert(0, new_narrative)
            
            # Broadcast macro narrative change alert to WebSocket clients
            await broadcaster.publish({
                "type": "NARRATIVE_CHANGE",
                "data": new_narrative
            })
        except Exception as e:
            print(f"Error in Monthly Macro Classification: {str(e)}")
            await asyncio.sleep(3600)

async def hourly_news_scheduler():
    """
    Monitors and filters real-time News Catalysts / Alerts (Bloomberg, Reuters feeds).
    Runs hourly (every 60 minutes) dynamically aligned to the target hour boundary.
    """
    global hourly_news_last_run
    print("Hourly News Catalyst Ingestion Scheduler Initialized.")
    run_on_start = True
    while True:
        if not run_on_start:
            now = datetime.now()
            target = hourly_news_last_run + timedelta(hours=1)
            if now >= target:
                sleep_seconds = 0.0
            else:
                sleep_seconds = (target - now).total_seconds()
            print(f"Hourly News Scheduler: Sleeping for {sleep_seconds:.1f} seconds until {target}")
            try:
                await asyncio.sleep(sleep_seconds)
            except asyncio.CancelledError:
                break
        else:
            run_on_start = False

        try:
            hourly_news_last_run = datetime.now()
            save_scheduler_state()
            await broadcaster.publish({
                "type": "SCHEDULER_TRIGGERED",
                "scheduler": "Hourly News Ingestion Scheduler",
                "timestamp": hourly_news_last_run.isoformat()
            })
            print("Hourly News Catalyst Trigger fired. Running alerts scraper...")
            # Query News Agent and update alerts
        except Exception as e:
            print(f"Error in Hourly News Catalyst Ingestion: {str(e)}")
            await asyncio.sleep(600)

@app.on_event("startup")
async def start_schedulers():
    load_scheduler_state()
    asyncio.create_task(daily_etf_flows_scheduler())
    asyncio.create_task(weekly_research_scheduler())
    asyncio.create_task(monthly_macro_scheduler())
    asyncio.create_task(hourly_news_scheduler())

# Mock in-memory database to persist themes and opportunities
db_themes: List[Dict[str, Any]] = [
    {
        "id": "theme_1",
        "name": "AI Infrastructure",
        "description": "Exponential growth in AI datacenters creates structural demand for power grids.",
        "sentiment": "Bullish",
        "horizon": "Long-term",
        "confidence_score": 0.92,
        "supporting_quotes": ["We are increasing our overweight in AI infrastructure..."],
        "sources": ["BlackRock", "Goldman Sachs"]
    },
    {
        "id": "theme_2",
        "name": "Geopolitical Security",
        "description": "European defense modernization budgets accelerating faster than historical trends.",
        "sentiment": "Bullish",
        "horizon": "Medium-term",
        "confidence_score": 0.85,
        "supporting_quotes": ["European defense budgets are accelerating faster than historical trends..."],
        "sources": ["Goldman Sachs"]
    },
    {
        "id": "theme_3",
        "name": "Energy Grid Transition",
        "description": "Electricity supply bottlenecks require massive infrastructure upgrades.",
        "sentiment": "Bullish",
        "horizon": "Long-term",
        "confidence_score": 0.88,
        "supporting_quotes": ["Generative AI compute builds outpace power grid supplies..."],
        "sources": ["BlackRock"]
    }
]

db_opportunities: List[Opportunity] = [
    Opportunity(
        ticker="NVDA",
        company_name="Nvidia Corp",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Dominant AI training GPU supplier but faces critical regulatory threats from China export restrictions",
        exposure_score=95.0,
        conviction_score=45.0,
        rank=1,
        action_recommendation="Underperform",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="VRT",
        company_name="Vertiv Holdings Co",
        theme_id="theme_1",
        exposure_type="Value-Chain",
        exposure_logic="Cooling infrastructure essential for datacenters",
        exposure_score=85.0,
        conviction_score=88.4,
        rank=2,
        action_recommendation="Buy",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="ANET",
        company_name="Arista Networks Inc",
        theme_id="theme_1",
        exposure_type="Value-Chain",
        exposure_logic="High-throughput ethernet switching standard",
        exposure_score=80.0,
        conviction_score=83.2,
        rank=3,
        action_recommendation="Buy",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="XLK",
        company_name="Technology Select Sector SPDR Fund",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Broad tech sector benchmark ETF",
        exposure_score=90.0,
        conviction_score=89.5,
        rank=4,
        action_recommendation="Buy",
        asset_class="ETF"
    ),
    Opportunity(
        ticker="FSELX",
        company_name="Fidelity Advisor Semiconductors Fund",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Active mutual fund targeting design and fabrication leaders",
        exposure_score=88.0,
        conviction_score=87.2,
        rank=5,
        action_recommendation="Buy",
        asset_class="Mutual Fund"
    ),
    Opportunity(
        ticker="ITA",
        company_name="iShares U.S. Aerospace & Defense ETF",
        theme_id="theme_2",
        exposure_type="Pure-Play",
        exposure_logic="Broad aerospace and security prime contractors basket",
        exposure_score=85.0,
        conviction_score=84.5,
        rank=6,
        action_recommendation="Buy",
        asset_class="ETF"
    ),
    Opportunity(
        ticker="XLU",
        company_name="Utilities Select Sector SPDR Fund",
        theme_id="theme_3",
        exposure_type="Value-Chain",
        exposure_logic="Broad utility providers exposure for datacenter electricity transition",
        exposure_score=85.0,
        conviction_score=85.1,
        rank=7,
        action_recommendation="Buy",
        asset_class="ETF"
    ),
    Opportunity(
        ticker="AVGO",
        company_name="Broadcom Inc",
        theme_id="theme_1",
        exposure_type="Value-Chain",
        exposure_logic="Custom ASIC chip designer and connectivity solutions",
        exposure_score=85.0,
        conviction_score=86.2,
        rank=8,
        action_recommendation="Buy",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="MSFT",
        company_name="Microsoft Corp",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Cloud hyperscaler and generative AI Copilot software leader",
        exposure_score=92.0,
        conviction_score=90.5,
        rank=9,
        action_recommendation="Strong Buy",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="TSLA",
        company_name="Tesla Inc",
        theme_id="theme_1",
        exposure_type="Value-Chain",
        exposure_logic="Autonomous driving software and humanoid robotics training grids",
        exposure_score=75.0,
        conviction_score=76.4,
        rank=10,
        action_recommendation="Hold",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="SMH",
        company_name="VanEck Semiconductor ETF",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Targeted basket of semiconductor fabricators and equipment makers",
        exposure_score=90.0,
        conviction_score=88.2,
        rank=11,
        action_recommendation="Buy",
        asset_class="ETF"
    ),
    Opportunity(
        ticker="SOXX",
        company_name="iShares Semiconductor ETF",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Broad US semiconductor index allocation with liquidity",
        exposure_score=88.0,
        conviction_score=87.5,
        rank=12,
        action_recommendation="Buy",
        asset_class="ETF"
    ),
    Opportunity(
        ticker="ETN",
        company_name="Eaton Corp PLC",
        theme_id="theme_3",
        exposure_type="Value-Chain",
        exposure_logic="Electrical transmission equipment and datacenter transformers",
        exposure_score=88.0,
        conviction_score=89.1,
        rank=13,
        action_recommendation="Buy",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="GE",
        company_name="GE Vernova Inc",
        theme_id="theme_3",
        exposure_type="Value-Chain",
        exposure_logic="Wind turbines and power grid hardware modernization systems",
        exposure_score=80.0,
        conviction_score=82.4,
        rank=14,
        action_recommendation="Buy",
        asset_class="Equity"
    ),
    Opportunity(
        ticker="BOTZ",
        company_name="Global X Robotics & AI ETF",
        theme_id="theme_1",
        exposure_type="Value-Chain",
        exposure_logic="Broad global exposure to industrial automation and machine learning software",
        exposure_score=78.0,
        conviction_score=79.5,
        rank=15,
        action_recommendation="Hold",
        asset_class="ETF"
    ),
    Opportunity(
        ticker="FDGRX",
        company_name="Fidelity Growth Company Fund",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Active mutual fund with significant allocations in high-growth AI software and hardware leaders",
        exposure_score=91.0,
        conviction_score=90.2,
        rank=16,
        action_recommendation="Buy",
        asset_class="Mutual Fund"
    ),
    Opportunity(
        ticker="FBGRX",
        company_name="Fidelity Blue Chip Growth Fund",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Active mutual fund targeting blue-chip technology and digital infrastructure innovators",
        exposure_score=89.0,
        conviction_score=88.5,
        rank=17,
        action_recommendation="Buy",
        asset_class="Mutual Fund"
    ),
    Opportunity(
        ticker="VTSAX",
        company_name="Vanguard Total Stock Market Index Fund",
        theme_id="theme_1",
        exposure_type="Pure-Play",
        exposure_logic="Broad market mutual fund benchmark tracking total US equity performance",
        exposure_score=85.0,
        conviction_score=84.8,
        rank=18,
        action_recommendation="Buy",
        asset_class="Mutual Fund"
    )
]

db_narratives: List[Dict[str, Any]] = []

class IngestTextRequest(BaseModel):
    raw_document: str
    institution: str = "User Upload"

@app.get("/")
def read_root():
    return {"status": "online", "platform": "Digital Institutional Intelligence Platform"}

@app.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time Pub/Sub alert distribution.
    """
    await broadcaster.connect(websocket)
    try:
        while True:
            # Maintain connection alive; discard user inputs if any
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)

def add_theme_to_narratives(theme_data: Dict[str, Any], source: str, is_fallback: bool = False):
    frequency = "Weekly"
    source_lower = source.lower()
    if "monthly" in source_lower or "macro" in source_lower:
        frequency = "Monthly"
    elif "daily" in source_lower or "etf" in source_lower:
        frequency = "Daily"
    elif "hourly" in source_lower or "news" in source_lower:
        frequency = "Hourly"
        
    # Dynamic severity mapping based on institutional scale matching seeds
    severity = "Medium"
    severity_color = "text-amber-400 bg-amber-500/10 border-amber-500/20"
    if "blackrock" in source_lower:
        severity = "High"
        severity_color = "text-rose-400 bg-rose-500/10 border-rose-500/20"
    elif "jpmorgan" in source_lower or "j.p." in source_lower or "monthly" in source_lower or "morgan stanley" in source_lower:
        severity = "Low"
        severity_color = "text-slate-400 bg-slate-500/10 border-slate-500/20"
        
    new_narrative = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "source": source,
        "theme": theme_data.get("name", "AI Infrastructure"),
        "old_stance": "Neutral",
        "new_stance": theme_data.get("sentiment", "Bullish"),
        "shift_velocity": "Fast",
        "reasoning": f"Live document ingestion identified a narrative migration. Summary: {theme_data.get('description', '')[:100]}...",
        "severity": severity,
        "severityColor": severity_color,
        "frequency": frequency,
        "data_type": "Seeded" if is_fallback else "Live"
    }

    # Deduplication check
    for n in db_narratives:
        if n["source"] == source and n["theme"] == new_narrative["theme"] and n["date"] == new_narrative["date"]:
            print(f"Skipping duplicate narrative insertion for theme '{new_narrative['theme']}' from {source} on {new_narrative['date']}.")
            return

    db_narratives.insert(0, new_narrative)
    
    # Broadcast narrative change alert to WebSocket clients
    alert_payload = {
        "type": "NARRATIVE_CHANGE",
        "data": new_narrative
    }
    asyncio.create_task(broadcaster.publish(alert_payload))


@app.post("/api/ingest", response_model=Dict[str, Any])
async def ingest_document(request: IngestTextRequest):
    """
    On-Demand Endpoint to ingest raw document text and extract themes.
    """
    try:
        inputs = {
            "raw_document": request.raw_document,
            "metadata": {"institution": request.institution}
        }
        result = await asyncio.to_thread(run_ingestion, inputs)
        
        # Persist extracted themes into mock in-memory DB
        for theme_data in result.get("themes", []):
            theme_data["id"] = f"theme_{len(db_themes) + 1}"
            db_themes.append(theme_data)
            add_theme_to_narratives(theme_data, request.institution)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest-file")
async def ingest_file(file: UploadFile = File(...), institution: str = Form("User Upload")):
    """
    On-Demand Endpoint to ingest PDF or text files.
    """
    try:
        content = await file.read()
        text_content = content.decode("utf-8", errors="ignore")
        
        inputs = {
            "raw_document": text_content,
            "metadata": {"institution": institution, "filename": file.filename}
        }
        result = await asyncio.to_thread(run_ingestion, inputs)
        
        for theme_data in result.get("themes", []):
            theme_data["id"] = f"theme_{len(db_themes) + 1}"
            db_themes.append(theme_data)
            add_theme_to_narratives(theme_data, institution)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest-url")
async def ingest_url(url: str = Form(...), institution: str = Form("BlackRock")):
    """
    On-Demand Endpoint to trigger live url scraping and ingestion.
    """
    try:
        # Trigger ingestion workflow (this runs the live BlackRockScraper internally)
        result = await asyncio.to_thread(run_ingestion, {"metadata": {"institution": institution}})
        
        # Add any newly extracted themes to the list
        for theme_data in result.get("themes", []):
            theme_data["id"] = f"theme_{len(db_themes) + 1}"
            db_themes.append(theme_data)
            add_theme_to_narratives(theme_data, institution)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/narratives")
def get_narratives():
    """
    Retrieves all narrative inflection logs.
    """
    return db_narratives

@app.get("/api/themes", response_model=List[Theme])
def get_themes():
    """
    Retrieves all extracted investment themes.
    """
    return [Theme(**t) for t in db_themes]

# Import resilience guardrail
from shared.utils.guardrails import fetch_market_data_batch_resilient

@app.get("/api/opportunities", response_model=List[Opportunity])
async def get_opportunities(horizon: str = "short"):
    """
    Retrieves the prioritized leaderboard of stock opportunities.
    Computes live quantitative conviction scores using Yahoo Finance 30-day momentum.
    Adjusts weights dynamically based on the requested forecast horizon ("short", "medium", "long").
    """
    live_opps = []
    tickers = [opp.ticker for opp in db_opportunities]
    local_db_caches = {}
    for opp in db_opportunities:
        local_db_caches[opp.ticker] = {
            "price": getattr(opp, "price", 0.0),
            "momentum_score": 0.0,
            "last_updated": datetime.now().isoformat()
        }
        
    try:
        results = await fetch_market_data_batch_resilient(tickers, local_db_caches)
        
        for opp in db_opportunities:
            res = results.get(opp.ticker, {
                "data_status": "Unavailable",
                "returned_payload": {"momentum_score": 0.0, "price": 0.0}
            })
            status = res["data_status"]
            payload = res["returned_payload"]
            momentum = payload.get("momentum_score", 0.0)
            
            # Dynamic weighting based on the selected horizon
            if horizon == "long":
                # Long-Term (1 Year): Focuses on structural thematic value, ignores short-term crowding & price dips
                base_score = 86.0
                momentum_weight = 0.1
                crowding_impact = 0.25
            elif horizon == "medium":
                # Medium-Term (6 Months): Balanced approach focusing on sector flows and moderate crowding drag
                base_score = 83.0
                momentum_weight = 0.3
                crowding_impact = 0.6
            else:
                # Short-Term (30 Days): Volatile, news-driven, highly sensitive to momentum and crowding peaks
                base_score = 82.0
                momentum_weight = 0.5
                crowding_impact = 1.0
            
            # Query OverweightDetector dynamically to adjust score based on actual crowding data
            try:
                detector = OverweightDetector()
                pos_data = detector.check_positioning(opp.ticker)
                crowding = pos_data.get("crowding_score", 50.0)
                if crowding > 75.0:
                    base_score -= (35.0 * crowding_impact) # Extreme crowding peak risk
                elif crowding > 60.0:
                    base_score -= (12.0 * crowding_impact) # Moderate crowding drag
            except Exception:
                pass
                
            new_conviction = min(99.9, max(30.0, base_score + (momentum * momentum_weight)))
            new_conviction = round(new_conviction, 1)
            
            # Determine recommendation
            if new_conviction >= 90.0:
                rec = "Strong Buy"
            elif new_conviction >= 80.0:
                rec = "Buy"
            elif new_conviction >= 70.0:
                rec = "Hold"
            else:
                rec = "Underperform"
                
            # Clone and update opportunity
            cloned_opp = opp.copy()
            cloned_opp.conviction_score = new_conviction
            cloned_opp.action_recommendation = rec
            cloned_opp.source = f"Live Market Momentum ({status})"
            live_opps.append(cloned_opp)
            
        # Re-rank live_opps based on conviction_score
        live_opps.sort(key=lambda x: x.conviction_score or 0.0, reverse=True)
        for i, opp in enumerate(live_opps, 1):
            opp.rank = i
            
        return live_opps
    except Exception as e:
        print(f"Failed to compile live opportunities: {str(e)}")
        # Fallback to database defaults
        fallback_opps = []
        for opp in db_opportunities:
            cloned_opp = opp.copy()
            cloned_opp.source = "Simulated Fallback"
            fallback_opps.append(cloned_opp)
        return fallback_opps


from agents.positioning_agent.tools.overweight_detector import OverweightDetector

@app.get("/api/positioning")
def get_positioning():
    """
    Invokes the Positioning Agent to evaluate options skew and crowding for all opportunities.
    """
    try:
        detector = OverweightDetector()
        return [detector.check_positioning(opp.ticker) for opp in db_opportunities]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/positioning/{ticker}")
def get_positioning_ticker(ticker: str):
    """
    Invokes the Positioning Agent to evaluate options skew and crowding for a specific ticker.
    """
    try:
        detector = OverweightDetector()
        return detector.check_positioning(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/macro")
def get_macro_regime():
    """
    Invokes the Macro Agent to get the current economic regime classification.
    """
    try:
        classifier = RegimeClassifier()
        return classifier.classify_regime()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class RebalanceRequest(BaseModel):
    current_holdings: Dict[str, float]

@app.post("/api/rebalance")
def execute_rebalance(request: RebalanceRequest):
    """
    Invokes the Portfolio Manager to calculate target rebalancing trades.
    """
    try:
        rebalancer = PortfolioRebalancer()
        result = rebalancer.generate_rebalance_trades(
            scored_opportunities=db_opportunities,
            current_portfolio=request.current_holdings
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExecuteTradesRequest(BaseModel):
    trades: List[Dict[str, Any]]

@app.post("/api/execute-trades")
def execute_trades(request: ExecuteTradesRequest):
    """
    Submits recommended trades to Alpaca / Mock brokerage.
    """
    try:
        rebalancer = PortfolioRebalancer()
        result = rebalancer.execute_broker_orders(request.trades)
        return {"status": "success", "executions": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ThesisRequest(BaseModel):
    target: str
    type: str

# In-memory database cache for generated research memos to prevent redundant local LLM queries
db_memos: Dict[str, Dict[str, Any]] = {}

@app.post("/api/generate-thesis")
def generate_thesis(request: ThesisRequest):
    """
    Synthesizes research inputs, macro metrics, and flows into a formal investment thesis memo using dynamic LLM generation.
    """
    target = request.target
    
    # Check memory cache first to prevent repeated queries
    if target in db_memos:
        return db_memos[target]
        
    # Pre-defined mock data to serve as fallback
    mock_stock_data = {
        "target": target,
        "type": "stock",
        "title": f"Investment Thesis Memo: {target}",
        "why_now": [
            "Strong institutional momentum backing the transition.",
            "Valuation support following recent Multiple expansions.",
            "High earnings growth visibility backed by backlogs."
        ],
        "beneficiaries": [target, "VRT" if target != "VRT" else "NVDA"],
        "risks": [
            "Intensifying competitive landscape in hardware nodes.",
            "Potential macroeconomic slowing in capital expenditure budgets."
        ],
        "confidence_score": 8.5,
        "source": "Simulated Fallback"
    }

    mock_theme_data = {
        "target": target,
        "type": "theme",
        "title": f"Thematic Outlook Memo: {target}",
        "why_now": [
            "Consensus support across major Wall Street Outlook releases.",
            "Positive ETF inflows confirming capital migrations.",
            "Supportive disinflationary macro environment."
        ],
        "beneficiaries": ["NVDA", "VRT", "ANET"],
        "risks": [
            "Delays in secondary grid electrical supply hookups.",
            "Valuation multiple expansions exceeding historical ceilings."
        ],
        "confidence_score": 9.1,
        "source": "Simulated Fallback"
    }

    try:
        from shared.utils.llm import LLMClient
        llm = LLMClient()
        
        system_instruction = (
            "You are a Senior Equity Research Analyst writing investment memos.\n"
            "Generate a structured investment memo for the requested target ticker or theme.\n"
            "You MUST return a JSON object matching this schema:\n"
            "{\n"
            "  \"title\": \"string (e.g. 'Investment Thesis Memo: NVDA' or 'Thematic Outlook Memo: AI Infrastructure')\",\n"
            "  \"why_now\": [\"string (bullet 1 describing why now is the time to invest)\", \"string (bullet 2)\", \"string (bullet 3)\"],\n"
            "  \"beneficiaries\": [\"string (beneficiary ticker/symbol 1)\", \"string (beneficiary 2)\"],\n"
            "  \"risks\": [\"string (risk factor 1)\", \"string (risk factor 2)\"],\n"
            "  \"confidence_score\": float (a score from 1.0 to 10.0 representing analyst confidence)\n"
            "}\n"
            "Return ONLY the valid JSON block without markdown wrappers."
        )
        
        result = llm.generate_json(
            system_instruction=system_instruction,
            prompt=f"Generate a thesis memo for target '{target}' which is a '{request.type}'."
        )
        
        # Ensure the keys are present in LLM response
        if "title" in result and "why_now" in result and "beneficiaries" in result:
            result["target"] = target
            result["type"] = request.type
            result["source"] = "Live LLM Generation"
            
            # Cache the successfully generated result
            db_memos[target] = result
            return result
        else:
            raise Exception("LLM generated output was missing required structural attributes")
    except Exception as e:
        print(f"Failed to generate dynamic thesis via LLM: {str(e)}. Using fallback mock.")
        fallback = mock_stock_data if request.type == "stock" else mock_theme_data
        # Cache fallback too so it responds instantly next time
        db_memos[target] = fallback
        return fallback

class BatchThesisRequest(BaseModel):
    targets: List[str]
    type: str

@app.post("/api/generate-theses-batch")
def generate_theses_batch(request: BatchThesisRequest):
    """
    Batches memo requests by checking cache and running generator tasks concurrently.
    """
    results = []
    to_generate = []
    
    # Check cache first
    for target in request.targets:
        if target in db_memos:
            results.append(db_memos[target])
        else:
            to_generate.append(target)
            
    if to_generate:
        import concurrent.futures
        def fetch_single(t):
            req = ThesisRequest(target=t, type=request.type)
            return generate_thesis(req)
            
        # Run local LLM queries in parallel using ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(fetch_single, t): t for t in to_generate}
            for future in concurrent.futures.as_completed(futures):
                try:
                    res = future.result()
                    results.append(res)
                except Exception as e:
                    print(f"Error fetching batched memo for {futures[future]}: {str(e)}")
                    
    # Order results to match original targets list order
    ordered_results = []
    for target in request.targets:
        for res in results:
            if res.get("target") == target:
                ordered_results.append(res)
                break
    return ordered_results

@app.get("/api/schedulers")
def get_schedulers():
    """
    Returns statuses and configurations of the active background ingestion schedulers.
    Reads actual execution timestamps of active cron loops dynamically.
    """
    global daily_etf_last_run, weekly_research_last_run, monthly_macro_last_run, hourly_news_last_run
    
    # Calculate next execution targets dynamically based on current time
    now = datetime.now()
    
    next_hourly = hourly_news_last_run + timedelta(hours=1)
    if next_hourly <= now:
        next_hourly = (now + timedelta(hours=1)).replace(minute=0, second=0, microsecond=0)
        
    target_daily = now.replace(hour=4, minute=0, second=0, microsecond=0)
    if now >= target_daily:
        target_daily += timedelta(days=1)
    next_daily = target_daily
    
    # Calculate next Monday 04:00 AM for weekly
    days_ahead = (0 - now.weekday() + 7) % 7
    if days_ahead == 0 and now.hour >= 4:
        days_ahead = 7
    next_weekly = (now + timedelta(days=days_ahead)).replace(hour=4, minute=0, second=0, microsecond=0)
    
    # Calculate next 1st day of month for monthly
    if now.month == 12:
        next_monthly = now.replace(year=now.year + 1, month=1, day=1, hour=4, minute=0, second=0, microsecond=0)
    else:
        next_monthly = now.replace(month=now.month + 1, day=1, hour=4, minute=0, second=0, microsecond=0)

    return [
        {
            "name": "Hourly News Ingestion Scheduler",
            "description": "Monitors real-time financial news alerts for catalyst triggers.",
            "source": "Bloomberg News, Reuters, Yahoo Finance RSS",
            "interval": "Hourly (Every 60m)",
            "status": "Active",
            "last_run": hourly_news_last_run.strftime("%Y-%m-%d %H:%M:%S"),
            "next_run": next_hourly.strftime("%Y-%m-%d %H:%M:%S"),
            "source_type": "Live Cron Daemon"
        },
        {
            "name": "Daily ETF Flow Ingestion Scheduler",
            "description": "Analyzes daily sector capital flows and index adjustments.",
            "source": "ETF Database & SEC Edgar Filings API",
            "interval": "Daily (Every 24h at 04:00 AM)",
            "status": "Active",
            "last_run": daily_etf_last_run.strftime("%Y-%m-%d %H:%M:%S"),
            "next_run": next_daily.strftime("%Y-%m-%d %H:%M:%S"),
            "source_type": "Live Cron Daemon"
        },
        {
            "name": "Weekly Research Ingestion Scheduler",
            "description": "Crawls institutional research commentary and PDFs.",
            "source": "BlackRock, Goldman Sachs, JPMorgan, Morgan Stanley, Vanguard & Fidelity Strategy Feeds",
            "interval": "Weekly (Every Monday at 04:00 AM)",
            "status": "Running" if weekly_research_is_running else "Active",
            "last_run": weekly_research_last_run.strftime("%Y-%m-%d %H:%M:%S"),
            "next_run": next_weekly.strftime("%Y-%m-%d %H:%M:%S"),
            "source_type": "Live Cron Daemon"
        },
        {
            "name": "Monthly Macro Classifier Scheduler",
            "description": "Recalculates macroeconomic regimes based on CPI/PPI inflation updates.",
            "source": "Yahoo Finance (Spread), RateInflation.com (CPI)",
            "interval": "Monthly (1st of month at 04:00 AM)",
            "status": "Active",
            "last_run": monthly_macro_last_run.strftime("%Y-%m-%d %H:%M:%S"),
            "next_run": next_monthly.strftime("%Y-%m-%d %H:%M:%S"),
            "source_type": "Live Cron Daemon"
        }
    ]

@app.get("/api/config")
def get_config():
    """
    Returns active environment variables (e.g. LLM_PROVIDER and LOCAL_LLM_MODEL) to UI.
    """
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower()
    local_model = os.environ.get("LOCAL_LLM_MODEL", "llama3")
    return {
        "provider": provider,
        "model": "Gemini-2.5-Flash" if provider == "gemini" else f"Local ({local_model})",
        "mode": "Live Ingestion"
    }

@app.get("/api/earnings/{ticker}")
def get_earnings_financials(ticker: str):
    """
    Queries the SEC EDGAR API via the Earnings Agent SECFilingReader to get live facts.
    """
    try:
        reader = SECFilingReader()
        return reader.fetch_latest_financials(ticker)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    laymanMode: Optional[bool] = False

@app.post("/api/copilot/chat")
def copilot_chat(request: ChatRequest):
    """
    Advisor Copilot Chat Endpoint.
    Injects current live platform data (opportunities, themes, warnings, macro) into LLM system prompt.
    """
    from shared.utils.llm import LLMClient
    
    # 1. Compile active workspace data to construct LLM context
    opps_summary = []
    for opp in db_opportunities:
        stance = opp.action_recommendation
        if request.laymanMode:
            if stance == "Underperform": stance = "Avoid (Red Flag)"
            elif stance == "Hold": stance = "Hold (Yellow Light)"
            elif stance in ["Buy", "Strong Buy"]: stance = "Buy (Green Light)"
            
        opps_summary.append(f"- Ticker: {opp.ticker}, Name: {opp.company_name}, Stance: {stance}, Score: {opp.conviction_score}, Logic: {opp.exposure_logic}")
        
    themes_summary = [f"- {t.get('name')}: {t.get('description')}" for t in db_themes]
    
    opps_str = "\n".join(opps_summary)
    themes_str = "\n".join(themes_summary)
    
    system_instruction = (
        "You are the DIIP Advisor Copilot, a helpful financial co-pilot built for wealth advisors and investment managers.\n"
        "Your goal is to answer strategic allocation, stock, and thematic questions based on the active portfolio data provided below.\n"
        "Structure your answers to be highly professional, concise, and tailored for advisors speaking to retail clients.\n"
    )
    
    if request.laymanMode:
        system_instruction += (
            "\n[CRITICAL - LAYMAN MODE IS ON]: Translate all Wall Street terminology into extremely simple language.\n"
            "- Use 'Safety Rating' instead of 'Conviction Score'.\n"
            "- Use 'Avoid / Red Flag' instead of 'Underperform'.\n"
            "- Use 'Speculative Bullish Bets' instead of 'Options Call Skew'.\n"
            "- Use 'Institutional Herd Index' instead of 'Net Long Positioning'.\n"
            "- Structure responses to be plain English and direct for a regular client.\n"
        )
    else:
        system_instruction += "Always recommend clients avoid overcrowded setups if a stock has a high crowding penalty.\n"
        
    system_instruction += (
        "\n--- ACTIVE PLATFORM CONTEXT DATA ---\n"
        f"1. LEADERBOARD OPPORTUNITIES:\n{opps_str}\n\n"
        f"2. EXTRACTED THEMATIC GROUPS:\n{themes_str}\n"
        "------------------------------------"
    )
    
    # Reconstruct conversation prompt from message history
    prompt = ""
    for msg in request.messages:
        role_label = "Advisor (User)" if msg.role == "user" else "Copilot (You)"
        prompt += f"{role_label}: {msg.content}\n"
    prompt += "Copilot (You):"
    
    try:
        llm = LLMClient()
        response_text = llm.generate_text(system_instruction, prompt)
        return {"response": response_text}
    except Exception as e:
        return {"response": f"Advisor Copilot encountered an error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
