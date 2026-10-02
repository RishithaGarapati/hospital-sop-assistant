"""
SOP Summarization Service — supports Groq (free), Anthropic, OpenAI, Ollama
"""
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

SUMMARY_PROMPTS = {
    "quick": "Summarize this hospital SOP in 2-3 sentences. Focus on the main purpose and key actions.",
    "detailed": "Write a detailed 5-10 sentence summary of this hospital SOP covering: purpose, key steps, who is responsible, compliance requirements, and risks.",
    "bullet": "Extract bullet points from this hospital SOP covering: Key procedures, Required approvals, Risks/hazards, Compliance checks, PPE/safety requirements. Format as a numbered list.",
}


async def summarize_sop(sop_id: int, sop_title: str, summary_type: str = "quick") -> dict:
    from app.services.embedding_service import embed_query
    from app.db.vector_store import query_similar

    dummy_embedding = await embed_query(sop_title)
    results = await query_similar(
        query_embedding=dummy_embedding,
        n_results=15,
        where={"sop_id": {"$eq": sop_id}},
    )

    if not results or not results.get("documents") or not results["documents"][0]:
        return {
            "sop_id": sop_id, "sop_title": sop_title, "summary_type": summary_type,
            "content": "No content found for this SOP. Ensure it has been uploaded and processed.",
            "bullet_points": None,
        }

    full_text = "\n\n".join(results["documents"][0])[:4000]
    prompt = SUMMARY_PROMPTS.get(summary_type, SUMMARY_PROMPTS["quick"])
    message = f"Hospital SOP: {sop_title}\n\n{full_text}\n\nInstruction: {prompt}"

    summary_text = await _generate(message)
    bullet_points = None

    if summary_type == "bullet":
        import re
        bullet_points = re.findall(r'\d+\.\s*(.+)', summary_text)
        if not bullet_points:
            bullet_points = [l.lstrip("•-– ").strip() for l in summary_text.split("\n") if l.strip()]

    return {
        "sop_id": sop_id, "sop_title": sop_title,
        "summary_type": summary_type, "content": summary_text,
        "bullet_points": bullet_points,
    }


async def _generate(prompt: str) -> str:
    provider = settings.LLM_PROVIDER.lower()

    if provider == "groq" and settings.GROQ_API_KEY:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        res = await client.chat.completions.create(
            model=settings.GROQ_MODEL, max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        return res.choices[0].message.content

    elif provider == "anthropic" and settings.ANTHROPIC_API_KEY:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        res = await client.messages.create(
            model=settings.ANTHROPIC_MODEL, max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        return res.content[0].text

    elif provider == "openai" and settings.OPENAI_API_KEY:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        res = await client.chat.completions.create(
            model=settings.OPENAI_MODEL, max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        return res.choices[0].message.content

    elif provider == "ollama":
        import httpx
        async with httpx.AsyncClient(timeout=120) as client:
            res = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/chat",
                json={"model": settings.OLLAMA_MODEL, "stream": False,
                      "messages": [{"role": "user", "content": prompt}]},
            )
            return res.json()["message"]["content"]

    return "⚠️ No AI provider configured. Add GROQ_API_KEY to your .env file.\nGet a free key at: https://console.groq.com"
