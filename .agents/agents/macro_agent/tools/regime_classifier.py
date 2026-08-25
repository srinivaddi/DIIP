from typing import Dict, Any
from shared.utils.skills_engine import SkillsEngine
from agents.macro_agent.tools.cpi_tool import CPITool
from agents.macro_agent.tools.rates_tool import RatesTool

class RegimeClassifier:
    """
    Combines CPI statistics and Interest Rate indicators to classify the macroeconomic regime.
    """
    def __init__(self):
        self.cpi_tool = CPITool()
        self.rates_tool = RatesTool()
        self.skills_engine = SkillsEngine()

    def classify_regime(self) -> Dict[str, Any]:
        """
        Executes tools to gather data and queries the macro agent logic to output the economic regime.
        """
        cpi_data = self.cpi_tool.fetch_latest_cpi()
        rates_data = self.rates_tool.fetch_current_rates()

        # Input payload for classification
        inputs = {
            "cpi_yoy": cpi_data["cpi_yoy_change"],
            "cpi_mom": cpi_data["cpi_mom_change"],
            "benchmark_rate": rates_data["benchmark_rate"],
            "rate_outlook": rates_data["outlook"]
        }

        # Rules-based heuristic fallback if LLM is offline, or as baseline features
        cpi_yoy = inputs["cpi_yoy"]
        if cpi_yoy > 4.0:
            regime = "High Inflation"
        elif cpi_yoy < 2.0:
            regime = "Deflationary Risk"
        else:
            regime = "Stable Inflation / Disinflation"

        # Integrate with skills engine/prompt instructions for cognitive classification
        # In a full flow, you can query a specific macro classification skill
        return {
            "macro_inputs": inputs,
            "classified_regime": regime,
            "growth_outlook": "Stable",
            "rate_action_likelihood": rates_data["fedwatch_probabilities"]
        }

if __name__ == "__main__":
    classifier = RegimeClassifier()
    print(classifier.classify_regime())
