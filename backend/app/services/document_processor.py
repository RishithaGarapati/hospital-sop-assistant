"""
Document Processing Pipeline
Step 1: Extract text  →  Step 2: Clean  →  Step 3: Chunk
Step 4: Embed  →  Step 5: Store in vector DB  →  Step 6: Store metadata
"""
import re
import hashlib
import logging
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)


# ── Step 1: Text extraction ────────────────────────────────────────────────
def extract_text(file_path: str, file_type: str) -> str:
    path = Path(file_path)
    if file_type == "txt":
        return path.read_text(encoding="utf-8", errors="ignore")

    if file_type == "pdf":
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(str(path))
            return "\n".join(page.get_text() for page in doc)
        except ImportError:
            raise RuntimeError("PyMuPDF not installed. Run: pip install pymupdf")

    if file_type == "docx":
        try:
            from docx import Document
            doc = Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except ImportError:
            raise RuntimeError("python-docx not installed. Run: pip install python-docx")

    raise ValueError(f"Unsupported file type: {file_type}")


# ── Step 2: Clean & preprocess ────────────────────────────────────────────
def clean_text(text: str) -> str:
    text = re.sub(r'\s+', ' ', text)          # collapse whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)    # max 2 consecutive newlines
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # remove non-ASCII
    text = re.sub(r'Page \d+ of \d+', '', text, flags=re.IGNORECASE)
    return text.strip()


# ── Step 3: Chunking ──────────────────────────────────────────────────────
def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, current, current_len = [], [], 0

    for sentence in sentences:
        s_len = len(sentence)
        if current_len + s_len > chunk_size and current:
            chunks.append(" ".join(current))
            # Overlap: keep last few sentences
            overlap_sentences = []
            overlap_len = 0
            for s in reversed(current):
                if overlap_len + len(s) <= overlap:
                    overlap_sentences.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            current = overlap_sentences
            current_len = overlap_len
        current.append(sentence)
        current_len += s_len

    if current:
        chunks.append(" ".join(current))

    return [c.strip() for c in chunks if len(c.strip()) > 50]


# ── Step 4+5+6: Full pipeline ─────────────────────────────────────────────
async def process_document(
    sop_id: int,
    file_path: str,
    file_type: str,
    metadata: dict,
    chunk_size: int = 800,
    overlap: int = 150,
) -> int:
    from app.services.embedding_service import generate_embeddings
    from app.db.vector_store import upsert_chunks

    logger.info(f"[SOP {sop_id}] Starting processing pipeline...")

    raw_text   = extract_text(file_path, file_type)
    clean      = clean_text(raw_text)
    chunks     = chunk_text(clean, chunk_size, overlap)

    logger.info(f"[SOP {sop_id}] Extracted {len(chunks)} chunks.")

    embeddings = await generate_embeddings(chunks)

    ids = [
        f"sop_{sop_id}_chunk_{i}_{hashlib.md5(c.encode()).hexdigest()[:8]}"
        for i, c in enumerate(chunks)
    ]
    metas = [
        {**metadata, "sop_id": sop_id, "chunk_index": i, "chunk_text": c[:200]}
        for i, c in enumerate(chunks)
    ]

    await upsert_chunks(chunks, embeddings, metas, ids)
    logger.info(f"[SOP {sop_id}] Pipeline complete. {len(chunks)} chunks indexed.")
    return len(chunks)
