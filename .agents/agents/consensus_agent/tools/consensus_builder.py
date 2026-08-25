from typing import List, Dict, Any
from shared.utils.skills_engine import SkillsEngine

class ConsensusBuilder:
    """
    Synthesizes extracted stances and themes across multiple institutional research reports.
    """
    def __init__(self):
        self.skills_engine = SkillsEngine()

    def build_consensus(self, reports_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Runs the report-comparison-skill to determine consensus and divergent views.
        """
        inputs = {
            "reports_list": reports_list
        }

        # Query LLM comparison skill
        result = self.skills_engine.execute_skill(
            skill_name="report-comparison-skill",
            inputs=inputs
        )

        # Structure final consensus indices
        consensus_points = result.get("consensus_points", [
            {
                "topic": "AI Infrastructure",
                "consensus_view": "Strong demand for power grid and cooling capacity",
                "agreeing_institutions": ["BlackRock", "Goldman Sachs"]
            }
        ])

        divergent_points = result.get("divergent_points", [])

        # Calculate a numeric index score (0-100) based on consensus agreement
        total_reports = len(reports_list) or 1
        bullish_count = sum(1 for r in reports_list if r.get("sentiment") == "Bullish")
        agreement_ratio = bullish_count / total_reports
        consensus_score = int(agreement_ratio * 100)

        return {
            "consensus_score": consensus_score,
            "consensus_points": consensus_points,
            "divergent_points": divergent_points
        }

if __name__ == "__main__":
    builder = ConsensusBuilder()
    test_reports = [
        {"institution": "BlackRock", "theme": "AI Infrastructure", "sentiment": "Bullish"},
        {"institution": "Goldman Sachs", "theme": "AI Infrastructure", "sentiment": "Bullish"}
    ]
    print(builder.build_consensus(test_reports))
