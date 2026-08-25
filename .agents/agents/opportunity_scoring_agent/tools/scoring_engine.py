from typing import List
from shared.models.opportunity import Opportunity
from shared.models.conviction import Conviction, ScoreBreakdown, DiscountFactor
from shared.utils.skills_engine import SkillsEngine

class ScoringEngine:
    """
    Ranks and calculates conviction/opportunity scores for mapped stocks.
    """
    def __init__(self):
        self.skills_engine = SkillsEngine()

    def score_opportunities(self, opportunities: List[Opportunity], macro_regime: str) -> List[Opportunity]:
        """
        Calculates conviction score for each stock and ranks the leaderboard list.
        """
        scored_list = []

        # Iterate through opportunities to calculate conviction scores
        for opp in opportunities:
            # Execute conviction scoring skill for each stock
            inputs = {
                "ticker": opp.ticker,
                "exposure_score": opp.exposure_score,
                "exposure_type": opp.exposure_type,
                "macro_regime": macro_regime
            }

            # Query LLM conviction scoring skill
            result = self.skills_engine.execute_skill(
                skill_name="conviction-scoring-skill",
                inputs=inputs
            )

            # Extract unified conviction score (fallback to base calculations if mock is simple)
            final_conviction = result.get("final_conviction_score", 75.0)

            # Update opportunity model
            opp.conviction_score = final_conviction
            opp.action_recommendation = "Buy" if final_conviction >= 80.0 else "Hold"
            scored_list.append(opp)

        # Sort leaderboard list by conviction score descending
        scored_list.sort(key=lambda x: x.conviction_score or 0.0, reverse=True)

        # Assign ranks
        for idx, opp in enumerate(scored_list):
            opp.rank = idx + 1

        return scored_list

if __name__ == "__main__":
    from shared.models.opportunity import Opportunity
    engine = ScoringEngine()
    test_opps = [
        Opportunity(ticker="NVDA", company_name="Nvidia", theme_id="theme_1", exposure_type="Pure-Play", exposure_logic="GPUs", exposure_score=95.0),
        Opportunity(ticker="VRT", company_name="Vertiv", theme_id="theme_1", exposure_type="Value-Chain", exposure_logic="Cooling", exposure_score=85.0)
    ]
    scored = engine.score_opportunities(test_opps, "Stable Growth")
    for o in scored:
        print(f"Rank {o.rank}: {o.ticker} - Score: {o.conviction_score} ({o.action_recommendation})")
