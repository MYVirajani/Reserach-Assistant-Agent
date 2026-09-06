"""
Shared state object that flows through every node in the LangGraph agent.
Each node reads from this state and returns a partial update to it.
"""

from typing import TypedDict, List, Dict, Optional


class Source(TypedDict):
    title: str
    url: str
    content: str  

class AgentState(TypedDict, total=False):
    
    topic: str
    plan: List[str]  #
    search_results: List[Dict]  
    sources: List[Source]       
    draft: str                  
    step: str
    step_detail: Optional[str]
