from typing import List, Dict, Any
from shared.utils.skills_engine import SkillsEngine
from shared.models.opportunity import Opportunity

class StockMapper:
    """
    Handles mapping macro themes to a list of investable stock tickers.
    """
    def __init__(self):
        self.skills_engine = SkillsEngine()

    def map_theme_to_stocks(self, theme_id: str, theme_name: str, theme_description: str) -> List[Opportunity]:
        """
        Executes the stock-mapping-skill to extract pure-play and value-chain companies.
        """
        inputs = {
            "theme_name": theme_name,
            "theme_description": theme_description
        }

        # Query LLM skill
        # Note: Since the prompt is mocked locally, this returns standard AI Grid pure plays
        result = self.skills_engine.execute_skill(
            skill_name="stock-mapping-skill",
            inputs=inputs
        )

        opportunities = []
        mapped_list = result.get("mapped_stocks", [
            # Fallback mock stocks if LLM mock results are empty or schema differs
            {"ticker": "NVDA", "company_name": "NVIDIA Corp", "exposure_type": "Pure-Play", "exposure_logic": "Dominant AI training GPU supplier", "exposure_score": 95.0},
            {"ticker": "VRT", "company_name": "Vertiv Holdings Co", "exposure_type": "Value-Chain", "exposure_logic": "Cooling infrastructure", "exposure_score": 85.0}
        ])

        for stock_data in mapped_list:
            opp = Opportunity(
                ticker=stock_data.get("ticker", "UNK"),
                company_name=stock_data.get("company_name", "Unknown Corp"),
                theme_id=theme_id,
                exposure_type=stock_data.get("exposure_type", "Value-Chain"),
                exposure_logic=stock_data.get("exposure_logic", "Aligned with theme"),
                exposure_score=stock_data.get("exposure_score", 50.0)
            )
            opportunities.append(opp)

        return opportunities

if __name__ == "__main__":
    mapper = StockMapper()
    res = mapper.map_theme_to_stocks("theme_123", "AI Infrastructure", "Compute and datacenters.")
    print(f"Mapped {len(res)} stocks.")
    for o in res:
        print(f"{o.ticker}: {o.exposure_type} ({o.exposure_score} score)")
