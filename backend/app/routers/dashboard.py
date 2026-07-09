"""Dashboard statistics endpoint."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models import Project, Document, Questionnaire, Answer
from app.schemas.dashboard import DashboardStats, ReviewStatusStat, DocumentTypeStat

router = APIRouter(tags=["Dashboard"])


# ---------------------------------------------------------------------------
# GET /api/dashboard/stats
# ---------------------------------------------------------------------------
@router.get("/api/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get aggregated dashboard statistics."""
    # Active projects
    projects_result = await db.execute(
        select(func.count(Project.id))
    )
    active_projects = projects_result.scalar() or 0

    # Total questionnaires
    q_result = await db.execute(
        select(func.count(Questionnaire.id))
    )
    total_questionnaires = q_result.scalar() or 0

    # Total documents
    d_result = await db.execute(
        select(func.count(Document.id))
    )
    total_documents = d_result.scalar() or 0

    # Documents by type
    type_result = await db.execute(
        select(Document.file_type, func.count(Document.id))
        .group_by(Document.file_type)
    )
    documents_by_type = [
        DocumentTypeStat(type=row[0], count=row[1])
        for row in type_result.all()
    ]

    # Answer review status breakdown
    status_result = await db.execute(
        select(Answer.status, func.count(Answer.id))
        .group_by(Answer.status)
    )
    review_status = ReviewStatusStat()
    status_map = dict(status_result.all())
    review_status.approved = status_map.get("approved", 0)
    review_status.rejected = status_map.get("rejected", 0)
    review_status.pending = status_map.get("pending", 0)
    review_status.edited = status_map.get("edited", 0)

    # Average confidence score
    confidence_result = await db.execute(
        select(func.avg(Answer.confidence_score))
        .where(Answer.confidence_score.isnot(None))
    )
    avg_confidence = float(confidence_result.scalar() or 0.0)

    # Time saved estimation (rough: 2 hours per completed questionnaire)
    completed_q = await db.execute(
        select(func.count(Questionnaire.id))
        .where(Questionnaire.status == "completed")
    )
    completed_count = completed_q.scalar() or 0
    time_saved_hours = completed_count * 2.0  # 2 hours saved per questionnaire

    return DashboardStats(
        active_projects=active_projects,
        total_questionnaires=total_questionnaires,
        total_documents=total_documents,
        time_saved_hours=time_saved_hours,
        avg_confidence=round(avg_confidence, 2),
        documents_by_type=documents_by_type,
        review_status_breakdown=review_status,
        questionnaires_over_time=[],
        recent_activity=[],
    )