PLAN_PROMPT = """You are a research planning assistant.

Given a research topic, break it down into 3-5 focused sub-questions that,
together, would let someone write a well-rounded report on the topic.

Topic: {topic}

Return ONLY a JSON array of strings, no preamble, no markdown fences.
Example: ["What is X?", "How does X compare to Y?", "What are recent developments in X?"]
"""

SYNTHESIS_PROMPT = """You are a research assistant writing a structured report.

Topic: {topic}

You have gathered the following sources:
{sources_block}

Write a well-organized Markdown report that:
- Has a short introduction
- Addresses each sub-question the research plan raised: {plan}
- Cites sources inline using [1], [2], etc. matching the numbered sources above
- Ends with a "Sources" section listing each numbered source with its URL
- Is factual and does not invent information not present in the sources

Write the full report now.
"""

RELEVANCE_CHECK_PROMPT = """Given the research topic "{topic}" and this piece of
retrieved content, rate its relevance from 0-10 and give a one-line reason.

Content:
{content}

Return ONLY JSON: {{"score": <int>, "reason": "<string>"}}
"""
