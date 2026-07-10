"""Pydantic schemas for Dashboard stats."""

from pydantic import BaseModel, Field


class ProjectStat(BaseModel):
    """Stat card for a single metric."""

    label: str
    value: int
    change: float = Field(default=0.0, description="Percentage change vs previous period")


class DocumentTypeStat(BaseModel):
    """Document count by type."""

    type: str  # pdf, docx, xlsx, md, txt, csv
    count: int


class ReviewStatusStat(BaseModel):
    """Answer counts by review status."""

    approved: int = 0
    rejected: int = 0
    pending: int = 0
    edited: int = 0


class MonthlyQuestionnaireStat(BaseModel):
    """Questionnaires completed per month."""

    month: str  # "2026-01"
    count: int


class DashboardStats(BaseModel):
    """Aggregated dashboard statistics."""

    active_projects: int = 0
    total_questionnaires: int = 0
    total_documents: int = 0
    time_saved_hours: float = 0.0
    avg_confidence: float = 0.0
    documents_by_type: list[DocumentTypeStat] = []
    review_status_breakdown: ReviewStatusStat = ReviewStatusStat()
    questionnaires_over_time: list[MonthlyQuestionnaireStat] = []
    recent_activity: list[dict] = []