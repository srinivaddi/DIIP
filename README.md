# DIIP (Digital Institutional Intelligence Platform)

DIIP is a multi-agent, resilient investment intelligence platform designed to ingest raw institutional strategy reports (PDFs, HTML commentaries), run advanced analysis pipelines (regime classification, thematic mapping, options crowding/skew scoring), and dynamically rank investment opportunities for retail and institutional use.

The platform provides a **React/Next.js dashboard** for users, powered by a **FastAPI backend** running autonomous agents.

---

## 🗺️ System Architecture

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

    subgraph "4. Infrastructure & Database"
        DB["SQLite (Local) / Neon Postgres (Prod)"]
        SWR["Stale-While-Revalidate (SWR) Cache"]
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

## 🚀 Key Features

*   **Multi-Agent Research Pipeline**:
    *   **Research Agent**: Automatically crawls and structures commentaries from BlackRock, Goldman Sachs, JPMorgan, Morgan Stanley, Vanguard, and Fidelity.
    *   **Positioning Agent (`OverweightDetector`)**: Computes ticker crowding scores using CFTC long positioning and options volatility skew.
    *   **Narrative Agent**: Classifies macroeconomic regimes (e.g. CPI movements, yield curves) to detect inflection points.
    *   **Portfolio Manager**: Suggests weight configurations matching thematic exposures.
*   **Next.js Dashboard**: Beautiful UI featuring interactive horizontal selectors (30d / 6m / 1y), threat bars, conviction rings, and a dedicated **Buy/Sell/Hold Guide** columns.
*   **Layman Mode Translation**: A toggle in the UI that dynamically swaps advanced institutional jargon (e.g., `Command Center`) into retail-friendly terminology (e.g., `Overview`).
*   **Resilient Design & Caching**: SWR caching to minimize external API rate-limiting, consolidated batch fetching, and automated mock fallbacks for stable operations.

---

## 🛠️ Project Structure

*   [`/backend`](file:///c:/Users/srvad/source/5DayAgenticEnggKaggle/Projects/capstone_project/DIIP/backend): FastAPI REST/WebSocket endpoints and runner agents.
*   [`/ui`](file:///c:/Users/srvad/source/5DayAgenticEnggKaggle/Projects/capstone_project/DIIP/ui): Next.js React frontend dashboard code.
*   [`/shared`](file:///c:/Users/srvad/source/5DayAgenticEnggKaggle/Projects/capstone_project/DIIP/shared): Common Pydantic models, schemas, and utility modules.
*   [`.agents`](file:///c:/Users/srvad/source/5DayAgenticEnggKaggle/Projects/capstone_project/DIIP/.agents): Core agent logic, tools, and workflows.

---

## ⚙️ Local Development Setup

### 1. Prerequisites
Ensure you have Python 3.10+ and Node.js installed.

### 2. Backend Setup
1. Navigate to the root directory.
2. Initialize virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the sample environment file and configure your API keys:
   ```bash
   cp .env_sample .env
   ```
5. Run the development server:
   ```bash
   ./run_platform.bat
   ```

### 3. Frontend Setup
1. Navigate to the `ui` directory:
   ```bash
   cd ui
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js dev server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment Notes

*   **Frontend**: Best deployed on **Vercel** for instant builds, global CDNs, and seamless serverless routing.
*   **Backend**: Because the FastAPI backend uses long-running schedulers and persistent WebSockets, it should be deployed on container-based hosts such as **Render**, **Railway**, or **Fly.io**.
*   **Database**: Designed to run on a local **SQLite** database (`DATABASE_URL=sqlite:///./diip.db`) for development, and a **Neon Postgres** database in production.
