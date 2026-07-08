"""RAG (Retrieval-Augmented Generation) service."""

from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import DocumentChunk, Document


class RAGService:
    """Handles vector similarity search for relevant document chunks."""

    async def search(
        self,
        query_embedding: list[float],
        project_id: str,
        db: AsyncSession,
        top_k: int | None = None,
        min_score: float | None = None,
    ) -> list[dict]:
        """Search for the most relevant document chunks using cosine similarity.

        Args:
            query_embedding: The embedding vector of the query.
            project_id: Only search chunks belonging to this project.
            db: Async database session.
            top_k: Number of results to return (default: settings.RAG_TOP_K).
            min_score: Minimum similarity score threshold.

        Returns:
            List of dicts with keys: chunk_id, document_id, content, score, metadata.
        """
        top_k = top_k or settings.RAG_TOP_K
        min_score = min_score or settings.RAG_MIN_CONFIDENCE

        # Use pgvector's cosine distance operator (<=>)
        # 1 - cosine_distance = cosine_similarity
        embedding_str = f"[{','.join(str(v) for v in query_embedding)}]"

        sql = text("""
            SELECT
                dc.id AS chunk_id,
                dc.document_id,
                dc.content,
                dc.metadata,
                d.filename,
                d.project_id,
                1 - (dc.embedding <=> :embedding::vector) AS similarity_score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE d.project_id = :project_id
              AND dc.embedding IS NOT NULL
              AND 1 - (dc.embedding <=> :embedding::vector) >= :min_score
            ORDER BY dc.embedding <=> :embedding::vector
            LIMIT :top_k
        """)

        result = await db.execute(
            sql,
            {
                "embedding": embedding_str,
                "project_id": project_id,
                "min_score": min_score,
                "top_k": top_k,
            },
        )
        rows = result.all()

        return [
            {
                "chunk_id": str(row.chunk_id),
                "document_id": str(row.document_id),
                "content": row.content,
                "score": float(row.similarity_score),
                "filename": row.filename,
                "metadata": row.metadata,
            }
            for row in rows
        ]

    def format_context(self, chunks: list[dict]) -> str:
        """Format retrieved chunks into a context string for the LLM.

        Args:
            chunks: List of chunk dicts from search().

        Returns:
            Formatted context string with source references.
        """
        if not chunks:
            return "No relevant documents found."

        parts = []
        for i, chunk in enumerate(chunks, 1):
            source = chunk.get("filename", "Unknown")
            score = chunk.get("score", 0)
            parts.append(
                f"[Source {i}: {source} (relevance: {score:.2f})]\n{chunk['content']}"
            )

        return "\n\n---\n\n".join(parts)


rag_service = RAGService()