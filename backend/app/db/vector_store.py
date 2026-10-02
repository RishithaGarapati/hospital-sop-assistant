import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any, Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Optional[chromadb.AsyncHttpClient] = None
_collection = None


async def init_vector_store():
    global _client, _collection
    try:
        _client = await chromadb.AsyncHttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
        )
        _collection = await _client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(f"ChromaDB collection '{settings.CHROMA_COLLECTION}' ready.")
    except Exception as e:
        logger.warning(f"ChromaDB server not available, using local persistent fallback: {e}")
        # PersistentClient saves to disk under ./chroma_data, so uploaded SOPs
        # survive backend restarts instead of vanishing like the old in-memory
        # chromadb.Client() fallback did.
        _client = chromadb.PersistentClient(path="./chroma_data")
        _collection = _client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION,
            metadata={"hnsw:space": "cosine"},
        )


def get_collection():
    if _collection is None:
        raise RuntimeError("Vector store not initialized. Call init_vector_store() first.")
    return _collection


async def upsert_chunks(
    chunks: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
    ids: List[str],
):
    col = get_collection()
    try:
        await col.upsert(documents=chunks, embeddings=embeddings, metadatas=metadatas, ids=ids)
    except TypeError:
        col.upsert(documents=chunks, embeddings=embeddings, metadatas=metadatas, ids=ids)
    logger.info(f"Upserted {len(chunks)} chunks into vector store.")


async def query_similar(
    query_embedding: List[float],
    n_results: int = 5,
    where: Optional[Dict] = None,
) -> Dict[str, Any]:
    col = get_collection()
    kwargs = dict(
        query_embeddings=[query_embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )
    if where:
        kwargs["where"] = where
    try:
        results = await col.query(**kwargs)
    except TypeError:
        results = col.query(**kwargs)
    return results


async def delete_sop_chunks(sop_id: int):
    col = get_collection()
    try:
        await col.delete(where={"sop_id": sop_id})
    except TypeError:
        col.delete(where={"sop_id": sop_id})
    logger.info(f"Deleted all chunks for SOP ID {sop_id}.")