import pytest
from shared.utils.guardrails import (
    verify_trading_compliance,
    sanitize_ingestion_url,
    validate_llm_memos,
    IngestionGuardrailException
)

# 1. Test Trading and Allocation compliance guardrail
def test_trading_compliance_caps():
    mock_portfolio = {
        "NVDA": 10.0,  # 10% allocation
        "VRT": 5.0
    }
    
    # Violates target stock cap limit (25%) and trade size cap limit (15%)
    trades = [
        {"ticker": "NVDA", "action": "BUY", "trade_size_pct": 20.0, "target_weight_pct": 30.0}
    ]
    
    result = verify_trading_compliance(
        trades, 
        mock_portfolio, 
        max_single_stock_weight=0.25, 
        max_single_trade_size=0.15
    )
    
    assert result["compliance_status"] == "Flagged"
    assert len(result["violations"]) == 1 # Only weight limit is violated; trade size recalculates to exactly 15%
    assert result["validated_trades"][0]["target_weight_pct"] == 25.0 # Capped
    assert result["validated_trades"][0]["trade_size_pct"] == 15.0 # Truncated

# 2. Test Ingestion SSRF protections
def test_sanitize_ingestion_url_ssrf():
    # Public URLs should pass
    assert sanitize_ingestion_url("https://www.google.com") == "https://www.google.com"
    
    # Localhost, Loopback, and Private IPs should fail
    with pytest.raises(IngestionGuardrailException):
        sanitize_ingestion_url("http://127.0.0.1:8000/info")
        
    with pytest.raises(IngestionGuardrailException):
        sanitize_ingestion_url("http://10.0.0.15/meta")

# 3. Test LLM Memo Redactions based on Clearance Level
def test_validate_llm_memos_clearance():
    raw_memo = {
        "title": "NVDA Investment Thesis",
        "thesis_summary": "price target $135. Private pricing metrics suggest large hedge fund long positions.",
        "clearance_required": "Level-2"
    }
    
    # Level-1 users should have sensitive price targets and private terms redacted
    cleaned = validate_llm_memos(raw_memo, clearance_level="Level-1")
    assert "[REDACTED FOR LEVEL-1 SECURITY]" in cleaned["thesis_summary"]
