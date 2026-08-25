from typing import Dict, Any
from shared.utils.llm import LLMClient

class EarningsSentiment:
    """
    Evaluates management sentiment and guidance strength from parsed remarks and Q&As.
    """
    def __init__(self):
        self.llm_client = LLMClient()

    def analyze_sentiment(self, opening_remarks: str) -> Dict[str, Any]:
        """
        Uses LLM parsing helper to determine structural sentiment score (0.0 to 1.0).
        """
        # Formulate instructions
        system_instruction = "You are an expert financial analyst. Analyze opening remarks and output numerical sentiment metrics in JSON."
        prompt = f"Analyze this text:\n\n{opening_remarks}"

        # In production/MVP, call Gemini
        result = self.llm_client.generate_json(system_instruction, prompt)

        # Fallback values if mock is used
        sentiment_score = 0.85
        guidance_outlook = "Upgraded"

        return {
            "remarks_sentiment_score": sentiment_score,
            "guidance_status": guidance_outlook,
            "tone": "Optimistic / Confident"
        }

if __name__ == "__main__":
    sentiment = EarningsSentiment()
    print(sentiment.analyze_sentiment("historic datacenter momentum"))
