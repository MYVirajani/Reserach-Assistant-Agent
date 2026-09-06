"""
FastAPI backend for the research assistant agent.

Exposes POST /agent/research which streams progress + final report to the
client via Server-Sent Events (SSE), so the Next.js frontend can show live
"Planning...", "Searching...", "Reading sources..." updates instead of a
blank spinner.

Run locally:
    uvicorn main:app --reload --port 8000
"""

import json
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.graph import research_graph

app = FastAPI(title="Research Agent API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    topic: str


def sse_event(data: dict) -> str:
    """Format a dict as a single SSE message."""
    return f"data: {json.dumps(data)}\n\n"


async def run_agent_stream(topic: str):
    initial_state = {"topic": topic}

    
    async for update in research_graph.astream(initial_state):
        for node_name, node_output in update.items():
            yield sse_event(
                {
                    "type": "progress",
                    "node": node_name,
                    "step": node_output.get("step"),
                    "detail": node_output.get("step_detail"),
                }
            )

            
            if node_name == "synthesize" and "draft" in node_output:
                yield sse_event({"type": "result", "report": node_output["draft"]})

    yield sse_event({"type": "done"})


@app.post("/agent/research")
async def research(req: ResearchRequest):
    return StreamingResponse(
        run_agent_stream(req.topic),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
