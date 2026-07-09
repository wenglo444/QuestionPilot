"""Questionnaire upload, listing, and management endpoints."""

import uuid
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models import Project, Questionnaire, Question
from app.schemas.questionnaire import (
    QuestionnaireResponse,
    QuestionnaireListResponse,
    QuestionnaireUploadResponse,
    QuestionResponse,
)
from app.config import settings

router = APIRouter(prefix="/api/projects", tags=["Questionnaires"])

ALLOWED_EXTENSIONS = {".xlsx", ".xls", ".docx", ".pdf", ".csv"}


def _get_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if ext in ("xlsx", "xls"):
        return "xlsx"
    return ext


# ---------------------------------------------------------------------------
# POST /api/projects/{project_id}/questionnaires/upload
# ---------------------------------------------------------------------------
@router.post("/{project_id}/questionnaires/upload", response_model=QuestionnaireUploadResponse)
async def upload_questionnaire(
    project_id: uuid.UUID,
    file: UploadFile = File(..., description="Questionnaire file (xlsx, docx, pdf, csv)"),
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Upload a questionnaire file to a project."""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read file
    content = await file.read()
    max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Save file to disk
    q_id = uuid.uuid4()
    storage_dir = os.path.join(settings.UPLOAD_DIR, str(project_id), "questionnaires")
    os.makedirs(storage_dir, exist_ok=True)
    storage_path = os.path.join(storage_dir, f"{q_id}{ext}")
    with open(storage_path, "wb") as f:
        f.write(content)

    # Create questionnaire record
    title = os.path.splitext(file.filename or "untitled")[0]
    questionnaire = Questionnaire(
        id=q_id,
        project_id=project_id,
        title=title,
        original_filename=file.filename or "unnamed",
        file_type=_get_file_type(file.filename or ""),
        status="draft",
    )
    db.add(questionnaire)
    await db.commit()
    await db.refresh(questionnaire)

    return QuestionnaireUploadResponse(
        id=questionnaire.id,
        title=questionnaire.title,
        questions_count=0,
        message="Questionnaire uploaded successfully. Questions will be extracted during processing.",
    )


# ---------------------------------------------------------------------------
# GET /api/projects/{project_id}/questionnaires — list questionnaires
# ---------------------------------------------------------------------------
@router.get("/{project_id}/questionnaires", response_model=QuestionnaireListResponse)
async def list_questionnaires(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: str | None = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List questionnaires for a project."""
    query = (
        select(Questionnaire)
        .where(Questionnaire.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .order_by(Questionnaire.created_at.desc())
    )
    if status:
        query = query.where(Questionnaire.status == status)

    result = await db.execute(query)
    questionnaires = result.scalars().all()

    count_query = select(func.count(Questionnaire.id)).where(
        Questionnaire.project_id == project_id
    )
    if status:
        count_query = count_query.where(Questionnaire.status == status)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return QuestionnaireListResponse(
        questionnaires=[
            QuestionnaireResponse.model_validate(q) for q in questionnaires
        ],
        total=total,
    )


# ---------------------------------------------------------------------------
# GET /api/projects/{project_id}/questionnaires/{q_id}
# ---------------------------------------------------------------------------
@router.get("/{project_id}/questionnaires/{q_id}", response_model=QuestionnaireResponse)
async def get_questionnaire(
    project_id: uuid.UUID,
    q_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a questionnaire with its questions."""
    result = await db.execute(
        select(Questionnaire)
        .where(Questionnaire.id == q_id, Questionnaire.project_id == project_id)
    )
    questionnaire = result.scalar_one_or_none()
    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found",
        )

    # Load questions
    questions_result = await db.execute(
        select(Question)
        .where(Question.questionnaire_id == q_id)
        .order_by(Question.question_number)
    )
    questions = questions_result.scalars().all()

    return QuestionnaireResponse(
        id=questionnaire.id,
        project_id=questionnaire.project_id,
        title=questionnaire.title,
        original_filename=questionnaire.original_filename,
        file_type=questionnaire.file_type,
        status=questionnaire.status,
        created_at=questionnaire.created_at,
        questions=[QuestionResponse.model_validate(q) for q in questions],
    )


# ---------------------------------------------------------------------------
# DELETE /api/projects/{project_id}/questionnaires/{q_id}
# ---------------------------------------------------------------------------
@router.delete(
    "/{project_id}/questionnaires/{q_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_questionnaire(
    project_id: uuid.UUID,
    q_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a questionnaire and its questions."""
    result = await db.execute(
        select(Questionnaire)
        .where(Questionnaire.id == q_id, Questionnaire.project_id == project_id)
    )
    questionnaire = result.scalar_one_or_none()
    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found",
        )

    # Delete file from disk
    storage_path = os.path.join(
        settings.UPLOAD_DIR,
        str(project_id),
        "questionnaires",
        f"{q_id}.{questionnaire.file_type}",
    )
    # Try alternative paths
    for ext in ("xlsx", "docx", "pdf", "csv"):
        alt_path = os.path.join(
            settings.UPLOAD_DIR,
            str(project_id),
            "questionnaires",
            f"{q_id}.{ext}",
        )
        if os.path.exists(alt_path):
            os.remove(alt_path)
            break

    await db.delete(questionnaire)
    await db.commit()