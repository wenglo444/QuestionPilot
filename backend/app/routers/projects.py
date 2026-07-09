"""Project CRUD endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models import Project, User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
)

router = APIRouter(prefix="/api/projects", tags=["Projects"])


# ---------------------------------------------------------------------------
# GET /api/projects — list user's projects
# ---------------------------------------------------------------------------
@router.get("", response_model=ProjectListResponse)
async def list_projects(
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 50,
):
    """List projects. Optionally filter by user_id."""
    query = select(Project).offset(skip).limit(limit).order_by(Project.updated_at.desc())
    if user_id:
        query = query.where(Project.user_id == user_id)

    result = await db.execute(query)
    projects = result.scalars().all()

    count_query = select(func.count(Project.id))
    if user_id:
        count_query = count_query.where(Project.user_id == user_id)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
    )


# ---------------------------------------------------------------------------
# POST /api/projects — create project
# ---------------------------------------------------------------------------
@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new project."""
    # TODO: Replace with authenticated user_id from auth middleware
    demo_user_query = select(User).where(User.email == "demo@questionpilot.io")
    result = await db.execute(demo_user_query)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authenticated user found. Run seed script first.",
        )

    project = Project(
        id=uuid.uuid4(),
        user_id=user.id,
        name=payload.name,
        description=payload.description,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


# ---------------------------------------------------------------------------
# GET /api/projects/{project_id} — get project
# ---------------------------------------------------------------------------
@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single project by ID."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return ProjectResponse.model_validate(project)


# ---------------------------------------------------------------------------
# PUT /api/projects/{project_id} — update project
# ---------------------------------------------------------------------------
@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    payload: ProjectUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description

    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


# ---------------------------------------------------------------------------
# DELETE /api/projects/{project_id} — delete project
# ---------------------------------------------------------------------------
@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a project and all associated data."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    await db.delete(project)
    await db.commit()