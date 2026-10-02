"""
Embedding generation — supports OpenAI and sentence-transformers.
"""
import logging
from typing import List
from app.core.config import settings

logger = logging.getLogger(__name__)

_local_model = None


def _get_local_model():
    global _local_model
    if _local_model is None:
        from sentence_transformers import SentenceTransformer
        _local_model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Loaded local embedding model: all-MiniLM-L6-v2")
    return _local_model


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    if settings.OPENAI_API_KEY and settings.LLM_PROVIDER == "openai":
        return await _openai_embeddings(texts)
    return _local_embeddings(texts)


async def _openai_embeddings(texts: List[str]) -> List[List[float]]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.embeddings.create(
        model=settings.EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def _local_embeddings(texts: List[str]) -> List[List[float]]:
    model = _get_local_model()
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return embeddings.tolist()


async def embed_query(text: str) -> List[float]:
    result = await generate_embeddings([text])
    return result[0]
