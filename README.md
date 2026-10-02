# 🏥 Hospital SOP Assistant — AI-Powered SOP Management System

A full-stack RAG-based system that lets hospital staff instantly search, retrieve, and get step-by-step guidance from Standard Operating Procedures using natural language.

---

## Architecture

```
Frontend (React + Tailwind)
        │
        ▼
Backend (FastAPI)
        │
   ┌────┴─────┐
   │          │
PostgreSQL  ChromaDB
(metadata)  (vector embeddings)
        │
        ▼
   LLM (Claude / GPT-4)
```

## Quick Start (Docker — recommended)

```bash
# 1. Clone and configure
git clone <repo>
cd hospital-sop-assistant

# 2. Set your API key
cp backend/.env.example backend/.env
# Edit backend/.env → add ANTHROPIC_API_KEY or OPENAI_API_KEY

# 3. Start all services
cd docker
docker compose up --build

# 4. Open
#   Frontend:  http://localhost:3000
#   API Docs:  http://localhost:8000/docs
#   ChromaDB:  http://localhost:8001
```

Default admin login (created on first run):
- Email: `admin@hospital.in`
- Password: `Admin@1234`

---

## Manual Setup (Development)

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DB URL and API keys

# Start PostgreSQL and ChromaDB (via Docker)
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=hospital_sop \
  -e POSTGRES_USER=sop_user \
  -e POSTGRES_PASSWORD=sop_password \
  postgres:16-alpine

docker run -d -p 8001:8000 chromadb/chroma:0.5.11

# Run the API
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

### Alternate Frontend — Vanilla HTML/CSS/JS

A dependency-free version of the frontend also lives in `frontend-vanilla/`. Same backend, same 8 pages (Dashboard, Chat, Emergency/Decision, Repository, Summaries, Analytics, Users, Login) — just plain HTML/CSS/JS instead of React, no npm install or build step required.

```bash
cd frontend-vanilla
python -m http.server 5173     # or any static file server
```

Open `http://localhost:5173`. It talks to the same backend on `http://localhost:8000` (edit `API_BASE` at the top of `script.js` if your backend runs elsewhere). Make sure whatever port you serve it on is present in `backend/app/core/config.py`'s `ALLOWED_ORIGINS` — `5173` and `3000` are already whitelisted by default.

Both frontends can run side by side against the same backend; use whichever you prefer.

### Seed Sample SOPs

```bash
cd backend
python ../scripts/seed_data.py
# Then upload the generated ./sample_sops/*.txt files via the UI
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/register` | Register new user |
| GET | `/api/v1/sops/` | List all SOPs |
| POST | `/api/v1/sops/` | Upload SOP (admin) |
| GET | `/api/v1/sops/{id}` | Get single SOP |
| PUT | `/api/v1/sops/{id}` | Update SOP (admin) |
| DELETE | `/api/v1/sops/{id}` | Delete SOP (admin) |
| POST | `/api/v1/chat/query` | AI RAG query |
| POST | `/api/v1/summaries/` | Generate SOP summary |
| GET | `/api/v1/analytics/overview` | Analytics overview |
| GET | `/api/v1/users/` | List users (admin) |

Full interactive docs: `http://localhost:8000/docs`

---

## RAG Pipeline

```
Document Upload
      │
      ▼
Step 1: Extract text (PDF/DOCX/TXT)
      │
      ▼
Step 2: Clean & preprocess text
      │
      ▼
Step 3: Chunk into 800-token segments (150-token overlap)
      │
      ▼
Step 4: Generate embeddings (OpenAI or sentence-transformers)
      │
      ▼
Step 5: Store in ChromaDB with metadata
      │
      ▼
Step 6: Index ready for semantic search
```

At query time:
```
User Question → Embed → ChromaDB similarity search
                                  │
                         Top-K chunks retrieved
                                  │
                         Build context prompt
                                  │
                         LLM (Claude/GPT-4) response
                                  │
                         Steps + Sources + Confidence
```

