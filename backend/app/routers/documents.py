"""Document upload, listing, and deletion endpoints."""

import uuid
import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models import Project, Document, DocumentChunk
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentStatusResponse,
)
from app.config import settings

router = APIRouter(prefix="/api/projects", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".xls", ".md", ".txt", ".csv"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


def _get_file_type(filename: str) -> str:
    """Extract file type from filename."""
    ext = os.path.splitext(filename)[1].lower().lstrip(".")
    if ext in ("xlsx", "xls"):
        return "xlsx"
    return ext


# ---------------------------------------------------------------------------
# POST /api/projects/{project_id}/documents/upload
# ---------------------------------------------------------------------------
@router.post("/{project_id}/documents/upload", response_model=DocumentUploadResponse)
async def upload_documents(
    project_id: uuid.UUID,
    files: list[UploadFile] = File(..., description="One or more files to upload"),
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Upload one or more documents to a project."""
    # Verify project exists
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    uploaded_docs = []
    for file in files:
        # Validate file extension
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{ext}' is not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )

        # Read file content
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{file.filename}' exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB",
            )

        # Create storage path
        file_id = uuid.uuid4()
        storage_dir = os.path.join(settings.UPLOAD_DIR, str(project_id))
        os.makedirs(storage_dir, exist_ok=True)
        storage_path = os.path.join(storage_dir, f"{file_id}{ext}")

        # Write file to disk
        with open(storage_path, "wb") as f:
            f.write(content)

        # Create document record
        doc = Document(
            id=file_id,
            project_id=project_id,
            filename=file.filename or "unnamed",
            file_type=_get_file_type(file.filename or ""),
            file_size=len(content),
            storage_path=storage_path,
            status="processing",
        )
        db.add(doc)
        uploaded_docs.append(doc)

    await db.commit()
    for doc in uploaded_docs:
        await db.refresh(doc)

    return DocumentUploadResponse(
        documents=[DocumentResponse.model_validate(d) for d in uploaded_docs],
        message=f"{len(uploaded_docs)} document(s) uploaded successfully",
    )


# ---------------------------------------------------------------------------
# GET /api/projects/{project_id}/documents — list documents
# ---------------------------------------------------------------------------
@router.get("/{project_id}/documents")
async def list_documents(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    file_type: str | None = Query(None, description="Filter by file type"),
    status: str | None = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
):
    """List documents for a project."""
    query = (
        select(Document)
        .where(Document.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .order_by(Document.created_at.desc())
    )
    if file_type:
        query = query.where(Document.file_type == file_type)
    if status:
        query = query.where(Document.status == status)

    result = await db.execute(query)
    documents = result.scalars().all()

    count_query = select(func.count(Document.id)).where(Document.project_id == project_id)
    if file_type:
        count_query = count_query.where(Document.file_type == file_type)
    if status:
        count_query = count_query.where(Document.status == status)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return {
        "documents": [DocumentResponse.model_validate(d) for d in documents],
        "total": total,
    }


# ---------------------------------------------------------------------------
# GET /api/projects/{project_id}/documents/{doc_id} — get document
# ---------------------------------------------------------------------------
@router.get("/{project_id}/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    project_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single document by ID."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.project_id == project_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse.model_validate(doc)


# ---------------------------------------------------------------------------
# GET /api/projects/{project_id}/documents/{doc_id}/status
# ---------------------------------------------------------------------------
@router.get("/{project_id}/documents/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    project_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Check document processing status."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.project_id == project_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Count chunks
    chunk_count = await db.execute(
        select(func.count(DocumentChunk.id)).where(DocumentChunk.document_id == doc_id)
    )
    chunks_count = chunk_count.scalar() or 0

    return DocumentStatusResponse(
        id=doc.id,
        filename=doc.filename,
        status=doc.status,
        error_message=doc.error_message,
        chunks_count=chunks_count,
    )


# ---------------------------------------------------------------------------
# DELETE /api/projects/{project_id}/documents/{doc_id} — delete document
# ---------------------------------------------------------------------------
@router.delete("/{project_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    project_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a document and its chunks."""
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.project_id == project_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    # Delete file from disk
    if os.path.exists(doc.storage_path):
        os.remove(doc.storage_path)

    await db.delete(doc)
    await db.commit()