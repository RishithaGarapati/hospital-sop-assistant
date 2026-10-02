from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class QueryLog(Base):
    __tablename__ = "query_logs"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True)
    question        = Column(Text, nullable=False)
    response        = Column(Text, nullable=True)
    sources         = Column(JSON, nullable=True)   # list of SOP IDs used
    confidence      = Column(Float, nullable=True)
    response_time_ms= Column(Integer, nullable=True)
    department      = Column(String(100), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    user            = relationship("User", back_populates="queries")
