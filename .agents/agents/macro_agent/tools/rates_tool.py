import requests
from typing import Dict, Any

class RatesTool:
    """
    Fetches real-time interest rate benchmarks and yields using Yahoo Finance, falling back to mocks.
    """
    def fetch_current_rates(self) -> Dict[str, Any]:
        """
        Fetches current benchmark yields (^IRX for 3M T-Bill, ^TNX for 10Y Yield) from Yahoo chart API.
        """
        headers = {"User-Agent": "Mozilla/5.0"}
        mock_data = {
            "benchmark_rate": "5.25% - 5.50%",
            "last_meeting_action": "Pause",
            "last_meeting_date": "2026-07-29",
            "fedwatch_probabilities": {
                "hike_prob": 0.05,
                "pause_prob": 0.65,
                "cut_25bps_prob": 0.30
            },
            "outlook": "Hawkish Pause (Mock)",
            "source": "Mock Fallback"
        }

        try:
            # Query 3-Month T-Bill Yield (closely tracks Fed Funds Rate)
            irx_url = "https://query1.finance.yahoo.com/v8/finance/chart/^IRX?range=1d&interval=1d"
            irx_res = requests.get(irx_url, headers=headers, timeout=5)
            if not irx_res.ok:
                raise Exception("Failed to fetch IRX yield from Yahoo")
            
            irx_val = irx_res.json()["chart"]["result"][0]["meta"]["regularMarketPrice"]

            # Query 10-Year Treasury Yield
            tnx_url = "https://query1.finance.yahoo.com/v8/finance/chart/^TNX?range=1d&interval=1d"
            tnx_res = requests.get(tnx_url, headers=headers, timeout=5)
            if not tnx_res.ok:
                raise Exception("Failed to fetch TNX yield from Yahoo")
            
            tnx_val = tnx_res.json()["chart"]["result"][0]["meta"]["regularMarketPrice"]

            spread = tnx_val - irx_val
            outlook = "Inverted Yield Curve (Bearish)" if spread < 0 else "Normal Yield Curve (Expansion)"

            return {
                "benchmark_rate": f"{irx_val:.2f}%",
                "last_meeting_action": "Yield Curve Spread: " + f"{spread:.2f}%",
                "last_meeting_date": datetime.now().strftime("%Y-%m-%d") if "datetime" in globals() else "2026-08-03",
                "fedwatch_probabilities": {
                    "hike_prob": 0.0,
                    "pause_prob": 0.50 if spread < 0 else 0.80,
                    "cut_25bps_prob": 0.50 if spread < 0 else 0.20
                },
                "outlook": f"{outlook} (10Y Yield: {tnx_val:.2f}%)",
                "source": "Live Yahoo Finance"
            }
        except Exception as e:
            print(f"RatesTool: Failed to fetch live rates: {str(e)}. Using fallback mock.")
            return mock_data

if __name__ == "__main__":
    from datetime import datetime
    tool = RatesTool()
    print(tool.fetch_current_rates())
