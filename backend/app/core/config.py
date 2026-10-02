from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Hospital SOP Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "secret-key-change-me"  # Change this in production!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://sop_user:sop_password@localhost:5432/hospital_sop"

    # Vector Store (ChromaDB)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001
    CHROMA_COLLECTION: str = "hospital_sops"

    # ── AI Provider ───────────────────────────────────────────────────────────
    # Set LLM_PROVIDER to one of: "groq" | "anthropic" | "openai" | "ollama"
    LLM_PROVIDER: str = "groq"

    # Groq (FREE - get key at console.groq.com)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"   # fast + free

    # Anthropic (paid)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"

    # OpenAI (paid, $5 free credits on signup)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Ollama (free, runs locally on your machine)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # Embedding model (always free — runs locally)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"   # sentence-transformers, no API key needed

    # RAG settings
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 150
    TOP_K_RESULTS: int = 5
    SIMILARITY_THRESHOLD: float = 0.35
    MAX_TOKENS: int = 2048
    TEMPERATURE: float = 0.1

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "txt"]

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://yourdomain.com",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
