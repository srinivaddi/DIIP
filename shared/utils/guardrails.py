import os
import socket
from urllib.parse import urlparse
from typing import List, Dict, Any, Optional

class TradingGuardrailException(Exception):
    pass

class IngestionGuardrailException(Exception):
    pass

# =====================================================================
# 1. Trading & Execution Guardrail
# =====================================================================
def verify_trading_compliance(trades: List[Dict[str, Any]], current_portfolio: Dict[str, float], max_single_stock_weight: float = 0.25, max_single_trade_size: float = 0.15) -> Dict[str, Any]:
    """
    Enforces maximum allocation caps and trade sizes on recommended broker orders.
    """
    violations = []
    validated_trades = []
    
    for trade in trades:
        ticker = trade["ticker"]
        action = trade["action"]
        trade_size = trade.get("trade_size_pct", 0.0) / 100.0
        target_weight = trade.get("target_weight_pct", 0.0) / 100.0
        
        # Rule 1: Single Stock Cap
        if target_weight > max_single_stock_weight:
            violations.append(f"{ticker} target weight {target_weight*100}% exceeds cap of {max_single_stock_weight*100}%. Capping target weight.")
            target_weight = max_single_stock_weight
            # Recalculate adjusted trade size based on capped target weight
            current_w = current_portfolio.get(ticker, 0.0) / 100.0
            trade_size = abs(target_weight - current_w)
            
        # Rule 2: Trade Size Cap
        if trade_size > max_single_trade_size:
            violations.append(f"{ticker} trade size {trade_size*100}% violates maximum trade limit of {max_single_trade_size*100}%. Truncating trade size.")
            trade_size = max_single_trade_size
            
        validated_trades.append({
            "ticker": ticker,
            "action": action,
            "trade_size_pct": round(trade_size * 100, 2),
            "target_weight_pct": round(target_weight * 100, 2),
            "needs_authorization": True
        })
        
    return {
        "compliance_status": "Flagged" if violations else "Approved",
        "violations": violations,
        "validated_trades": validated_trades
    }

