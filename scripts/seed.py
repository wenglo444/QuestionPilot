#!/usr/bin/env python
"""Seed script for populating the database with demo data."""

import uuid
import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db.session import SessionLocal, init_db
from app.models import User, Project


def seed():
    """Create demo data."""
    init_db()
    db = SessionLocal()

    try:
        # Check if demo user exists
        existing = db.query(User).filter(User.email == "demo@questionpilot.io").first()
        if existing:
            print("Demo data already exists. Skipping.")
            return

        # Create demo user
        user = User(
            id=uuid.uuid4(),
            email="demo@questionpilot.io",
            name="Demo User",
            provider="email",
        )
        db.add(user)
        db.flush()

        # Create demo project
        project = Project(
            id=uuid.uuid4(),
            user_id=user.id,
            name="Demo Project - SOC2 Compliance",
            description="A sample project for testing SOC2 compliance questionnaire automation.",
        )
        db.add(project)
        db.commit()

        print(f"Created demo user: {user.email}")
        print(f"Created demo project: {project.name}")
        print("Seed complete!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
