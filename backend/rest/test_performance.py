import sys
import os
import asyncio
import time
import unittest
from datetime import datetime, timedelta

# Adjust path to import packages from root and backend
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.append(ROOT_DIR)

from shared.utils.guardrails import fetch_market_data_resilient, MARKET_DATA_CACHE

class TestPerformanceOptimizations(unittest.IsolatedAsyncioTestCase):
    async def test_swr_cache_speed_and_status(self):
        # Clear the cache before running the test
        MARKET_DATA_CACHE.clear()
        
        local_db_cache = {
            "price": 100.0,
            "momentum_score": 5.0,
            "last_updated": datetime.now().isoformat()
        }
        
        # 1. First call (Cache Miss): Should call the Yahoo Finance API (or fallback if rate limited/no network)
        t0 = time.perf_counter()
        res1 = await fetch_market_data_resilient("AAPL", local_db_cache)
        duration1 = time.perf_counter() - t0
        
        print(f"\nCache miss duration: {duration1:.4f}s, status: {res1['data_status']}")
        
        # 2. Second call (Cache Hit): Warm cache should resolve under 10ms (usually < 1ms)
        t0 = time.perf_counter()
        res2 = await fetch_market_data_resilient("AAPL", local_db_cache)
        duration2 = time.perf_counter() - t0
        
        print(f"Cache hit duration: {duration2:.4f}s, status: {res2['data_status']}")
        self.assertTrue(duration2 < 0.010, f"Cache hit took {duration2*1000:.2f}ms, which is slower than 10ms")
        self.assertEqual(res2["data_status"], "Live", "Should be Live warm cache")
        
        # 3. Simulate Stale Cache: Artificially set update time back by 6 minutes
        MARKET_DATA_CACHE["AAPL"]["last_updated"] = datetime.now() - timedelta(minutes=6)
        
        t0 = time.perf_counter()
        res3 = await fetch_market_data_resilient("AAPL", local_db_cache)
        duration3 = time.perf_counter() - t0
        
        print(f"Stale cache (SWR) duration: {duration3:.4f}s, status: {res3['data_status']}")
        self.assertTrue(duration3 < 0.010, f"SWR stale lookup took {duration3*1000:.2f}ms, which is slower than 10ms")
        self.assertEqual(res3["data_status"], "Cached_Fallback", "Should return Cached_Fallback on SWR trigger")

    async def test_concurrent_fetching(self):
        MARKET_DATA_CACHE.clear()
        tickers = ["AAPL", "MSFT", "GOOGL", "AMZN"]
        local_db_cache = {
            "price": 150.0,
            "momentum_score": 2.5,
            "last_updated": datetime.now().isoformat()
        }
        
        t0 = time.perf_counter()
        tasks = [fetch_market_data_resilient(ticker, local_db_cache) for ticker in tickers]
        results = await asyncio.gather(*tasks)
        duration = time.perf_counter() - t0
        
        print(f"\nConcurrent fetch for {len(tickers)} tickers completed in {duration:.4f}s")
        for ticker, res in zip(tickers, results):
            print(f"Ticker {ticker}: status={res['data_status']}, momentum={res['returned_payload']['momentum_score']}")
            self.assertIn("data_status", res)
            self.assertIn("returned_payload", res)

    async def test_batch_fetching(self):
        MARKET_DATA_CACHE.clear()
        tickers = ["AAPL", "MSFT", "GOOGL", "AMZN"]
        local_db_caches = {}
        for ticker in tickers:
            local_db_caches[ticker] = {
                "price": 100.0,
                "momentum_score": 5.0,
                "last_updated": datetime.now().isoformat()
            }
            
        t0 = time.perf_counter()
        from shared.utils.guardrails import fetch_market_data_batch_resilient
        results = await fetch_market_data_batch_resilient(tickers, local_db_caches)
        duration = time.perf_counter() - t0
        
        print(f"\nSingle-Batch fetch for {len(tickers)} tickers completed in {duration:.4f}s")
        for ticker in tickers:
            res = results[ticker]
            print(f"Batch Ticker {ticker}: status={res['data_status']}, price={res['returned_payload']['price']}, momentum={res['returned_payload']['momentum_score']}")
            self.assertIn("data_status", res)
            self.assertIn("returned_payload", res)

if __name__ == "__main__":
    unittest.main()