---

## Project Structure

```
hospital-sop-assistant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py        # Settings & env vars
│   │   │   └── security.py      # JWT, password hashing
│   │   ├── db/
│   │   │   ├── database.py      # Async SQLAlchemy setup
│   │   │   └── vector_store.py  # ChromaDB interface
│   │   ├── models/
│   │   │   ├── user.py          # User table
│   │   │   ├── sop_document.py  # SOP documents table
│   │   │   └── query_log.py     # Query history table
│   │   ├── schemas/
│   │   │   ├── auth.py          # Auth request/response schemas
│   │   │   ├── sop.py           # SOP schemas
│   │   │   └── chat.py          # Chat & summary schemas
│   │   ├── services/
│   │   │   ├── document_processor.py  # 6-step pipeline
│   │   │   ├── embedding_service.py   # Embedding generation
│   │   │   ├── rag_service.py         # Core RAG logic
│   │   │   ├── summary_service.py     # SOP summarization
│   │   │   └── user_service.py        # User CRUD
│   │   └── api/routes/
│   │       ├── auth.py          # /auth endpoints
│   │       ├── sops.py          # /sops endpoints
│   │       ├── chat.py          # /chat/query endpoint
│   │       ├── summaries.py     # /summaries endpoint
│   │       ├── analytics.py     # /analytics endpoint
│   │       └── users.py         # /users endpoints
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                    # React + Tailwind + TypeScript
├── frontend-vanilla/             # Plain HTML/CSS/JS — same 8 pages, no build step
│   ├── index.html                # Single shell: login screen + app shell w/ nav
│   ├── style.css                 # All styling, CSS custom properties for theming
│   └── script.js                 # Router + API calls + all 8 page render functions
├── docker/
│   └── docker-compose.yml       # Full stack orchestration
├── scripts/
│   └── seed_data.py             # Sample SOP generator
└── README.md
```

---

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| name | VARCHAR(150) | |
| email | VARCHAR(255) | Unique |
| hashed_password | VARCHAR(255) | bcrypt |
| role | ENUM | admin / staff |
| department | VARCHAR(100) | |
| is_active | BOOLEAN | |
| created_at | TIMESTAMP | |
| last_login | TIMESTAMP | |

### sop_documents
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| title | VARCHAR(300) | |
| category | ENUM | admission/discharge/infection/emergency/clinical/safety/admin |
| department | VARCHAR(100) | |
| version | VARCHAR(20) | |
| author | VARCHAR(150) | |
| file_path | VARCHAR(500) | |
| file_type | VARCHAR(10) | pdf/docx/txt |
| status | ENUM | processing/active/archived/failed |
| chunk_count | INTEGER | Number of vector chunks |
| search_count | INTEGER | Usage tracking |
| uploaded_by | FK → users.id | |

### query_logs
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | |
| user_id | FK → users.id | |
| question | TEXT | |
| response | TEXT | |
| sources | JSON | Array of SOP IDs |
| confidence | FLOAT | 0–100 |
| response_time_ms | INTEGER | |
| created_at | TIMESTAMP | |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI, Python 3.12 |
| Database | PostgreSQL 16 |
| Vector DB | ChromaDB |
| Embeddings | OpenAI text-embedding-3-small or sentence-transformers |
| LLM | Claude (Anthropic) or GPT-4o |
| Auth | JWT (python-jose) + bcrypt |
| PDF parsing | PyMuPDF |
| DOCX parsing | python-docx |
| Container | Docker + Docker Compose |

---

## Security Notes

- All passwords hashed with bcrypt (12 rounds)
- JWT tokens expire after 8 hours
- Admin-only routes protected by role middleware
- File type validation on upload
- SQL injection prevented by SQLAlchemy ORM
- Change `SECRET_KEY` in `.env` before production deployment

---

## License

MIT — for educational and hospital use.
