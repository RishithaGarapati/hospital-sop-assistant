from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.db.database import create_tables
from app.db.vector_store import init_vector_store
from app.api.routes import auth, sops, chat, analytics, users, summaries

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Hospital SOP Assistant API...")
    await create_tables()
    await init_vector_store()
    logger.info("Database and vector store initialized.")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Hospital SOP Assistant API",
    description="AI-powered Standard Operating Procedure management system for hospitals",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

app.include_router(auth.router,       prefix="/api/v1/auth",      tags=["Authentication"])
app.include_router(sops.router,       prefix="/api/v1/sops",      tags=["SOP Documents"])
app.include_router(chat.router,       prefix="/api/v1/chat",      tags=["AI Chat"])
app.include_router(summaries.router,  prefix="/api/v1/summaries", tags=["Summaries"])
app.include_router(analytics.router,  prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(users.router,      prefix="/api/v1/users",     tags=["Users"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Hospital SOP Assistant"}
