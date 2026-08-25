import requests
from typing import Dict, Any, List

class OverweightDetector:
    """
    Evaluates options skew, short interest, and CFTC allocations to determine if institutional allocation is crowded.
    """
    def check_positioning(self, ticker: str) -> Dict[str, Any]:
        """
        Simulates checking options skew and short interest.
        Returns a crowding classification regime.
        """
        # Mock database of institutional positioning metrics
        mock_positioning = {
            "NVDA": {
                "options_call_skew_pct": 85.0,  # Extremely high call skew
                "short_interest_pct": 1.2,      # Very low short interest
                "cftc_institutional_net_long": 78.0,
                "crowding_regime": "Crowded"
            },
            "VRT": {
                "options_call_skew_pct": 60.0,
                "short_interest_pct": 3.4,
                "cftc_institutional_net_long": 62.0,
                "crowding_regime": "Neutral"
            }
        }

        data = mock_positioning.get(ticker, {
            "options_call_skew_pct": 50.0,
            "short_interest_pct": 5.0,
            "cftc_institutional_net_long": 50.0,
            "crowding_regime": "Under-allocated"
        })

        # Calculate a crowding score (0-100)
        crowding_score = (data["options_call_skew_pct"] * 0.5) + (data["cftc_institutional_net_long"] * 0.5)

        return {
            "ticker": ticker,
            "crowding_score": crowding_score,
            "crowding_regime": data["crowding_regime"],
            "short_interest_ratio": data["short_interest_pct"],
            "action_warning": "High Crowding Risk" if crowding_score > 75.0 else "Normal positioning limits"
        }

if __name__ == "__main__":
    detector = OverweightDetector()
    print(detector.check_positioning("NVDA"))
    print(detector.check_positioning("VRT"))
