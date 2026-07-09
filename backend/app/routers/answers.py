"""Question and Answer endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models import Questionnaire, Question, Answer
from app.schemas.answer import (
    AnswerResponse,
    AnswerUpdate,
    AnswerStatusUpdate,
    AnswerGenerateRequest,
    AnswerGenerateResponse,
    Citation,
)
from app.schemas.questionnaire import QuestionResponse

router = APIRouter(tags=["Answers"])


# ---------------------------------------------------------------------------
# GET /api/questionnaires/{q_id}/questions — get all questions
# ---------------------------------------------------------------------------
@router.get("/api/questionnaires/{q_id}/questions")
async def list_questions(
    q_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    with_answers: bool = False,
):
    """Get all questions for a questionnaire, optionally with answers."""
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

    # Get questions
    questions_result = await db.execute(
        select(Question)
        .where(Question.questionnaire_id == q_id)
        .order_by(Question.question_number)
    )
    questions = questions_result.scalars().all()

    if with_answers:
        # Get answers for all questions
        question_ids = [q.id for q in questions]
        if question_ids:
            answers_result = await db.execute(
                select(Answer).where(Answer.question_id.in_(question_ids))
            )
            answers = answers_result.scalars().all()
            answer_map = {str(a.question_id): a for a in answers}
        else:
            answer_map = {}

        items = []
        for q in questions:
            answer = answer_map.get(str(q.id))
            items.append({
                "question": QuestionResponse.model_validate(q),
                "answer": AnswerResponse.model_validate(answer) if answer else None,
            })
        return {"questions": items, "total": len(items)}
    else:
        return {
            "questions": [QuestionResponse.model_validate(q) for q in questions],
            "total": len(questions),
        }


# ---------------------------------------------------------------------------
# POST /api/questionnaires/{q_id}/answers/generate — trigger AI generation
# ---------------------------------------------------------------------------
@router.post(
    "/api/questionnaires/{q_id}/answers/generate",
    response_model=AnswerGenerateResponse,
)
async def generate_answers(
    q_id: uuid.UUID,
    payload: AnswerGenerateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Trigger AI answer generation for all unanswered questions."""
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

    # Get all questions
    questions_result = await db.execute(
        select(Question).where(Question.questionnaire_id == q_id)
    )
    questions = questions_result.scalars().all()

    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No questions found in this questionnaire",
        )

    # For now, create placeholder answers (RAG pipeline will be integrated later)
    generated = 0
    failed = 0
    for question in questions:
        # Check if answer already exists
        existing = await db.execute(
            select(Answer).where(Answer.question_id == question.id)
        )
        if existing.scalar_one_or_none() and not payload.regenerate_all:
            continue

        # Create placeholder answer
        answer = Answer(
            id=uuid.uuid4(),
            question_id=question.id,
            ai_answer="Answer generation queued. The RAG pipeline will process this question.",
            status="pending",
            confidence_score=0.0,
            citations=[],
        )
        db.add(answer)
        generated += 1

    # Update questionnaire status
    questionnaire.status = "in_progress"
    await db.commit()

    return AnswerGenerateResponse(
        total_questions=len(questions),
        generated=generated,
        failed=failed,
        message=f"Queued {generated} answers for generation",
    )


# ---------------------------------------------------------------------------
# PUT /api/answers/{answer_id} — edit final answer
# ---------------------------------------------------------------------------
@router.put("/api/answers/{answer_id}", response_model=AnswerResponse)
async def update_answer(
    answer_id: uuid.UUID,
    payload: AnswerUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an answer's final answer (user edit)."""
    result = await db.execute(select(Answer).where(Answer.id == answer_id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    answer.final_answer = payload.final_answer
    answer.status = "edited"
    await db.commit()
    await db.refresh(answer)

    # Get associated question text
    question_result = await db.execute(
        select(Question).where(Question.id == answer.question_id)
    )
    question = question_result.scalar_one_or_none()

    return AnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        question_text=question.question_text if question else None,
        ai_answer=answer.ai_answer,
        final_answer=answer.final_answer,
        confidence_score=answer.confidence_score,
        citations=[Citation(**c) if isinstance(c, dict) else c for c in (answer.citations or [])],
        status=answer.status,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
    )


# ---------------------------------------------------------------------------
# POST /api/answers/{answer_id}/regenerate — regenerate single answer
# ---------------------------------------------------------------------------
@router.post("/api/answers/{answer_id}/regenerate", response_model=AnswerResponse)
async def regenerate_answer(
    answer_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Regenerate a single answer (placeholder - RAG integration later)."""
    result = await db.execute(select(Answer).where(Answer.id == answer_id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    # Reset for regeneration
    answer.ai_answer = "Regeneration queued. The RAG pipeline will process this question."
    answer.final_answer = None
    answer.status = "pending"
    answer.confidence_score = 0.0
    answer.citations = []
    await db.commit()
    await db.refresh(answer)

    # Get associated question text
    question_result = await db.execute(
        select(Question).where(Question.id == answer.question_id)
    )
    question = question_result.scalar_one_or_none()

    return AnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        question_text=question.question_text if question else None,
        ai_answer=answer.ai_answer,
        final_answer=answer.final_answer,
        confidence_score=answer.confidence_score,
        citations=[Citation(**c) if isinstance(c, dict) else c for c in (answer.citations or [])],
        status=answer.status,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
    )


# ---------------------------------------------------------------------------
# PATCH /api/answers/{answer_id}/status — approve/reject answer
# ---------------------------------------------------------------------------
@router.patch("/api/answers/{answer_id}/status", response_model=AnswerResponse)
async def update_answer_status(
    answer_id: uuid.UUID,
    payload: AnswerStatusUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Approve or reject an answer."""
    result = await db.execute(select(Answer).where(Answer.id == answer_id))
    answer = result.scalar_one_or_none()
    if not answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found",
        )

    answer.status = payload.status
    # If approved and no final_answer, copy the ai_answer
    if payload.status == "approved" and not answer.final_answer:
        answer.final_answer = answer.ai_answer

    await db.commit()
    await db.refresh(answer)

    # Get associated question text
    question_result = await db.execute(
        select(Question).where(Question.id == answer.question_id)
    )
    question = question_result.scalar_one_or_none()

    return AnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        question_text=question.question_text if question else None,
        ai_answer=answer.ai_answer,
        final_answer=answer.final_answer,
        confidence_score=answer.confidence_score,
        citations=[Citation(**c) if isinstance(c, dict) else c for c in (answer.citations or [])],
        status=answer.status,
        created_at=answer.created_at,
        updated_at=answer.updated_at,
    )