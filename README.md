# QuestionPilot

**AI-powered platform that automates RFP responses, security questionnaires, and compliance forms — reducing weeks of manual work to hours.**

Uses your existing documents as ground truth, never fabricates answers, and provides cited evidence for every response.

## Architecture

```
questionpilot/
├── frontend/          # Next.js 14 (App Router) + TypeScript
│   ├── app/           # Pages and API routes
│   ├── components/    # React components (shadcn/ui)
│   ├── lib/           # API client, auth, utilities
│   └── styles/        # Tailwind CSS
├── backend/           # FastAPI (Python 3.11+)
│   ├── app/
│   │   ├── models/    # SQLAlchemy models
│   │   ├── routers/   # REST API endpoints
│   │   ├── schemas/   # Pydantic schemas
│   │   └── services/  # Business logic
│   ├── worker/        # Celery tasks
│   └── tests/         # Pytest tests
├── docker-compose.yml # Local dev environment
└── scripts/           # Seed and setup scripts
```

## Tech Stack

### Frontend
- **Next.js 14** (App Router) — SSR, React Server Components
- **TypeScript** — Strict mode
- **Tailwind CSS 3** — Utility-first styling with Linear-inspired design system
- **shadcn/ui** — Component library (Radix UI primitives)
- **NextAuth.js 4** — Google + Microsoft OAuth
- **React Query** (@tanstack/react-query) — Server state management
- **Recharts** — Dashboard visualizations
- **react-dropzone** — File upload

### Backend
- **FastAPI** (Python 3.11+) — Async REST API
- **SQLAlchemy 2.0** + Alembic — ORM + migrations
- **PostgreSQL 15** + **pgvector** — Vector similarity search
- **Celery** + **Redis** — Background document processing
- **OpenAI/Anthropic** — LLM answer generation
- **LangChain** — RAG pipeline
- **WeasyPrint** — PDF export
- **openpyxl** — Excel read/write

### Infrastructure
- **Docker** + **docker-compose** — Local dev + production
- **Nginx** — Reverse proxy
- **MinIO** (dev) / **S3** (prod) — Document storage

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend dev without Docker)
- Python 3.11+ (for backend dev without Docker)

### Using Docker (recommended)

```bash
docker-compose up -d
```

This starts:
- Frontend at `http://localhost:3000`
- Backend API at `http://localhost:8000`
- PostgreSQL at `localhost:5432`
- Redis at `localhost:6379`
- MinIO at `localhost:9000`

### Manual Setup

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
# Edit .env with your settings
alembic upgrade head
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your OAuth credentials
npm run dev
```

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | App URL for NextAuth | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | JWT encryption secret | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `MICROSOFT_CLIENT_ID` | Microsoft OAuth client ID | — |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client secret | — |
| `MICROSOFT_TENANT_ID` | Azure AD tenant ID | `common` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `S3_ENDPOINT` | S3-compatible storage endpoint | — |
| `S3_ACCESS_KEY` | S3 access key | — |
| `S3_SECRET_KEY` | S3 secret key | — |
| `S3_BUCKET` | S3 bucket name | — |

## API Documentation

Once the backend is running, API docs are available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Core Endpoints

#### Auth
- `GET/POST /auth/login` — OAuth providers
- `GET /auth/callback` — OAuth callback

#### Projects
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/{id}` — Get project
- `PUT /api/projects/{id}` — Update project
- `DELETE /api/projects/{id}` — Delete project

#### Documents
- `POST /api/projects/{id}/documents/upload` — Upload document(s)
- `GET /api/projects/{id}/documents` — List documents
- `DELETE /api/projects/{id}/documents/{doc_id}` — Delete document
- `GET /api/projects/{id}/documents/{doc_id}/status` — Processing status

#### Questionnaires
- `POST /api/projects/{id}/questionnaires/upload` — Import questionnaire
- `GET /api/projects/{id}/questionnaires` — List questionnaires
- `GET /api/projects/{id}/questionnaires/{q_id}` — Get questionnaire
- `DELETE /api/projects/{id}/questionnaires/{q_id}` — Delete questionnaire

#### Questions & Answers
- `GET /api/questionnaires/{q_id}/questions` — List questions
- `POST /api/questionnaires/{q_id}/questions/generate-answers` — Generate AI answers
- `PUT /api/answers/{id}` — Edit answer
- `POST /api/answers/{id}/regenerate` — Regenerate answer
- `GET /api/answers/{id}/evidence` — Get evidence citations

#### Export
- `GET /api/questionnaires/{q_id}/export?format=xlsx|docx|pdf` — Export completed questionnaire

#### Dashboard
- `GET /api/dashboard/stats` — Dashboard statistics

## Data Flow

1. **Document Upload** → DocumentProcessor chunks text → Embedder creates vectors → stored in pgvector
2. **Questionnaire Upload** → Parser detects questions → stored with row mapping → triggers AnswerGenerator
3. **Answer Generation** → Embed query → similarity search on pgvector → LLM generates answer with citations
4. **Review** → User approves/rejects/edits → final answers stored
5. **Export** → Map answers back to original format → generate file

## Development Workflow

### Git Workflow
```bash
git checkout -b feature/your-feature-name
# Make changes...
git add .
git commit -m "feat: description of change"
git push origin feature/your-feature-name
gh pr create --base main --head feature/your-feature-name
```

### Commit Convention
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `chore:` — Maintenance
- `refactor:` — Code refactoring

### Tests
```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && pytest
```

### Linting
```bash
# Frontend
cd frontend && npm run lint

# Backend
cd backend && ruff check .
```
