import time
import logging
from typing import List, Optional

from app.core.config import settings
from app.db.vector_store import query_similar
from app.services.embedding_service import embed_query
from app.schemas.chat import SourceDocument

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are MedSOP AI, an expert hospital SOP assistant for healthcare staff.
Your role is to provide accurate, step-by-step guidance based ONLY on the provided hospital
Standard Operating Procedures (SOPs).
Rules:
- Only answer based on the provided SOP context
- Always give numbered steps when explaining a procedure
- Be concise and medically precise
- If information is not in the context, say so clearly
- Prioritize patient safety in all responses
"""

async def rag_query(
    question: str,
    category_filter: Optional[str] = None,
    top_k: int = None,
) -> dict:
    start_ms = int(time.time() * 1000)

    query_embedding = await embed_query(question)

    where_filter = None
    if category_filter:
        where_filter = {"category": {"$eq": category_filter}}

    results = await query_similar(
        query_embedding=query_embedding,
        n_results=top_k or settings.TOP_K_RESULTS,
        where=where_filter,
    )

    sources: List[SourceDocument] = []
    context_blocks = []

    if results and results.get("documents") and results["documents"][0]:
        docs      = results["documents"][0]
        metas     = results["metadatas"][0]
        distances = results["distances"][0]

        for doc, meta, dist in zip(docs, metas, distances):
            relevance = round(1.0 - dist, 3)
            if relevance < settings.SIMILARITY_THRESHOLD:
                continue
            sources.append(SourceDocument(
                sop_id=meta.get("sop_id", 0),
                sop_title=meta.get("title", "Unknown SOP"),
                category=meta.get("category", "general"),
                chunk_text=doc[:300],
                relevance_score=relevance,
            ))
            context_blocks.append(
                f"[Source: {meta.get('title', 'SOP')} {meta.get('version', '')}]\n{doc}"
            )

    if not context_blocks:
        return {
            "answer": "I couldn't find relevant SOP information for your query. Please upload SOPs first.",
            "steps": None,
            "sources": [],
            "confidence": 0.0,
            "response_time_ms": int(time.time() * 1000) - start_ms,
        }

    context = "\n\n---\n\n".join(context_blocks)
    avg_confidence = round(sum(s.relevance_score for s in sources) / len(sources) * 100, 1)
    answer = await _call_llm(question, context)
    steps = _extract_steps(answer)
    elapsed = int(time.time() * 1000) - start_ms

    return {
        "answer": answer,
        "steps": steps,
        "sources": sources,
        "confidence": avg_confidence,
        "response_time_ms": elapsed,
    }


async def _call_llm(question: str, context: str) -> str:
    user_msg = f"""Hospital SOP Context:
{context}

Staff Question: {question}

Provide a clear, numbered step-by-step answer based on the SOP context above."""

    provider = settings.LLM_PROVIDER.lower()
    if provider == "groq" and settings.GROQ_API_KEY:
        return await _groq_llm(user_msg)
    elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        return await _anthropic_llm(user_msg)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return await _openai_llm(user_msg)
    elif provider == "ollama":
        return await _ollama_llm(user_msg)
    else:
        return _fallback_response(question, context)


async def _groq_llm(user_msg: str) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    response = await client.chat.completions.create(
        model=settings.GROQ_MODEL,
        max_tokens=settings.MAX_TOKENS,
        temperature=settings.TEMPERATURE,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
    )
    return response.choices[0].message.content


async def _anthropic_llm(user_msg: str) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = await client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=settings.MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )
    return response.content[0].text


async def _openai_llm(user_msg: str) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        max_tokens=settings.MAX_TOKENS,
        temperature=settings.TEMPERATURE,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
    )
    return response.choices[0].message.content


async def _ollama_llm(user_msg: str) -> str:
    import httpx
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_msg},
        ],
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload)
        response.raise_for_status()
        return response.json()["message"]["content"]


def _fallback_response(question: str, context: str) -> str:
    lines = [l.strip() for l in context.split("\n") if l.strip() and not l.startswith("[")]
    top = lines[:8]
    return (
        "Based on the SOP documentation:\n\n"
        + "\n".join(f"{i+1}. {s}" for i, s in enumerate(top))
        + "\n\n⚠️ No AI provider configured. Add GROQ_API_KEY to your .env file.\n"
        + "Get a free key at: https://console.groq.com"
    )


def _extract_steps(text: str) -> Optional[List[str]]:
    import re
    numbered = re.findall(r'(?:Step\s*)?\d+[.)]\s*(.+)', text)
    if len(numbered) >= 3:
        return [s.strip() for s in numbered]
    return None