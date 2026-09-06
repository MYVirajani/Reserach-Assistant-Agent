"""
Tools the agent can call: web search and page content extraction.

Search uses Tavily (purpose-built for LLM agents — returns clean snippets
instead of raw HTML). Swap in SerpAPI/Bing if you prefer.
"""

import os
import httpx
from bs4 import BeautifulSoup
from typing import List, Dict

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
TAVILY_URL = "https://api.tavily.com/search"


async def web_search(query: str, max_results: int = 5) -> List[Dict]:
    """Search the web via Tavily and return a list of {title, url, snippet}."""
    if not TAVILY_API_KEY:
        raise RuntimeError("TAVILY_API_KEY is not set in the environment")

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.post(
            TAVILY_URL,
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "max_results": max_results,
                "search_depth": "basic",
            },
        )
        resp.raise_for_status()
        data = resp.json()

    return [
        {
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("content", ""),
        }
        for r in data.get("results", [])
    ]


async def fetch_and_extract(url: str, max_chars: int = 4000) -> str:
    """Fetch a URL and extract readable text content, trimmed to max_chars."""
    try:
        async with httpx.AsyncClient(
            timeout=15, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}
        ) as client:
            resp = await client.get(url)
            resp.raise_for_status()
    except Exception:
        return ""

    content_type = resp.headers.get("content-type", "")
    if "pdf" in content_type:
        return ""

    soup = BeautifulSoup(resp.text, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    text = " ".join(soup.get_text(separator=" ").split())
    return text[:max_chars]
