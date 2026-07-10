"""Pydantic schemas for Document endpoints."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    """Schema for document response."""

    id: UUID
    project_id: UUID
    filename: str
    file_type: str
    file_size: int
    status: str  # "processing", "ready", "error"
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentUploadResponse(BaseModel):
    """Schema for document upload response."""

    documents: list[DocumentResponse]
    message: str = Field(default="Documents uploaded successfully")


class DocumentStatusResponse(BaseModel):
    """Schema for document processing status."""

    id: UUID
    filename: str
    status: str
    error_message: Optional[str] = None
    chunks_count: int = Field(default=0, description="Number of processed chunks")