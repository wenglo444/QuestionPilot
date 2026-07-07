"""Questionnaire and Question models."""

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base import Base


class Questionnaire(Base):
    __tablename__ = "questionnaires"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # "xlsx", "docx", "pdf", "csv"
    status = Column(String(20), default="draft", nullable=False)  # "draft", "in_progress", "completed"
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    project = relationship("Project", back_populates="questionnaires")
    questions = relationship("Question", back_populates="questionnaire", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Questionnaire {self.title}>"


class Question(Base):
    __tablename__ = "questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    questionnaire_id = Column(UUID(as_uuid=True), ForeignKey("questionnaires.id", ondelete="CASCADE"), nullable=False, index=True)
    section = Column(String(500), nullable=True)  # Optional section/group name
    question_text = Column(Text, nullable=False)
    question_number = Column(Integer, nullable=True)  # For ordered lists
    row_index = Column(Integer, nullable=True)  # For spreadsheet row mapping
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    questionnaire = relationship("Questionnaire", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Question {self.questionnaire_id}:{self.question_number}>"
