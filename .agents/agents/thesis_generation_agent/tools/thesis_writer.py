from typing import List
from shared.models.theme import Theme
from shared.models.opportunity import Opportunity
from shared.models.thesis import Thesis, AssetAllocation
from shared.utils.skills_engine import SkillsEngine

class ThesisWriter:
    """
    Synthesizes active themes and scored stock opportunities into analyst memos.
    """
    def __init__(self):
        self.skills_engine = SkillsEngine()

    def generate_thesis(self, theme: Theme, ranked_opportunities: List[Opportunity]) -> Thesis:
        """
        Runs the thesis-generation-skill to output a formatted investment thesis.
        """
        # Format input contexts
        thematic_context = {
            "name": theme.name,
            "description": theme.description,
            "sentiment": theme.sentiment,
            "sources": theme.sources
        }

        mapped_stocks = [
            {
                "ticker": opp.ticker,
                "company_name": opp.company_name,
                "exposure_type": opp.exposure_type,
                "exposure_score": opp.exposure_score,
                "conviction_score": opp.conviction_score,
                "action": opp.action_recommendation
            }
            for opp in ranked_opportunities
        ]

        inputs = {
            "thematic_context": thematic_context,
            "mapped_stocks": mapped_stocks,
            "average_conviction": sum(o.conviction_score or 0 for o in ranked_opportunities) / (len(ranked_opportunities) or 1)
        }

        # Query LLM thesis-generation-skill
        result = self.skills_engine.execute_skill(
            skill_name="thesis-generation-skill",
            inputs=inputs
        )

        # Build list of asset allocation mappings
        allocations = []
        for opp in ranked_opportunities[:3]: # recommend top 3 holdings
            allocations.append(AssetAllocation(
                ticker=opp.ticker,
                allocation_rationale=opp.exposure_logic,
                weight=10.0 if opp.action_recommendation == "Buy" else 5.0
            ))

        # Instantiate Pydantic Thesis model
        thesis = Thesis(
            title=result.get("title", f"Investment Thesis: {theme.name}"),
            theme_id=theme.id or "unknown_theme_id",
            executive_summary=result.get("executive_summary", f"Thematic opportunity around {theme.name}."),
            detailed_markdown=result.get("investment_thesis", f"# Thesis: {theme.name}\nGenerated analysis details."),
            selected_assets=allocations,
            conviction_score=inputs["average_conviction"],
            key_risks=result.get("key_risks", ["Macro headwinds", "Valuation limits"])
        )

        return thesis

if __name__ == "__main__":
    writer = ThesisWriter()
    t = Theme(name="AI Infrastructure", description="Power compute transition.", sentiment="Bullish", sources=["BlackRock"])
    t.id = "theme_1"
    o = [
        Opportunity(ticker="NVDA", company_name="Nvidia", theme_id="theme_1", exposure_type="Pure-Play", exposure_logic="GPUs", exposure_score=95.0, conviction_score=92.5, action_recommendation="Strong Buy")
    ]
    res = writer.generate_thesis(t, o)
    print(f"Generated Thesis Memo: {res.title}")
    print(f"Summary: {res.executive_summary}")
