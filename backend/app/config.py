"""Application configuration via pydantic-settings."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "QuestionPilot API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/questionpilot"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Auth
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # LLM
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    DEFAULT_LLM_PROVIDER: str = "openai"  # "openai" or "anthropic"
    DEFAULT_LLM_MODEL: str = "gpt-4o"

    # Embeddings
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    # RAG
    RAG_TOP_K: int = 5
    RAG_MIN_CONFIDENCE: float = 0.3
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # File upload
    UPLOAD_DIR: str = "/app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = [
        ".pdf", ".docx", ".xlsx", ".xls", ".md", ".txt", ".csv"
    ]

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://717d6eb09b95cecdefa4c815d1a07ddb.ctonew.app",
    ]

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
