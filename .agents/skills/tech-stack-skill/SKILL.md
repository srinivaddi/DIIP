# Digital Institutional Intelligence Platform
## Tech Stack

# Data Architecture

## Raw Data Layer

Stores:

- Research Reports
- ETF Data
- Macro Data
- Earnings Data
- News Data

### Technology

BigQuery

---

## Knowledge Layer

Stores:

- Parsed Reports
- Historical Research
- Earnings Transcripts
- Generated Theses
- Theme History

### Technology

Vertex AI Vector Search

Metadata Example:

```json
{
  "report": "Q3 Outlook",
  "date": "2026-07",
  "section": "Technology",
  "text": "..."
}
```

Purpose:

Semantic search and retrieval.

---

# Technology Architecture

## Frontend

- Next.js
- Tailwind CSS (v3 utility styling)


## Agent Framework

- Google ADK

## AI Models

- Gemini 2.5 Pro

## Orchestration

- Agent Runtime

## Storage

- BigQuery

## Vector Database

- Vertex AI Vector Search

## Event Processing

- Pub/Sub

## Scheduling

- Cloud Scheduler

## Hosting

- Cloud Run

---
