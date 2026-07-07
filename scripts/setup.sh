#!/bin/bash
# QuestionPilot Setup Script
# Run this script after cloning to set up the development environment.

set -e

echo "=== Setting up QuestionPilot Development Environment ==="

# Copy .env if not exists
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example — edit it with your API keys."
fi

# Create uploads directory
mkdir -p uploads
touch uploads/.gitkeep

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Initialize database
echo "Running database migrations..."
cd backend
alembic upgrade head
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Start the backend:  cd backend && uvicorn app.main:app --reload"
echo "Start the worker:   cd backend && celery -A worker.celery_app worker --loglevel=info"
echo "Start with Docker:  docker compose up -d"
