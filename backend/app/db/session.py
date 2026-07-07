"""Database session management with async and sync support."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as SASession
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.config import settings


# ---------------------------------------------------------------------------
# Synchronous engine (for Alembic and quick operations)
# ---------------------------------------------------------------------------
sync_engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
)

SyncSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


def get_sync_db() -> SASession:
    """FastAPI dependency: yields a synchronous database session."""
    db = SyncSessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Async engine (for production API endpoints)
# ---------------------------------------------------------------------------
# Replace postgresql:// with postgresql+asyncpg://
async_database_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

async_engine = create_async_engine(
    async_database_url,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=async_engine, class_=AsyncSession
)


async def get_db() -> AsyncSession:
    """FastAPI dependency: yields an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


def init_db() -> None:
    """Create all tables. Used in startup."""
    from app.db.base import Base
    Base.metadata.create_all(bind=sync_engine)