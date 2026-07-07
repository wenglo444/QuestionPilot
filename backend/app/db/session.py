"""Database session management with async and sync support."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session as SASession

from app.config import settings


# Synchronous engine (for Alembic and quick operations)
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
)

# Synchronous session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> SASession:
    """FastAPI dependency: yields a database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Used in startup."""
    from app.db.base import Base
    Base.metadata.create_all(bind=engine)
