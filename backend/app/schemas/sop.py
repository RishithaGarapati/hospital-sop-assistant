from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from app.models.sop_document import SOPCategory, SOPStatus


class SOPCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=300)
    category: SOPCategory
    department: Optional[str] = None
    version: Optional[str] = None
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
    version: Optional[str]
    author: Optional[str]
    description: Optional[str]
    file_name: str
    file_type: str
    file_size_kb: Optional[float]
    status: SOPStatus
    chunk_count: int
    search_count: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class SOPListResponse(BaseModel):
    total: int
    items: List[SOPResponse]
