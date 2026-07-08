"""Answer generator service — uses LLM to generate answers with citations."""

import json
import uuid
from typing import Optional

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.models import Answer, Question, DocumentChunk, Questionnaire
from app.services.embedding import embedding_service
from app.services.rag import rag_service


SYSTEM_PROMPT = """You are an expert RFP response specialist. Your job is to answer questions accurately based ONLY on the provided context documents.

Rules:
1. Answer based ONLY on the provided context. Never fabricate facts or make up information.
2. If the context doesn't contain enough information to answer the question, say so clearly.
3. Cite specific sources for each claim using the [Source N] format.
4. Be concise and professional. Use business-appropriate language.
5. Include specific numbers, dates, and details when available in the context.
6. If the question is about security/compliance certifications, list them precisely.
7. Format answers in clear paragraphs, not bullet points unless the context uses lists."""


class AnswerGenerator:
    """Generates AI answers for questionnaire questions using RAG and LLM."""

    def __init__(self):
        self._openai_client: Optional[AsyncOpenAI] = None
        self._anthropic_client: Optional[AsyncAnthropic] = None

    @property
    def openai_client(self) -> AsyncOpenAI:
        if self._openai_client is None:
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                raise ValueError("OPENAI_API_KEY is not set")
            self._openai_client = AsyncOpenAI(api_key=api_key)
        return self._openai_client

    @property
    def anthropic_client(self) -> AsyncAnthropic:
        if self._anthropic_client is None:
            api_key = settings.ANTHROPIC_API_KEY
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY is not set")
            self._anthropic_client = AsyncAnthropic(api_key=api_key)
        return self._anthropic_client

    async def generate_answer(
        self,
        question: Question,
        project_id: uuid.UUID,
        db: AsyncSession,
    ) -> dict:
        """Generate an answer for a single question using RAG + LLM.

        Returns dict with: answer, confidence_score, citations[]
        """
        # 1. Embed the question
        try:
            query_embedding = await embedding_service.generate_embedding(
                question.question_text
            )
        except Exception as e:
            return {
                "answer": f"Error generating embedding: {e}",
                "confidence_score": 0.0,
                "citations": [],
                "error": str(e),
            }

        # 2. Search for relevant chunks
        try:
            chunks = await rag_service.search(
                query_embedding=query_embedding,
                project_id=str(project_id),
                db=db,
            )
        except Exception as e:
            return {
                "answer": f"Error searching document chunks: {e}",
                "confidence_score": 0.0,
                "citations": [],
                "error": str(e),
            }

        # 3. Format context
        context = rag_service.format_context(chunks)

        # 4. Calculate confidence score
        confidence = self._calculate_confidence(chunks)

        # 5. Generate answer via LLM
        try:
            llm_answer = await self._call_llm(question.question_text, context)
        except Exception as e:
            llm_answer = f"Error generating answer: {e}"
            confidence = 0.0

        # 6. Build citations
        citations = [
            {
                "chunk_id": c["chunk_id"],
                "document_id": c["document_id"],
                "text": c["content"][:200],  # Truncate for storage
                "score": c["score"],
            }
            for c in chunks
        ]

        return {
            "answer": llm_answer,
            "confidence_score": round(confidence, 2),
            "citations": citations,
        }

    async def generate_answers_for_questionnaire(
        self,
        questionnaire_id: uuid.UUID,
        db: AsyncSession,
        regenerate: bool = False,
    ) -> dict:
        """Generate answers for all unanswered questions in a questionnaire.

        Returns summary dict with: total, generated, failed.
        """
        # Get the questionnaire to find project_id
        q_result = await db.execute(
            select(Questionnaire).where(Questionnaire.id == questionnaire_id)
        )
        questionnaire = q_result.scalar_one_or_none()
        if not questionnaire:
            raise ValueError(f"Questionnaire {questionnaire_id} not found")

        # Get all questions
        questions_result = await db.execute(
            select(Question).where(Question.questionnaire_id == questionnaire_id)
        )
        questions = questions_result.scalars().all()

        generated = 0
        failed = 0
        total = len(questions)

        for question in questions:
            # Skip if answer exists and not regenerating
            if not regenerate:
                existing = await db.execute(
                    select(Answer).where(Answer.question_id == question.id)
                )
                if existing.scalar_one_or_none():
                    continue

            # Generate answer
            result = await self.generate_answer(
                question=question,
                project_id=questionnaire.project_id,
                db=db,
            )

            if result.get("error"):
                # Create answer with error state
                answer = Answer(
                    id=uuid.uuid4(),
                    question_id=question.id,
                    ai_answer=result["answer"],
                    confidence_score=0.0,
                    citations=[],
                    status="pending",
                )
                failed += 1
            else:
                answer = Answer(
                    id=uuid.uuid4(),
                    question_id=question.id,
                    ai_answer=result["answer"],
                    confidence_score=result["confidence_score"],
                    citations=result["citations"],
                    status="pending",
                )
                generated += 1

            db.add(answer)

        # Update questionnaire status
        questionnaire.status = "in_progress"
        await db.commit()

        return {
            "total": total,
            "generated": generated,
            "failed": failed,
        }

    def _calculate_confidence(self, chunks: list[dict]) -> float:
        """Calculate confidence score based on retrieved chunks.

        Factors:
        - Number of chunks found (more = better)
        - Average similarity score
        - Score distribution
        """
        if not chunks:
            return 0.0

        avg_score = sum(c["score"] for c in chunks) / len(chunks)
        coverage = min(len(chunks) / settings.RAG_TOP_K, 1.0)

        # Weighted combination
        confidence = 0.6 * avg_score + 0.4 * coverage
        return max(0.0, min(1.0, confidence))

    async def _call_llm(self, question: str, context: str) -> str:
        """Call the configured LLM to generate an answer."""
        provider = settings.DEFAULT_LLM_PROVIDER
        model = settings.DEFAULT_LLM_MODEL

        prompt = f"""Context documents:
{context}

Question: {question}

Answer the question based only on the context above. If the context doesn't have enough information, say so."""

        if provider == "openai":
            response = await self.openai_client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                max_tokens=2048,
            )
            return response.choices[0].message.content or ""

        elif provider == "anthropic":
            response = await self.anthropic_client.messages.create(
                model=model,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2048,
                temperature=0.1,
            )
            return response.content[0].text if response.content else ""

        else:
            raise ValueError(f"Unknown LLM provider: {provider}")


answer_generator = AnswerGenerator()