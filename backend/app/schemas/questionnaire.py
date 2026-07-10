"""Pydantic schemas for Questionnaire and Question endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class QuestionResponse(BaseModel):
    """Schema for a single question."""

    id: UUID
    questionnaire_id: UUID
    section: Optional[str] = None
    question_text: str
    question_number: Optional[int] = None
    row_index: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class QuestionnaireResponse(BaseModel):
    """Schema for questionnaire response."""

    id: UUID
    project_id: UUID
    title: str
    original_filename: str
    file_type: str
    status: str  # "draft", "in_progress", "completed"
    created_at: datetime
    questions: list[QuestionResponse] = []

    model_config = {"from_attributes": True}


class QuestionnaireListResponse(BaseModel):
    """Schema for list of questionnaires."""

    questionnaires: list[QuestionnaireResponse]
    total: int


class QuestionnaireUploadResponse(BaseModel):
    """Schema for questionnaire upload response."""

    id: UUID
    title: str
    questions_count: int = Field(default=0)
    message: str = Field(default="Questionnaire uploaded successfully")