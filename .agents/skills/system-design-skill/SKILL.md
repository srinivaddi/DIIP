# Digital Institutional Intelligence Platform
## Unified Architecture & Design

### Executive Summary

The objective is not to replicate BlackRock research. The objective is to build an institutional intelligence platform that continuously ingests public institutional research, macroeconomic data, ETF flows, earnings information, and market signals to identify shifts in institutional conviction and generate actionable investment opportunities.

The core differentiator is **Narrative Change Detection**—identifying what has changed in institutional thinking before those changes become broadly reflected in market pricing.

---

# Vision

The platform answers a single high-value question:

> Where is institutional capital moving, and what has changed in institutional conviction before retail investors notice?

Rather than acting as a report summarizer, the platform transforms research reports, market data, and institutional positioning information into structured signals, investment themes, stock opportunities, and analyst-grade investment theses.

---

# Core Value Proposition

Traditional research tools answer:

- What does BlackRock think?
- What does JPMorgan recommend?
- What are the latest market outlooks?

This platform answers:

- What changed in BlackRock's view this month?
- What themes are receiving increasing institutional conviction?
- Which sectors are gaining institutional support?
- Where is institutional capital flowing?
- Which stocks are best positioned to benefit?

The "change in narrative" is significantly more valuable than simple summarization.

---

# Unified System Architecture
```text
                  External Data Sources
    ---------------------------------------------------
    |                |              |                 |
    v                v              v                 v

Institutional   Macro Data      ETF Flows      Market Data
Research        Providers       Sources        & Earnings

    ---------------------------------------------------
                           |
                           v
                           
             Continuous Ingestion Schedulers
             (Hourly, Daily, Weekly, Monthly)
             
                           |
                           v

                  Data Ingestion Layer

                           |
                           v

                Processing & Enrichment

  ---------------------------------------------------------
  |               |               |             |          |
  v               v               v             v          v

Theme         Positioning      Change       Flow      Earnings
Extraction    Analysis         Detection    Analysis  Analysis

  ---------------------------------------------------------
                           |
                           v

                  Intelligence Layer

         Narrative Change Detection Engine
         Institutional Consensus Engine
         Theme Correlation Engine
         Opportunity Scoring Engine

                           |
                           v

                  Thesis Generation Layer

                           |
                           v
                           
                Safety Guardrails Layer
         (Compliance, Outage & Rate Limits check)

                           |
                           v

             Dashboard | Alerts | APIs | Daily Reports
```

1. **Ingestion & Continuous Scheduling Layer**
        a. **Research Intelligence Agent:** 📂 `research_agent` (ingests commentaries, extracts stances)
        b. **Macro Intelligence Agent:** 📂 `macro_agent` (classifies macro regimes e.g. CPI, PPI, rate outlooks)
        c. **ETF Flow Intelligence Agent:** 📂 `etf_flow_agent` (monitors sector capital inflows)
        d. **Earnings Intelligence Agent:** 📂 `earnings_agent` (extracts margin and guidance signals from 10-Qs)
        e. **News & Alerts Intelligence Agent:** 📂 `news_agent` / `alert_agent` (routes real-time warnings and catalysts)
        f. **Continuous Schedulers:** Core background daemons managing Hourly news alerts, Daily ETF flows, Weekly firm research, and Monthly macro classifiers.

2. **Intelligence Layer Engines**
        a. **Narrative Change Detection Engine:** 📂 `narrative_change_agent` (tracks rating updates and consensus migrations)
        b. **Institutional Consensus Engine:** 📂 `consensus_agent` (calculates consensus agreement)
        c. **Theme Correlation Engine:** 📂 `theme_correlation_agent` (correlates Macro + Flows + Earnings metrics)
        d. **Opportunity Scoring Engine:** 📂 `opportunity_scoring_agent` (calculates stock opportunity scores and ranks leaderboard)

3. **Thesis & Execution Layer**
        a. **Thesis Generation Engine:** 📂 `thesis_generation_agent` (compiles analyst-grade research memos with ThreadPoolExecutor parallel batching)
        b. **Portfolio Strategy Rebalancer:** 📂 `portfolio_manager` (optimizes target weights and places broker orders)

4. **Safety & Compliance Guardrails Layer**
        a. **Trading Execution Guardrail:** Enforces portfolio single-stock caps (25%), trade size caps (15%), blocks batched duplicate orders, and registers Human-in-the-Loop signature confirmations before order routing.
        b. **LLM Output Guardrail:** Cleanses text block shapes, redacts price predictions for `Level-1` user views, and appends regulatory educational disclaimers.
        c. **Ingestion Scraper Guardrail:** Prevents SSRF attacks by mapping loopback (`127.0.0.1`), private networks, and internal addresses, and enforces token length caps.
        d. **Market Data Fallback Guardrail:** Handles external outages with stale-while-revalidate caches (e.g. 5m opportunity rankings threshold) and exponential backoff retry.t weights and places broker orders)

---

# Architectural Principles

## 1. Signal Extraction Over Summarization

The platform does not store reports merely as text.

Every report is converted into structured signals:

```json
{
  "theme": "AI Infrastructure",
  "stance": "Bullish",
  "confidence": 0.92,
  "source": "BlackRock",
  "date": "2026-07"
}
```

This makes institutional opinions computable and comparable over time.

---

## 2. Multi-Source Institutional Intelligence

The platform should evolve beyond BlackRock and collect research from:

