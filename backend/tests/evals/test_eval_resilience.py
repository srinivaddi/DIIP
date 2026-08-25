import pytest
import time
from datetime import datetime
from shared.utils.guardrails import fetch_market_data_batch_resilient, MARKET_DATA_CACHE

@pytest.mark.asyncio
async def test_fetch_market_data_batch_resilient_caching():
    tickers = ["AAPL", "MSFT"]
    
    # Empty cache first
    MARKET_DATA_CACHE.clear()
    
    # Populate the SWR cache in-memory with warm metrics (within 5 min)
    MARKET_DATA_CACHE["AAPL"] = {
        "payload": {"price": 175.50, "momentum_score": 10.2},
        "last_updated": datetime.now()
    }
    MARKET_DATA_CACHE["MSFT"] = {
        "payload": {"price": 415.00, "momentum_score": 8.5},
        "last_updated": datetime.now()
    }
    
    local_cache_db = {}
    
    # Query within cooldown -> should resolve instantly from cache with status "Live"
    start_time = time.time()
    result = await fetch_market_data_batch_resilient(tickers, local_cache_db)
    duration = time.time() - start_time
    
    assert duration < 0.02, f"Expected cache hit duration to be near instantaneous, took {duration}s"
    assert result["AAPL"]["data_status"] == "Live"
    assert result["AAPL"]["returned_payload"]["price"] == 175.50
    assert result["MSFT"]["returned_payload"]["momentum_score"] == 8.5
