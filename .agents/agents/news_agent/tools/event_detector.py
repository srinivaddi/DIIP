from typing import List, Dict, Any
from shared.utils.llm import LLMClient

class EventDetector:
    """
    Detects market-moving catalysts (e.g. M&A, regulatory bans) from scraped news text.
    """
    def __init__(self):
        self.llm_client = LLMClient()

    def detect_catalysts(self, articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes news article texts using LLM guidelines to classify critical risk catalysts.
        """
        detected_catalysts = []
        for article in articles:
            # Query LLM or rule-based triggers
            headline = article["headline"].lower()
            
            # Simple rule filter combined with mock LLM logic
            if "restrict" in headline or "export cap" in headline or "ban" in headline:
                category = "Regulatory Risk Trigger"
                severity = "High"
            elif "expand" in headline or "capacity" in headline or "acquisition" in headline:
                category = "Expansion Catalyst"
                severity = "Medium"
            else:
                category = "General Business Update"
                severity = "Low"

            detected_catalysts.append({
                "ticker": article["ticker"],
                "headline": article["headline"],
                "source": article["source"],
                "category": category,
                "severity_level": severity,
                "action_recommended": "Alert Immediately" if severity == "High" else "Monitor"
            })
            
        return detected_catalysts

if __name__ == "__main__":
    detector = EventDetector()
    sample_news = [
        {"ticker": "NVDA", "headline": "Nvidia faces new export caps on advanced H20 chips", "source": "Bloomberg"}
    ]
    print(detector.detect_catalysts(sample_news))
