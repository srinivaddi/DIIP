# DIIP System Architecture & Design Document

This document provides a detailed overview of the system architecture, component structures, data flows, and multi-agent interaction loops within the **Digital Institutional Intelligence Platform (DIIP)**.

---

## 🗺️ System Architecture Diagram

The diagram below details the interaction pathways between the **Next.js React Frontend**, the **FastAPI REST/WebSocket Server**, the **Multi-Agent Core**, and external financial API integrations.

```mermaid
graph TB
    subgraph "1. Presentation Layer (React / Next.js)"
        UI["React SPA Dashboard (Next.js 16)"]
        LaymanT["Layman Mode Translation Engine"]
        HorizonT["Horizon Selector (30d / 6m / 1y)"]
        UI --> LaymanT
        UI --> HorizonT
    end

    subgraph "2. API Gateway & Pub/Sub (FastAPI)"
        GW["REST API Gateway (Uvicorn)"]
        WS["WebSocket Broadcaster (Pub/Sub)"]
    end

    subgraph "3. Multi-Agent Orchestrator"
        MA["Agent Runner Core"]
        RA["Research Agent (BlackRockScraper)"]
        PA["Positioning Agent (OverweightDetector)"]
        NA["Narrative Agent (RegimeClassifier)"]
        PMA["Portfolio Management Agent"]
        
        MA --> RA
        MA --> PA
        MA --> NA
        MA --> PMA
    end

    subgraph "4. Infrastructure & Caching"
        SWR["Stale-While-Revalidate (SWR) Cache"]
        DB["In-Memory Database / Seed Opportunities"]
    end

    subgraph "5. External Data Layer"
        YF["Yahoo Finance Spark API (/v7/spark)"]
        RSS["Financial News RSS (Bloomberg, Reuters)"]
    end

    %% User Interaction
    UI -- "HTTP REST Requests" --> GW
    UI -- "WebSocket Connect" --> WS

    %% API Gateway to Agent/Cache mapping
    GW -- "/api/opportunities" --> SWR
    GW -- "/api/positioning" --> PA
    GW -- "/api/narratives" --> NA
    GW -- "/api/ingest" --> RA

    %% Caching to External APIs
    SWR -- "Batch Spark Fetch (Resilient)" --> YF
    SWR -- "Write-Through / Fallback" --> DB
    
    %% Schedulers to Scrapers
    RA -- "Scrapes strategy PDFs" --> DB
    WS -- "Broadcasts news catalysts" <-- RSS
```

---

## ⚙️ Component Design Specifications

### 1. Presentation Layer (React / Next.js)
* **Visual Dashboard**: Developed on Next.js 16.3 with TailwindCSS and custom CSS layers, ensuring smooth micro-animations, color-coded badges, and scannable visual indicators (threat bars, conviction rings).
* **Sidebar Layout**: Dynamic sidebar utilizing custom text-replacement logic. When Layman Mode is toggled, it dynamically swaps standard menu names with layman guide names (e.g. `Command Center` $\rightarrow$ `Overview`).
* **Buy/Sell/Hold Guide**: A dedicated three-column view that groups equities, ETFs, and Mutual Funds by computed action recommendations (`Buy`, `Hold`, `Avoid`) for easy retail pick alignment.

### 2. API Gateway (FastAPI / Uvicorn)
* **REST Services**:
  * `/api/opportunities`: Returns the prioritized stock leaderboard with dynamic conviction scoring based on selected horizons (`short`, `medium`, `long`).
  * `/api/positioning`: Returns Options Skew %, Short Interest %, and CFTC long positioning for all tickers.
  * `/api/narratives`: Timeline logs of institutional stance shifts.
  * `/api/ingest-url`: Triggers asynchronous scraping of commentary PDFs.
* **WebSocket Broadcaster**: Pub/Sub broadcasting implementation that pipes triggered alert catalysts and real-time narrative updates directly to the frontend clients without page refreshes.

### 3. Multi-Agent System Core
* **Research Agent**: Crawls PDF/commentary pages across 6 financial institutions (BlackRock, Goldman Sachs, JPMorgan, Morgan Stanley, Vanguard, Fidelity). Structures raw content into unified Markdown.
* **Positioning Agent**: Implements the `OverweightDetector` tool. Queries options volatility skew and CFTC positions, computing a `crowding_score` ($0\% - 100\%$) indicating allocation frothiness.
* **Narrative Agent**: Monitors macroeconomic regime shifts (CPI inflation rates, treasury yield curves) to flag key narrative inflection points.
* **Portfolio Manager**: Translates thematic exposure parameters into concrete stock weight suggestions.

### 4. Caching & Resilience Guardrails
* **Stale-While-Revalidate (SWR) Caching**: Restricts external API querying to a 5-minute cooldown. Returns cached pricing immediately while refreshing data in background worker tasks.
* **Consolidated Batch Fetching**: Converts concurrent individual queries into single batch URL calls targeting Yahoo Finance's `/v7/finance/spark` endpoint. Improves performance from $0.86\text{s}$ down to $0.65\text{s}$.
* **Mock Failbacks**: If the external Yahoo API is entirely unreachable, the platform automatically returns pre-seeded database opportunities, protecting the dashboard from crashing.
