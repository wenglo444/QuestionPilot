"""Pydantic schemas for Answer endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Schema for a citation reference."""

    chunk_id: UUID
    document_id: UUID
    text: str
    score: float = Field(ge=0.0, le=1.0)
    page_number: Optional[int] = None


class AnswerResponse(BaseModel):
    """Schema for answer response (includes question text for context)."""

    id: UUID
    question_id: UUID
    question_text: Optional[str] = None
    ai_answer: Optional[str] = None
    final_answer: Optional[str] = None
    confidence_score: Optional[float] = None
    citations: list[Citation] = []
    status: str  # "pending", "approved", "rejected", "edited"
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnswerUpdate(BaseModel):
    """Schema for updating an answer's final answer."""

    final_answer: str = Field(..., min_length=1, description="The edited final answer")


class AnswerStatusUpdate(BaseModel):
    """Schema for updating answer status."""

    status: str = Field(
        ..., pattern="^(approved|rejected|pending)$",
        description="New status: approved, rejected, or pending"
    )


class AnswerGenerateRequest(BaseModel):
    """Schema for triggering answer generation."""

    regenerate_all: bool = Field(default=False, description="Regenerate all answers even if already generated")


class AnswerGenerateResponse(BaseModel):
    """Schema for answer generation response."""

    total_questions: int = Field(default=0)
    generated: int = Field(default=0)
    failed: int = Field(default=0)
    message: str = Field(default="Answer generation queued")