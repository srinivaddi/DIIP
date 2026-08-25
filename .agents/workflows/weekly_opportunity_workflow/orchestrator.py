# weekly_opportunity_workflow Orchestrator
import os
import sys
from typing import Dict, Any

# Adjust search path to allow root-level and .agents imports
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.append(ROOT_DIR)
sys.path.append(os.path.join(ROOT_DIR, ".agents"))

from shared.models.theme import Theme
from agents.macro_agent.tools.regime_classifier import RegimeClassifier
from agents.opportunity_scoring_agent.tools.stock_mapper import StockMapper
from agents.opportunity_scoring_agent.tools.scoring_engine import ScoringEngine
from agents.thesis_generation_agent.tools.thesis_writer import ThesisWriter
from agents.portfolio_manager.tools.rebalancer import PortfolioRebalancer
from agents.alert_agent.tools.email_formatter import EmailFormatter
from agents.alert_agent.tools.slack_formatter import SlackFormatter

def run(inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the Weekly Opportunity & Portfolio Rebalancing Workflow:
    1. Evaluates macro economic regime.
    2. Maps target theme to stock universe.
    3. Scores and ranks stocks.
    4. Generates analyst thesis memo.
    5. Calculates rebalancing target trades.
    6. Sends alerts.
    """
    print("Starting Weekly Opportunity Workflow...")

    # Inputs or fallback mock context theme
    target_theme = inputs.get("theme", Theme(
        id="theme_1",
        name="AI Infrastructure",
        description="Exponential growth in AI datacenters and power grid demand.",
        sentiment="Bullish",
        sources=["BlackRock"]
    ))

    current_holdings = inputs.get("current_holdings", {"NVDA": 0.05, "VRT": 0.12})

    # 1. Evaluate macro economic regime
    print("Step 1: Classifying macro economic regime...")
    macro_classifier = RegimeClassifier()
    macro_res = macro_classifier.classify_regime()
    regime = macro_res["classified_regime"]
    print(f"Current Regime: {regime}")

    # 2. Map theme to stock universe
    print("Step 2: Mapping stocks for theme...")
    stock_mapper = StockMapper()
    mapped_stocks = stock_mapper.map_theme_to_stocks(
        theme_id=target_theme.id,
        theme_name=target_theme.name,
        theme_description=target_theme.description
    )
    print(f"Mapped {len(mapped_stocks)} securities.")

    # 3. Score and rank opportunities
    print("Step 3: Scoring opportunities...")
    scoring_engine = ScoringEngine()
    ranked_opps = scoring_engine.score_opportunities(mapped_stocks, regime)
    for o in ranked_opps:
        print(f" - {o.ticker}: Score={o.conviction_score}, Action={o.action_recommendation}")

    # 4. Generate analyst thesis memo
    print("Step 4: Writing thesis memo...")
    thesis_writer = ThesisWriter()
    thesis_memo = thesis_writer.generate_thesis(target_theme, ranked_opps)
    print(f"Thesis Generated: {thesis_memo.title}")

    # 5. Calculate portfolio rebalancing targets
    print("Step 5: Generating portfolio rebalance recommendations...")
    rebalancer = PortfolioRebalancer()
    rebalance_results = rebalancer.generate_rebalance_trades(ranked_opps, current_holdings)
    print(f"Recommended Trades count: {len(rebalance_results['recommended_trades'])}")

    # 6. Format and trigger alerts
    print("Step 6: Formatting alert notifications...")
    slack_fmt = SlackFormatter()
    email_fmt = EmailFormatter()

    top_opportunity = ranked_opps[0] if ranked_opps else None
    if top_opportunity:
        alert_payload = {
            "ticker": top_opportunity.ticker,
            "headline": f"Leaderboard update: {top_opportunity.ticker} ranked #1 with {top_opportunity.conviction_score} conviction.",
            "category": "Weekly Rebalance Alert",
            "severity_level": "Medium",
            "action_recommended": top_opportunity.action_recommendation
        }
        
        slack_blocks = slack_fmt.format_blocks(alert_payload)
        email_html = email_fmt.format_html(alert_payload)
        print("Alerts formatted successfully.")
    else:
        slack_blocks = {}
        email_html = ""

    return {
        "status": "success",
        "macro_regime": regime,
        "thesis": thesis_memo.dict(),
        "rebalance_plan": rebalance_results,
        "slack_alert": slack_blocks,
        "email_alert_preview": email_html[:200] + "..." # truncate for view logs
    }

if __name__ == "__main__":
    result = run({})
