"""Celery tasks for document processing pipeline."""

import uuid
import logging
from typing import Optional

from sqlalchemy import select, update

from worker.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models import Document, DocumentChunk, Questionnaire, Question, Project
from app.services.document_processor import DocumentProcessor
from app.services.embedding import embedding_service
from app.services.answer_generator import answer_generator

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_document(self, document_id: str) -> dict:
    """Process a document: parse, chunk, and generate embeddings.

    This is a Celery task that runs asynchronously after document upload.

    Args:
        document_id: UUID string of the document to process.

    Returns:
        dict with status summary.
    """
    import asyncio

    async def _process():
        async with AsyncSessionLocal() as db:
            # Get document
            result = await db.execute(
                select(Document).where(Document.id == uuid.UUID(document_id))
            )
            doc = result.scalar_one_or_none()
            if not doc:
                raise ValueError(f"Document {document_id} not found")

            try:
                # Update status to processing
                doc.status = "processing"
                await db.commit()

                # Extract and chunk
                processor = DocumentProcessor()
                chunks = await processor.process_document(
                    file_path=doc.storage_path,
                    file_type=doc.file_type,
                    metadata={"project_id": str(doc.project_id)},
                )

                if not chunks:
                    doc.status = "ready"
                    doc.error_message = "No text content extracted from document"
                    await db.commit()
                    return {
                        "document_id": document_id,
                        "status": "ready",
                        "chunks_count": 0,
                        "embedded_count": 0,
                    }

                # Store chunks in database
                chunk_records = []
                for chunk_data in chunks:
                    chunk = DocumentChunk(
                        id=uuid.uuid4(),
                        document_id=doc.id,
                        chunk_index=chunk_data["chunk_index"],
                        content=chunk_data["content"],
                        metadata=chunk_data.get("metadata", {}),
                    )
                    db.add(chunk)
                    chunk_records.append(chunk)

                await db.commit()

                # Refresh to get IDs
                chunk_dicts = []
                for chunk in chunk_records:
                    await db.refresh(chunk)
                    chunk_dicts.append({
                        "id": chunk.id,
                        "content": chunk.content,
                    })

                # Generate embeddings
                try:
                    embedded_count = await embedding_service.embed_chunks_batch(
                        chunks=chunk_dicts,
                        db=db,
                    )
                except Exception as e:
                    logger.warning(
                        f"Embedding generation failed for {document_id}: {e}"
                    )
                    embedded_count = 0

                # Mark document as ready
                doc.status = "ready"
                await db.commit()

                return {
                    "document_id": document_id,
                    "status": "ready",
                    "chunks_count": len(chunk_records),
                    "embedded_count": embedded_count,
                }

            except Exception as e:
                # Mark document as error
                doc.status = "error"
                doc.error_message = str(e)
                await db.commit()
                raise

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(_process())


@celery_app.task(bind=True, max_retries=2, default_retry_delay=60)
def generate_answers(self, questionnaire_id: str) -> dict:
    """Generate answers for all questions in a questionnaire.

    This is a Celery task that runs asynchronously after questionnaire upload.

    Args:
        questionnaire_id: UUID string of the questionnaire.

    Returns:
        dict with generation summary.
    """
    import asyncio

    async def _generate():
        async with AsyncSessionLocal() as db:
            q_id = uuid.UUID(questionnaire_id)

            # Verify questionnaire exists
            result = await db.execute(
                select(Questionnaire).where(Questionnaire.id == q_id)
            )
            questionnaire = result.scalar_one_or_none()
            if not questionnaire:
                raise ValueError(f"Questionnaire {questionnaire_id} not found")

            # Check if there are documents in the project
            doc_result = await db.execute(
                select(Document).where(
                    Document.project_id == questionnaire.project_id,
                    Document.status == "ready",
                ).limit(1)
            )
            has_documents = doc_result.scalar_one_or_none() is not None

            if not has_documents:
                # Create placeholder answers
                questions_result = await db.execute(
                    select(Question).where(Question.questionnaire_id == q_id)
                )
                questions = questions_result.scalars().all()

                for question in questions:
                    answer = DocumentChunk.__class__.__bases__  # skip
                    from app.models import Answer
                    ans = Answer(
                        id=uuid.uuid4(),
                        question_id=question.id,
                        ai_answer="No documents have been uploaded yet. Please upload relevant documents first, then regenerate answers.",
                        confidence_score=0.0,
                        citations=[],
                        status="pending",
                    )
                    db.add(ans)

                questionnaire.status = "in_progress"
                await db.commit()

                return {
                    "questionnaire_id": questionnaire_id,
                    "total_questions": len(questions),
                    "generated": len(questions),
                    "failed": 0,
                    "message": "No documents found. Placeholder answers created.",
                }

            # Use the answer generator
            result = await answer_generator.generate_answers_for_questionnaire(
                questionnaire_id=q_id,
                db=db,
            )

            return {
                "questionnaire_id": questionnaire_id,
                **result,
                "message": f"Generated {result['generated']} answers, {result['failed']} failed",
            }

    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(_generate())