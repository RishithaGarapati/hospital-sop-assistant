from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    question: str
    department: Optional[str] = None
    category_filter: Optional[str] = None


class SourceDocument(BaseModel):
    sop_id: int
    sop_title: str
    category: str
    chunk_text: str
    relevance_score: float


class ChatResponse(BaseModel):
    answer: str
    steps: Optional[List[str]] = None
    sources: List[SourceDocument]
    confidence: float
    response_time_ms: int


class SummaryRequest(BaseModel):
    sop_id: int
    summary_type: str = "quick"   # quick | detailed | bullet


class SummaryResponse(BaseModel):
    sop_id: int
    sop_title: str
    summary_type: str
    content: str
    bullet_points: Optional[List[str]] = None
