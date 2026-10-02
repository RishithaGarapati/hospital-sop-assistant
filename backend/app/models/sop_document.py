from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class SOPCategory(str, enum.Enum):
    admission    = "admission"
    discharge    = "discharge"
    infection    = "infection"
    emergency    = "emergency"
    clinical     = "clinical"
    safety       = "safety"
    admin        = "admin"


class SOPStatus(str, enum.Enum):
    processing  = "processing"
    active      = "active"
    archived    = "archived"
    failed      = "failed"


class SOPDocument(Base):
    __tablename__ = "sop_documents"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(300), nullable=False, index=True)
    category      = Column(Enum(SOPCategory), nullable=False, index=True)
    department    = Column(String(100), nullable=True)
    version       = Column(String(20), nullable=True)
    author        = Column(String(150), nullable=True)
    description   = Column(Text, nullable=True)
    file_path     = Column(String(500), nullable=False)
    file_name     = Column(String(300), nullable=False)
    file_type     = Column(String(10), nullable=False)
    file_size_kb  = Column(Float, nullable=True)
    status        = Column(Enum(SOPStatus), default=SOPStatus.processing)
    chunk_count   = Column(Integer, default=0)
    search_count  = Column(Integer, default=0)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), onupdate=func.now())
    uploaded_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