# =====================================================================
# 2. Ingestion & Scraper Guardrail (SSRF protection)
# =====================================================================
def sanitize_ingestion_url(url: str, allowed_schemes=("http", "https")) -> str:
    """
    Sanitizes URL inputs to block Loopback, Link-Local, and Private IP blocks (SSRF).
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme not in allowed_schemes:
            raise IngestionGuardrailException(f"Unsupported URI scheme: {parsed.scheme}")
            
        hostname = parsed.hostname
        if not hostname:
            raise IngestionGuardrailException("Invalid hostname parsed from URL")
            
        # Resolve hostname to check IP block rules
        ip_address = socket.gethostbyname(hostname)
        
        # Block Private & Loopback IP ranges
        if (ip_address.startswith("127.") or 
            ip_address.startswith("10.") or 
            ip_address.startswith("192.168.") or 
            ip_address.startswith("172.16.") or
            ip_address.startswith("169.254.")):
            raise IngestionGuardrailException(f"Blocked SSRF Target IP Address: {ip_address}")
            
        return url
    except Exception as e:
        raise IngestionGuardrailException(f"Ingestion URL verification failed: {str(e)}")

# =====================================================================
# 3. LLM Output & Generation Guardrail
# =====================================================================
def validate_llm_memos(raw_memo: Dict[str, Any], clearance_level: str) -> Dict[str, Any]:
    """
    Cleanses and redacts LLM generated findings based on Security Clearance level.
    """
    cleaned_memo = raw_memo.copy()
    
    # Rule 1: Redaction check for Level-1 clearances
    if clearance_level == "Level-1":
        # Redact/Simplify detailed catalyst descriptions or private metrics
        if "thesis_summary" in cleaned_memo:
            # Strip target price predictions
            import re
            cleaned_memo["thesis_summary"] = re.sub(
                r"\b(target|price target|buy target)\s*(of)?\s*\$?\d+(\.\d+)?",
                "[REDACTED FOR LEVEL-1 SECURITY]",
                cleaned_memo["thesis_summary"],
                flags=re.IGNORECASE
            )
            
    # Rule 2: Force compliance disclosures
    disclaimer = "DISCLAIMER: Educational thesis memo. All calculations are simulated and do not represent formal investment advisory recommendations."
    cleaned_memo["regulatory_disclaimer"] = disclaimer
    
    return cleaned_memo


# =====================================================================
# 4. Market Data & API Fallback Guardrail (SWR & Exponential Backoff)
# =====================================================================
import time
import httpx
import asyncio
import logging

logger = logging.getLogger("MarketDataGuardrail")

# In-memory cache for SWR
# Structure: { ticker: { "payload": Dict, "last_updated": datetime } }
MARKET_DATA_CACHE = {}

async def fetch_market_data_resilient(
    ticker: str, 
    local_db_cache: Dict[str, Any], 
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Fetches live market data from Yahoo Finance with outage recovery, 
    exponential backoff retries, and stale-while-revalidate caching.
    """
    from datetime import datetime
    
    headers = {"User-Agent": "Mozilla/5.0"}
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=30d&interval=1d"
    
    now = datetime.now()
    cache_entry = MARKET_DATA_CACHE.get(ticker)
    
    # 1. Warm Cache Check (within 5 minutes / 300 seconds)
    if cache_entry and (now - cache_entry["last_updated"]).total_seconds() < 300:
        return {
            "data_status": "Live",
            "returned_payload": cache_entry["payload"],
            "retry_attempts": 0
        }
        
    # Helper async function to perform the actual fetch with backoff
    async def perform_fetch_with_backoff() -> Optional[Dict[str, Any]]:
        delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers, timeout=2.0)
                    
                    if response.status_code in [429, 503]:
                        logger.warning(f"Rate limit / Service unavailable ({response.status_code}) for {ticker}. Retrying in {delay}s (Attempt {attempt}/{max_retries}).")
                        await asyncio.sleep(delay)
                        delay *= 2.0
                        continue
                        
                    response.raise_for_status()
                    chart_data = response.json()["chart"]["result"][0]
                    prices = chart_data["indicators"]["quote"][0]["close"]
                    valid_prices = [p for p in prices if p is not None]
                    
                    if len(valid_prices) > 1:
                        latest = valid_prices[-1]
                        prior = valid_prices[0]
                        momentum = round(((latest - prior) / prior) * 100, 2)
                        
                        payload = {
                            "price": round(latest, 2),
                            "momentum_score": momentum,
                            "last_updated": datetime.now().isoformat()
                        }
                        # Update global cache
                        MARKET_DATA_CACHE[ticker] = {
                            "payload": payload,
                            "last_updated": datetime.now()
                        }
                        return payload
            except Exception as e:
                logger.error(f"Error fetching market data for {ticker} (Attempt {attempt}/{max_retries}): {str(e)}")
                if attempt < max_retries:
                    await asyncio.sleep(delay)
                    delay *= 2.0
        return None

    # 2. Stale-While-Revalidate Trigger
    if cache_entry:
        # Cache is cold (> 5 mins), trigger background task to revalidate, return cached value immediately
        logger.info(f"Cache cold for {ticker}. Triggering background revalidation.")
        asyncio.create_task(perform_fetch_with_backoff())
        return {
            "data_status": "Cached_Fallback",
            "returned_payload": cache_entry["payload"],
            "retry_attempts": 0
        }
        
    # 3. Cache Miss (First run or cache empty)
    # Perform inline fetch (since we don't have a stale cache entry to return)
    # But wait, if it fails, recover with local_db_cache
    logger.info(f"Cache miss for {ticker}. Performing inline fetch.")
    payload = await perform_fetch_with_backoff()
    
    if payload:
        return {
            "data_status": "Live",
            "returned_payload": payload,
            "retry_attempts": 0
        }
    else:
        # Outage recovery: use local_db_cache
        logger.warning(f"Outage recovery activated for {ticker}. Returning local fallback cache.")
        fallback_payload = {
            "price": local_db_cache.get("price", 0.0),
            "momentum_score": local_db_cache.get("momentum_score", 0.0),
            "last_updated": local_db_cache.get("last_updated", datetime.now().isoformat())
        }
        return {
            "data_status": "Cached_Fallback" if local_db_cache else "Unavailable",
            "returned_payload": fallback_payload,
            "retry_attempts": max_retries
        }


