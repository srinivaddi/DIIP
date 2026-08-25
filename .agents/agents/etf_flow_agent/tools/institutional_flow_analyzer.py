from typing import Dict, Any, List
from agents.etf_flow_agent.tools.etf_flow_fetcher import ETFFlowFetcher

class InstitutionalFlowAnalyzer:
    """
    Analyzes ETF flow trends to extract directional institutional capital signals.
    """
    def __init__(self):
        self.fetcher = ETFFlowFetcher()

    def analyze_capital_flows(self, sectors: List[str]) -> Dict[str, Any]:
        """
        Maps sectors to underlying ETFs and determines if institutional capital is allocating.
        """
        sector_to_etf = {
            "Technology": "XLK",
            "Utilities": "XLU",
            "Energy": "XLE",
            "Financials": "XLF"
        }

        target_etfs = [sector_to_etf[s] for s in sectors if s in sector_to_etf]
        flows_data = self.fetcher.fetch_flows(target_etfs)

        signals = {}
        for sector, etf in sector_to_etf.items():
            if etf in flows_data:
                flow_val = flows_data[etf]["net_flow_30d"]
                if flow_val > 500.0:
                    stance = "Strong Accumulation"
                elif flow_val > 0.0:
                    stance = "Weak Accumulation"
                elif flow_val < -500.0:
                    stance = "Strong Distribution"
                else:
                    stance = "Weak Distribution"
                
                signals[sector] = {
                    "etf": etf,
                    "stance": stance,
                    "net_flow_30d": flow_val
                }

        return {
            "flow_signals": signals,
            "overall_regime": "Risk-On" if flows_data.get("XLK", {}).get("net_flow_30d", 0) > 0 else "Risk-Off"
        }

if __name__ == "__main__":
    analyzer = InstitutionalFlowAnalyzer()
    print(analyzer.analyze_capital_flows(["Technology", "Utilities", "Energy"]))
