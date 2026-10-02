"""
Vector Store Service — ChromaDB
Handles upsert, similarity search, and deletion of SOP chunk vectors.
"""
import asyncio
from typing import List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings
from loguru import logger

from app.core.config import settings
from app.services.embedding_service import EmbeddingService


class SearchResult:
    """Single result from a vector similarity search."""

    def __init__(
        self,
        chunk_id: str,
        text: str,
        sop_id: int,
        sop_title: str,
        similarity_score: float,
        metadata: dict,
    ):
        self.chunk_id = chunk_id
        self.text = text
        self.sop_id = sop_id
        self.sop_title = sop_title
        self.similarity_score = similarity_score
        self.metadata = metadata


class VectorStoreService:
    """
    Manages all interactions with ChromaDB.

    Collection schema per document chunk:
      - id:        MD5 hash (sop_id + chunk_index + text prefix)
      - embedding: float32 vector (1536 dims for text-embedding-3-small)
      - document:  raw chunk text
      - metadata:  {sop_id, sop_title, category, department, version, author, chunk_index}
    """

    def __init__(self):
        self._client: Optional[chromadb.AsyncHttpClient] = None
        self._collection = None
        self.embedding_service = EmbeddingService()

    async def _get_collection(self):
        """Lazy-initialise ChromaDB client and collection."""
        if self._collection is None:
            self._client = await chromadb.AsyncHttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(anonymized_telemetry=False),
            )
            self._collection = await self._client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION,
                metadata={"hnsw:space": "cosine"},      # cosine similarity
            )
            logger.info(
                f"ChromaDB connected — collection: {settings.CHROMA_COLLECTION}"
            )
        return self._collection

    # ── Write Operations ──────────────────────────────────────────────────────

    async def upsert_chunks(
        self,
        chunks,                         # List[DocumentChunk]
        embeddings: List[List[float]],
        metadata: dict,
    ) -> List[str]:
        """
        Insert or update document chunks with their embeddings.

        Args:
            chunks:     DocumentChunk objects
            embeddings: Corresponding embedding vectors
            metadata:   SOP-level metadata (title, category, etc.)

        Returns:
            List of ChromaDB IDs (one per chunk)
        """
        collection = await self._get_collection()

        ids = [c.chunk_id for c in chunks]
        documents = [c.text for c in chunks]
        metadatas = [
            {
                "sop_id": str(c.sop_id),
                "sop_title": metadata.get("title", ""),
                "category": metadata.get("category", ""),
                "department": metadata.get("department", ""),
                "version": metadata.get("version", ""),
                "author": metadata.get("author", ""),
                "chunk_index": str(c.chunk_index),
            }
            for c in chunks
        ]

        await collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

        logger.info(f"Upserted {len(ids)} chunks for SOP {chunks[0].sop_id}")
        return ids

    async def delete_chunks(self, chunk_ids: List[str]) -> None:
        """Remove chunks by their ChromaDB IDs."""
        if not chunk_ids:
            return
        collection = await self._get_collection()
        await collection.delete(ids=chunk_ids)
        logger.info(f"Deleted {len(chunk_ids)} vectors from ChromaDB")

    # ── Search Operations ─────────────────────────────────────────────────────

    async def similarity_search(
        self,
        query: str,
        top_k: int = 5,
        filter_metadata: Optional[dict] = None,
    ) -> List[SearchResult]:
        """
        Perform semantic similarity search over all indexed SOP chunks.

        Args:
            query:           Natural language question from the user
            top_k:           Number of chunks to retrieve
            filter_metadata: Optional ChromaDB where-filter
                             e.g. {"category": "emergency"}

        Returns:
            List of SearchResult, sorted by descending similarity score
        """
        collection = await self._get_collection()

        # Embed the query
        query_embedding = await self.embedding_service.embed_single(query)

        # Build query params
        query_params = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, 20),
            "include": ["documents", "metadatas", "distances"],
        }
        if filter_metadata:
            query_params["where"] = filter_metadata

        results = await collection.query(**query_params)

        if not results["ids"][0]:
            return []

        search_results = []
        for i, chunk_id in enumerate(results["ids"][0]):
            distance = results["distances"][0][i]
            # ChromaDB cosine distance → similarity score (0-1, higher = better)
            similarity = 1 - distance

            if similarity < settings.RAG_SIMILARITY_THRESHOLD:
                continue

            meta = results["metadatas"][0][i]
            search_results.append(
                SearchResult(
                    chunk_id=chunk_id,
                    text=results["documents"][0][i],
                    sop_id=int(meta.get("sop_id", 0)),
                    sop_title=meta.get("sop_title", "Unknown SOP"),
                    similarity_score=round(similarity, 4),
                    metadata=meta,
                )
            )

        logger.debug(
            f"Similarity search for '{query[:60]}...' → "
            f"{len(search_results)} results above threshold"
        )
        return search_results

    async def get_collection_stats(self) -> dict:
        """Return collection statistics for analytics."""
        collection = await self._get_collection()
        count = await collection.count()
        return {"total_chunks": count, "collection": settings.CHROMA_COLLECTION}
