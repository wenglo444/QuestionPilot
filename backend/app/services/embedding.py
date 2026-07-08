"""Embedding service — generate vector embeddings for document chunks."""

import asyncio
from typing import Optional

from openai import AsyncOpenAI
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.models import DocumentChunk


class EmbeddingService:
    """Generates and manages vector embeddings for document chunks."""

    def __init__(self):
        self._openai_client: Optional[AsyncOpenAI] = None

    @property
    def openai_client(self) -> AsyncOpenAI:
        if self._openai_client is None:
            api_key = settings.OPENAI_API_KEY
            if not api_key:
                raise ValueError(
                    "OPENAI_API_KEY is not set. Configure it in .env or environment."
                )
            self._openai_client = AsyncOpenAI(api_key=api_key)
        return self._openai_client

    async def generate_embedding(self, text: str) -> list[float]:
        """Generate a single embedding vector for the given text."""
        response = await self.openai_client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text,
            dimensions=settings.EMBEDDING_DIMENSIONS,
        )
        return response.data[0].embedding

    async def generate_embeddings_batch(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for multiple texts in a single API call."""
        response = await self.openai_client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=texts,
            dimensions=settings.EMBEDDING_DIMENSIONS,
        )
        # Sort by index to maintain ordering
        sorted_data = sorted(response.data, key=lambda x: x.index)
        return [item.embedding for item in sorted_data]

    async def embed_chunk(self, chunk_id: str, content: str) -> list[float]:
        """Generate embedding for a single chunk and return it."""
        embedding = await self.generate_embedding(content)

        # Store embedding in database
        async with AsyncSessionLocal() as db:
            stmt = (
                update(DocumentChunk)
                .where(DocumentChunk.id == chunk_id)
                .values(embedding=embedding)
            )
            await db.execute(stmt)
            await db.commit()

        return embedding

    async def embed_chunks_batch(
        self,
        chunks: list[dict],
        db: AsyncSession,
    ) -> int:
        """Generate embeddings for a list of chunks and store them.

        Args:
            chunks: List of dicts with 'id' and 'content' keys.
            db: Async database session.

        Returns:
            Number of chunks successfully embedded.
        """
        texts = [chunk["content"] for chunk in chunks]
        if not texts:
            return 0

        try:
            embeddings = await self.generate_embeddings_batch(texts)
        except Exception as e:
            raise RuntimeError(f"Embedding generation failed: {e}") from e

        embedded_count = 0
        for chunk, embedding in zip(chunks, embeddings):
            stmt = (
                update(DocumentChunk)
                .where(DocumentChunk.id == chunk["id"])
                .values(embedding=embedding)
            )
            await db.execute(stmt)
            embedded_count += 1

        await db.commit()
        return embedded_count


embedding_service = EmbeddingService()
