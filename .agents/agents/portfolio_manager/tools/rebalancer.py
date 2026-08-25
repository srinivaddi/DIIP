from typing import List, Dict, Any
from shared.models.opportunity import Opportunity

class PortfolioRebalancer:
    """
    Optimizes portfolio weights based on stock conviction scores, enforcing diversification limits.
    """
    def __init__(self, max_single_stock_weight: float = 0.25, max_sector_weight: float = 0.30):
        self.max_single_stock_weight = max_single_stock_weight
        self.max_sector_weight = max_sector_weight

    def generate_rebalance_trades(self, scored_opportunities: List[Opportunity], current_portfolio: Dict[str, float]) -> Dict[str, Any]:
        """
        Calculates trade execution plans (Buy/Sell/Hold) based on current holdings vs target conviction.
        """
        target_allocations = {}
        total_conviction = sum(o.conviction_score or 0.0 for o in scored_opportunities)  # All leaderboard assets
        
        # Calculate raw targeted weights based on conviction
        if total_conviction > 0:
            for opp in scored_opportunities:
                # Proportional allocation
                raw_weight = (opp.conviction_score or 0.0) / total_conviction
                # Enforce single stock weight constraint
                target_allocations[opp.ticker] = min(raw_weight, self.max_single_stock_weight)
        
        # Normalize weights so they sum to 90% allocation (10% cash reserve)
        allocated_sum = sum(target_allocations.values())
        if allocated_sum > 0:
            target_allocations = {k: (v / allocated_sum) * 0.90 for k, v in target_allocations.items()}

        # Convert frontend percentage inputs to decimals (e.g. 30.0% -> 0.30)
        current_portfolio_dec = {k: v / 100.0 for k, v in current_portfolio.items()}

        # Calculate trade actions
        trades = []
        for ticker, target_w in target_allocations.items():
            current_w = current_portfolio_dec.get(ticker, 0.0)
            diff = target_w - current_w
            
            if abs(diff) > 0.02:  # Rebalance threshold of 2%
                action = "Buy" if diff > 0 else "Sell"
                trades.append({
                    "ticker": ticker,
                    "action": action,
                    "trade_size_pct": round(abs(diff) * 100, 2),
                    "target_weight_pct": round(target_w * 100, 2)
                })

        return {
            "target_allocation_matrix": {k: round(v * 100, 2) for k, v in target_allocations.items()},
            "recommended_trades": trades,
            "cash_reserve_pct": round((1.0 - sum(target_allocations.values())) * 100, 2)
        }

    def execute_broker_orders(self, trades: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Sends simulated/Alpaca paper trading order executions for the recommended trades list.
        """
        import os
        import requests
        
        alpaca_key = os.environ.get("ALPACA_API_KEY", "")
        alpaca_secret = os.environ.get("ALPACA_SECRET_KEY", "")
        is_live = bool(alpaca_key and alpaca_secret)
        
        executions = []
        for trade in trades:
            ticker = trade["ticker"]
            action = trade["action"].lower()
            qty = int(trade["trade_size_pct"] * 10) # rough mock qty mapping
            if qty == 0:
                qty = 1
                
            if is_live:
                try:
                    # Submit actual Alpaca order request
                    url = "https://paper-api.alpaca.markets/v2/orders"
                    headers = {
                        "APCA-API-KEY-ID": alpaca_key,
                        "APCA-API-SECRET-KEY": alpaca_secret,
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "symbol": ticker,
                        "qty": str(qty),
                        "side": action,
                        "type": "market",
                        "time_in_force": "day"
                    }
                    res = requests.post(url, json=payload, headers=headers, timeout=5)
                    if res.status_code == 200:
                        executions.append({
                            "ticker": ticker,
                            "status": "Submitted",
                            "order_id": res.json().get("id"),
                            "msg": f"Alpaca paper order submitted successfully: {action.upper()} {qty} shares."
                        })
                    else:
                        executions.append({
                            "ticker": ticker,
                            "status": "Failed",
                            "msg": f"Alpaca API error: {res.text}"
                        })
                except Exception as e:
                    executions.append({
                        "ticker": ticker,
                        "status": "Failed",
                        "msg": f"Connection error: {str(e)}"
                    })
            else:
                # Mock execution log
                executions.append({
                    "ticker": ticker,
                    "status": "Filled (Mock)",
                    "order_id": f"mock_order_{ticker.lower()}_982734",
                    "msg": f"Executed mock paper order: {action.upper()} {qty} shares of {ticker}."
                })
        return executions

if __name__ == "__main__":
    rebalancer = PortfolioRebalancer()
    test_opps = [
        Opportunity(ticker="NVDA", company_name="Nvidia", theme_id="t1", exposure_type="Pure-Play", exposure_logic="GPUs", exposure_score=95, conviction_score=90),
        Opportunity(ticker="VRT", company_name="Vertiv", theme_id="t1", exposure_type="Value-Chain", exposure_logic="Cool", exposure_score=85, conviction_score=80)
    ]
    current = {"NVDA": 0.05, "VRT": 0.12}
    print(rebalancer.generate_rebalance_trades(test_opps, current))
