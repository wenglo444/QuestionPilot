"""Export endpoint for questionnaires."""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models import Questionnaire, Question, Answer

router = APIRouter(tags=["Export"])


# ---------------------------------------------------------------------------
# GET /api/questionnaires/{q_id}/export?format=xlsx|docx|pdf
# ---------------------------------------------------------------------------
@router.get("/api/questionnaires/{q_id}/export")
async def export_questionnaire(
    q_id: uuid.UUID,
    format: Literal["xlsx", "docx", "pdf"] = Query(
        "xlsx", description="Export format"
    ),
    db: Annotated[AsyncSession, Depends(get_db)] = Depends(get_db),
):
    """Export a completed questionnaire in the requested format.

    This is a placeholder implementation. The actual export service
    (Milestone 3) will generate proper Excel, Word, and PDF files.
    """
    # Verify questionnaire exists
    result = await db.execute(
        select(Questionnaire).where(Questionnaire.id == q_id)
    )
    questionnaire = result.scalar_one_or_none()
    if not questionnaire:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Questionnaire not found",
        )

    # Get questions with answers
    questions_result = await db.execute(
        select(Question)
        .where(Question.questionnaire_id == q_id)
        .order_by(Question.question_number)
    )
    questions = questions_result.scalars().all()

    # Build simple JSON export as placeholder
    # Milestone 3 will replace this with proper file generation
    export_data = {
        "title": questionnaire.title,
        "status": questionnaire.status,
        "created_at": questionnaire.created_at.isoformat(),
        "questions": [],
    }

    for question in questions:
        answer_result = await db.execute(
            select(Answer).where(Answer.question_id == question.id)
        )
        answer = answer_result.scalar_one_or_none()
        export_data["questions"].append({
            "section": question.section,
            "question_number": question.question_number,
            "question_text": question.question_text,
            "answer": answer.final_answer or answer.ai_answer if answer else None,
            "confidence": answer.confidence_score if answer else None,
            "status": answer.status if answer else "pending",
        })

    # Return JSON for now (Milestone 3 will implement real file export)
    import json
    content = json.dumps(export_data, indent=2, default=str)

    return Response(
        content=content,
        media_type="application/json",
        headers={
            "Content-Disposition": f'attachment; filename="{questionnaire.title}_export.json"',
        },
    )