- BlackRock
- Vanguard
- State Street
- Fidelity
- JPMorgan
- Goldman Sachs
- Morgan Stanley

This enables measurement of overall institutional consensus.

Example:

| Theme | Firms Bullish |
|---------|---------------|
| AI Infrastructure | 6/6 |
| Defense | 5/6 |
| Utilities | 1/6 |
| Emerging Markets | 4/6 |

---

## 3. Continuous Change Tracking

Every report is compared against historical reports.

Instead of storing static opinions:

```json
{
  "sector": "Technology",
  "previous": "Neutral",
  "current": "Overweight",
  "change": "Upgrade",
  "importance": 9
}
```

This capability becomes the primary alpha-generating component of the system.

---

# Functional Architecture

## Research Intelligence Agent

### Responsibilities

Monitor:

- BlackRock Market Outlook
- BlackRock Weekly Commentary
- iShares Insights
- CIO Perspectives
- Fixed Income Research
- Institutional Research Providers

### Output

```json
{
  "theme": "AI Infrastructure",
  "stance": "Bullish",
  "confidence": 0.92
}
```

---

## Macro Intelligence Agent

### Responsibilities

Track:

- CPI
- PPI
- GDP
- Employment
- Treasury Yields
- Federal Funds Rate

### Output

```json
{
  "regime": "Disinflation",
  "growth": "Stable",
  "rate_outlook": "Neutral"
}
```

### Purpose

Classify the economic environment used by downstream agents.

---

## ETF Flow Intelligence Agent

### Responsibilities

Monitor:

- iShares ETF Flows
- Vanguard ETF Flows
- Sector ETF Flows
- Institutional Allocations

### Output

```json
{
  "XLK": "Positive",
  "XLF": "Positive",
  "XLE": "Negative"
}
```

### Purpose

Measure institutional capital movement.

---

## Earnings Intelligence Agent

### Responsibilities

Analyze:

- 10-K
- 10-Q
- Earnings Calls
- Investor Presentations

### Extract

- Revenue Growth
- Margin Trends
- Guidance Revisions
- Earnings Sentiment

---

## News Intelligence Agent

### Responsibilities

Monitor:

- Reuters
- Bloomberg
- SEC Filings
- Press Releases

### Detect

- Acquisitions
- Product Launches
- Regulatory Changes
- Strategic Announcements

---

# Intelligence Layer

This layer is the strategic center of the platform.

---

## Narrative Change Detection Engine

### Objective

Identify how institutional thinking changes over time.

Example:

Current Month:

```text
Overweight Technology
```

Previous Month:

```text
Neutral Technology
```

Output:

```json
{
  "change": "Upgrade",
  "importance": 9
}
```

### Why It Matters

Most value comes from detecting:

- Upgrades
- Downgrades
- New Themes
- Declining Convictions
- Emerging Risks

---

## Institutional Consensus Engine

Combines outputs from all research providers.

Example:

```json
{
  "theme": "AI Infrastructure",
  "bullish_firms": 6,
  "total_firms": 6,
  "consensus": "Strong Bullish"
}
```

Purpose:

Measure conviction across Wall Street.

---

## Theme Correlation Engine

Combines:

```text
Institutional Themes
+
Macro Regime
+
ETF Flows
+
Earnings Strength
```

Example:

```text
Theme: AI Infrastructure
Macro Environment: Positive
ETF Flows: Positive
Earnings: Positive
```

Output:

```text
High Conviction Theme
```

---

## Opportunity Scoring Engine

Maps themes into specific securities.

Example Theme:

```text
AI Infrastructure
```

Potential Beneficiaries:

- NVDA
- AVGO
- VRT
- ANET
- TSM

---

### Scoring Framework

```text
Score =
Growth Score               × 30%
Margin Score               × 15%
Macro Score                × 15%
Flow Score                 × 20%
Valuation Score            × 20%
```

Example:

```json
{
  "ticker": "AVGO",
  "score": 90
}
```

---

# Thesis Generation System

The final layer generates analyst-grade investment research.

Example:

## Investment Thesis

### Theme

AI Infrastructure

### Why Now

- Institutional conviction increasing
- Positive ETF inflows
- Supportive macro environment
- Strong earnings performance

### Key Beneficiaries

- NVDA
- AVGO
- ANET

### Risks

- Valuation expansion
- AI spending slowdown
- Macro deterioration

### Confidence

8.8 / 10

---

# End-to-End Workflow

```text
04:00 AM Daily Trigger
        |
        v
Research Intelligence Agent
        |
        v
Macro Intelligence Agent
        |
        v
ETF Flow Intelligence Agent
        |
        v
Earnings Intelligence Agent
        |
        v
Narrative Change Detection Engine
        |
        v
Institutional Consensus Engine
        |
        v
Theme Correlation Engine
        |
        v
Opportunity Scoring Engine
        |
        v
Thesis Generation Engine
        |
        v
Dashboard + Alert Distribution
```

---

# Recommended MVP

Phase 1 should focus on the minimum differentiating capability:

1. Institutional Research Ingestion
2. Theme Extraction
3. Narrative Change Detection
4. ETF Flow Analysis
5. Stock Mapping
6. Thesis Generation

This delivers the platform's strongest value proposition quickly.

---

# Strategic Moat

By combining narrative change detection, institutional consensus, macro regime analysis, ETF flow intelligence, and opportunity scoring, the platform becomes a true institutional intelligence engine rather than a research summarization tool.