"""
Pydantic schemas for request validation and response serialization.
"""
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole, SOPCategory, SOPStatus, ProcessingStep


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int                    # seconds
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


# ── User Schemas ──────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    role: UserRole = UserRole.STAFF
    department: Optional[str] = None

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    department: Optional[str]
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── SOP Schemas ───────────────────────────────────────────────────────────────

class SOPCreate(BaseModel):
    title: str = Field(min_length=3, max_length=512)
    category: SOPCategory
    department: Optional[str] = None
    version: str = "v1.0"
    author: Optional[str] = None
    description: Optional[str] = None


class SOPUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[SOPCategory] = None
    department: Optional[str] = None
    version: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None


class SOPResponse(BaseModel):
    id: int
    title: str
    category: SOPCategory
    department: Optional[str]
    version: str
    author: Optional[str]
    description: Optional[str]
    status: SOPStatus
    processing_step: ProcessingStep
    filename: str
    file_size_bytes: Optional[int]
    file_type: Optional[str]
    chunk_count: int
    page_count: int
    word_count: int
    search_count: int
    uploaded_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SOPListResponse(BaseModel):
    items: List[SOPResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Query / Search Schemas ────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    department: Optional[str] = None
    category: Optional[SOPCategory] = None
    top_k: int = Field(default=5, ge=1, le=20)


class SourceChunk(BaseModel):
    sop_id: int
    sop_title: str
    chunk_text: str
    similarity_score: float
    page_number: Optional[int] = None


class QueryResponse(BaseModel):
    question: str
    answer: str
    response_type: str                  # "steps" | "text" | "decision"
    steps: Optional[List[str]] = None
    sources: List[SourceChunk]
    confidence_score: float
    response_time_ms: int
    query_id: int


class QueryFeedback(BaseModel):
    query_id: int
    rating: int = Field(ge=1, le=5)
    was_helpful: bool
    comment: Optional[str] = None


# ── Summary Schemas ───────────────────────────────────────────────────────────

class SummaryRequest(BaseModel):
    sop_id: int
    summary_type: str = Field(
        default="quick",
        pattern="^(quick|detailed|bullet)$"
    )


class SummaryResponse(BaseModel):
    sop_id: int
    sop_title: str
    summary_type: str
    content: str
    bullet_points: Optional[List[str]] = None
    key_procedures: Optional[List[str]] = None
    risks: Optional[List[str]] = None
    required_approvals: Optional[List[str]] = None
    sources: List[str]
    generated_at: datetime


# ── Decision Support Schemas ─────────────────────────────────────────────────

class DecisionRequest(BaseModel):
    scenario: str = Field(min_length=10, max_length=2000)
    department: Optional[str] = None
    urgency_level: Optional[str] = None


class DecisionAction(BaseModel):
    priority: str                       # "critical" | "warning" | "info" | "success"
    action: str
    sop_reference: Optional[str] = None


class DecisionResponse(BaseModel):
    scenario: str
    department: Optional[str]
    actions: List[DecisionAction]
    referenced_sops: List[str]
    confidence_score: float
    generated_at: datetime


# ── Analytics Schemas ─────────────────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    total_sops: int
    total_queries: int
    active_users: int
    avg_confidence: float
    search_success_rate: float
    avg_response_time_ms: float
    queries_today: int
    queries_this_week: int


class TopSOP(BaseModel):
    sop_id: int
    title: str
    category: SOPCategory
    search_count: int


class DailyStats(BaseModel):
    date: str
    query_count: int
    unique_users: int


class AnalyticsDashboard(BaseModel):
    overview: AnalyticsOverview
    top_sops: List[TopSOP]
    daily_stats: List[DailyStats]
    category_distribution: Dict[str, int]
    department_usage: Dict[str, int]
