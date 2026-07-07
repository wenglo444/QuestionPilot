"""Answer model."""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base


class Answer(Base):
    __tablename__ = "answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_answer = Column(Text, nullable=True)
    final_answer = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=True)
    citations = Column(JSONB, default=list, nullable=False)  # List of {"chunk_id": ..., "document_id": ..., "text": ..., "score": ...}
    status = Column(String(20), default="pending", nullable=False)  # "pending", "approved", "rejected", "edited"
    edited_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    question = relationship("Question", back_populates="answers")

    def __repr__(self) -> str:
        return f"<Answer {self.question_id} [{self.status}]>"
