# Research Assistant Agent

A full-stack agentic AI system that takes a research topic, autonomously
plans, searches the web, reads sources, and writes a structured, cited
report — with live progress streamed to the UI as it works.

Built as a portfolio project to demonstrate agentic system design: multi-step
planning, tool use, and real-time streaming between a Python agent backend
and a Next.js frontend.

---

## What it does

1. **Plan** — breaks your topic into 3–5 focused sub-questions
2. **Search** — runs each sub-question through live web search
3. **Read** — fetches and extracts readable content from each source
4. **Synthesize** — writes a structured Markdown report with inline citations

Progress streams to the UI in real time as each step completes, and the
final report can be downloaded as Markdown or PDF.

---

## Tech stack

| Layer          | Technology                                      |
|-----------------|--------------------------------------------------|
| Frontend        | Next.js (App Router), TypeScript, Tailwind CSS   |
| Backend         | FastAPI, Python                                  |
| Agent framework | LangGraph (StateGraph)                           |
| LLM             | Google Gemini (free tier)                        |
| Web search      | Tavily API (free tier)                           |
| Streaming       | Server-Sent Events (SSE)                         |
| Report export   | react-markdown, jsPDF + html2canvas              |

---

## Architecture

```
┌──────────────────┐   HTTP POST    ┌───────────────────────┐
│   Next.js App     │  /api/research │   FastAPI Backend      │
│                    │ ──────────────▶│                        │
│  - Input form      │                │  agent/graph.py         │
│  - Live progress   │ ◀──────────────│  LangGraph StateGraph:  │
│    trail           │  SSE stream    │  plan→search→read→     │
│  - Rendered report │                │  synthesize             │
│  - MD / PDF export │                │                        │
└──────────────────┘                │  agent/tools.py         │
                                     │  - Tavily web search     │
                                     │  - page content extract  │
                                     └───────────────────────┘
```

The Next.js API route (`app/api/research/route.ts`) proxies requests to
FastAPI and passes the SSE stream straight through to the browser, so the
frontend gets live updates without needing a separate WebSocket server.

---

## Project structure

```
.
├── backend/
│   ├── main.py               # FastAPI app, SSE streaming endpoint
│   ├── agent/
│   │   ├── state.py           # shared LangGraph state schema
│   │   ├── prompts.py         # plan / synthesis prompt templates
│   │   ├── tools.py           # web_search (Tavily) + fetch_and_extract
│   │   └── graph.py           # LangGraph: plan → search → read → synthesize
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── layout.tsx          # font setup (Source Serif 4 + IBM Plex Sans)
    │   ├── page.tsx            # form, live progress trail, report viewer
    │   └── api/research/route.ts  # proxies + streams to FastAPI
    └── .env.local              # BACKEND_URL
```

---

## Setup

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env` with (both have free tiers, no card required):

- `GOOGLE_API_KEY` — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- `TAVILY_API_KEY` — from [tavily.com](https://tavily.com)

> **Note:** Google periodically retires free-tier Gemini model names. If you
> get a 404 saying a model "is no longer available," check
> [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models)
> and update the model string in `agent/graph.py` — the error message
> usually tells you the replacement name directly.

Run it:

```bash
uvicorn main:app --reload --port 8000
```

Verify it's up: `curl http://localhost:8000/health` → `{"status":"ok"}`

### 2. Frontend

```bash
cd frontend
npm install
```

Create `.env.local`:

```
BACKEND_URL=http://localhost:8000
```

Run it:

```bash
npm run dev
```

Visit `http://localhost:3000`, enter a topic, and watch it research.