async def fetch_market_data_batch_resilient(
    tickers: List[str], 
    local_db_caches: Dict[str, Dict[str, Any]], 
    max_retries: int = 3
) -> Dict[str, Dict[str, Any]]:
    """
    Fetches live market data for a list of tickers from Yahoo Finance in a single batch request
    with outage recovery, exponential backoff retries, and stale-while-revalidate caching.
    """
    from datetime import datetime
    
    headers = {"User-Agent": "Mozilla/5.0"}
    symbols_str = ",".join(tickers)
    url = f"https://query1.finance.yahoo.com/v7/finance/spark?symbols={symbols_str}&range=30d&interval=1d"
    
    now = datetime.now()
    
    # 1. Check if ALL tickers are warm in cache (within 5 minutes)
    all_warm = True
    warm_results = {}
    for ticker in tickers:
        cache_entry = MARKET_DATA_CACHE.get(ticker)
        if cache_entry and (now - cache_entry["last_updated"]).total_seconds() < 300:
            warm_results[ticker] = {
                "data_status": "Live",
                "returned_payload": cache_entry["payload"],
                "retry_attempts": 0
            }
        else:
            all_warm = False
            
    if all_warm:
        return warm_results
        
    # Helper async function to perform the actual batch fetch with backoff
    async def perform_batch_fetch_with_backoff() -> Optional[Dict[str, Dict[str, Any]]]:
        delay = 1.0
        for attempt in range(1, max_retries + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, headers=headers, timeout=5.0)
                    
                    if response.status_code in [429, 503]:
                        logger.warning(f"Rate limit / Service unavailable ({response.status_code}) for batch {symbols_str}. Retrying in {delay}s (Attempt {attempt}/{max_retries}).")
                        await asyncio.sleep(delay)
                        delay *= 2.0
                        continue
                        
                    response.raise_for_status()
                    data = response.json()
                    
                    # Parse spark result
                    results = {}
                    spark_data = data.get("spark", {}).get("result", [])
                    for item in spark_data:
                        ticker = item.get("symbol")
                        if not ticker or not item.get("response"):
                            continue
                        
                        symbol_res = item["response"][0]
                        meta = symbol_res.get("meta", {})
                        price = meta.get("regularMarketPrice", 0.0)
                        
                        # Extract closing prices
                        quote = symbol_res.get("indicators", {}).get("quote", [{}])[0]
                        prices = quote.get("close", [])
                        valid_prices = [p for p in prices if p is not None]
                        
                        momentum = 0.0
                        if len(valid_prices) > 1:
                            latest = valid_prices[-1]
                            prior = valid_prices[0]
                            momentum = round(((latest - prior) / prior) * 100, 2)
                            
                        payload = {
                            "price": round(price, 2) if price else (round(valid_prices[-1], 2) if valid_prices else 0.0),
                            "momentum_score": momentum,
                            "last_updated": datetime.now().isoformat()
                        }
                        
                        # Update global cache
                        MARKET_DATA_CACHE[ticker] = {
                            "payload": payload,
                            "last_updated": datetime.now()
                        }
                        results[ticker] = payload
                    return results
            except Exception as e:
                logger.error(f"Error fetching batch market data for {symbols_str} (Attempt {attempt}/{max_retries}): {str(e)}")
                if attempt < max_retries:
                    await asyncio.sleep(delay)
                    delay *= 2.0
        return None

    # 2. Check if we have cold cache fallback for ALL tickers to trigger Stale-While-Revalidate
    all_cached = True
    cached_results = {}
    for ticker in tickers:
        cache_entry = MARKET_DATA_CACHE.get(ticker)
        if cache_entry:
            cached_results[ticker] = {
                "data_status": "Cached_Fallback",
                "returned_payload": cache_entry["payload"],
                "retry_attempts": 0
            }
        else:
            all_cached = False
            
    if all_cached:
        # Cache is cold (> 5 mins) for some or all, trigger background task to revalidate, return cached values immediately
        logger.info(f"Cache cold for batch {symbols_str}. Triggering background revalidation.")
        asyncio.create_task(perform_batch_fetch_with_backoff())
        return cached_results

    # 3. Cache Miss (At least one ticker has no cache entry)
    # Perform inline fetch (since we don't have stale cache entries for everyone)
    logger.info(f"Cache miss for batch {symbols_str}. Performing inline fetch.")
    live_payloads = await perform_batch_fetch_with_backoff()
    
    final_results = {}
    for ticker in tickers:
        local_db_cache = local_db_caches.get(ticker, {})
        if live_payloads and ticker in live_payloads:
            final_results[ticker] = {
                "data_status": "Live",
                "returned_payload": live_payloads[ticker],
                "retry_attempts": 0
            }
        elif ticker in MARKET_DATA_CACHE:
            # Fallback to cold cache
            final_results[ticker] = {
                "data_status": "Cached_Fallback",
                "returned_payload": MARKET_DATA_CACHE[ticker]["payload"],
                "retry_attempts": 0
            }
        else:
            # Fallback to local db cache
            fallback_payload = {
                "price": local_db_cache.get("price", 0.0),
                "momentum_score": local_db_cache.get("momentum_score", 0.0),
                "last_updated": local_db_cache.get("last_updated", datetime.now().isoformat())
            }
            final_results[ticker] = {
                "data_status": "Cached_Fallback" if local_db_cache else "Unavailable",
                "returned_payload": fallback_payload,
                "retry_attempts": max_retries
            }
            
    return final_results

