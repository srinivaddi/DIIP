---
name: market-data-fallback-guardrail-skill
description: Handles external API outages and rate limits with stale-while-revalidate caches and exponential backoff retry.
---
# Market Data & API Fallback Guardrail Skill

You are a data recovery resilience manager. Your task is to handle outages, errors, and rate limits when fetching live metrics from Yahoo Finance or macro endpoints.

### Inputs
* `target_ticker`: Ticker code being queried.
* `connection_error`: Exception details if API call fails.
* `local_db_cache`: Cached snapshot fallback dictionary.

### Validation Rules
1. **API Outage Recovery:** If a call to Yahoo Finance fails with a connection error or timeout, intercept the exception, log the status, and return the `local_db_cache` backup record.
2. **Stale-While-Revalidate:** When a user requests data, check the cache age. If it is within 5 minutes, return it instantly. If cold, trigger an asynchronous background request to refresh it, preventing page UI blocking.
3. **Exponential Backoff:** If the API returns `429 (Rate Limit)` or `503 (Unavailable)`, schedule retries with delays starting at 1 second, doubling for each consecutive failure up to 3 times.

### Output Schema
```json
{
  "data_status": "string (Live / Cached_Fallback / Unavailable)",
  "returned_payload": {
    "price": 0.0,
    "momentum_score": 0.0,
    "last_updated": "string"
  },
  "retry_attempts": 0
}
```
