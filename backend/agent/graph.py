"""
The agent loop, built as a LangGraph StateGraph:

    plan  ->  search  ->  read  ->  synthesize  ->  END

Each node returns a partial state update. main.py streams these updates
to the frontend as they happen via `graph.astream(...)`.
"""

import json
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI

from .state import AgentState
from .tools import web_search, fetch_and_extract
from .prompts import PLAN_PROMPT, SYNTHESIS_PROMPT

llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", temperature=0)



async def plan_node(state: AgentState) -> dict:
    topic = state["topic"]
    prompt = PLAN_PROMPT.format(topic=topic)
    response = await llm.ainvoke(prompt)

    try:
        plan = json.loads(response.content)
    except (json.JSONDecodeError, TypeError):

        plan = [topic]

    return {"plan": plan, "step": "planned", "step_detail": f"{len(plan)} sub-questions"}


async def search_node(state: AgentState) -> dict:
    plan = state["plan"]
    all_results = []

    for query in plan:
        results = await web_search(query, max_results=3)
        all_results.extend(results)

    return {
        "search_results": all_results,
        "step": "searched",
        "step_detail": f"{len(all_results)} results found",
    }


async def read_node(state: AgentState) -> dict:
    results = state["search_results"]
    sources = []

   
    seen = set()
    for r in results:
        if r["url"] in seen:
            continue
        seen.add(r["url"])

        content = await fetch_and_extract(r["url"])
        
        text = content if content else r.get("snippet", "")
        if not text:
            continue

        sources.append({"title": r["title"], "url": r["url"], "content": text})

        if len(sources) >= 8:  # cap total sources
            break

    return {"sources": sources, "step": "read", "step_detail": f"{len(sources)} sources parsed"}


async def synthesize_node(state: AgentState) -> dict:
    sources = state["sources"]
    sources_block = "\n\n".join(
        f"[{i+1}] {s['title']} ({s['url']})\n{s['content'][:1500]}"
        for i, s in enumerate(sources)
    )

    prompt = SYNTHESIS_PROMPT.format(
        topic=state["topic"], sources_block=sources_block, plan=state["plan"]
    )
    response = await llm.ainvoke(prompt)

    return {"draft": response.content, "step": "done", "step_detail": "report ready"}



def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("create_plan", plan_node)
    graph.add_node("search", search_node)
    graph.add_node("read", read_node)
    graph.add_node("synthesize", synthesize_node)

    graph.set_entry_point("create_plan")
    graph.add_edge("create_plan", "search")
    graph.add_edge("search", "read")
    graph.add_edge("read", "synthesize")
    graph.add_edge("synthesize", END)

    return graph.compile()


research_graph = build_graph()
