import os
from pathlib import Path
from dotenv import load_dotenv

_BASE_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_BASE_ENV_PATH, override=True)

# Base directory of the backend-python package
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Project root (one level up from backend-python)
_PROJECT_ROOT = os.path.dirname(_BASE_DIR)


class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "groq/compound")
    RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
    GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "groq/compound")
    GROQ_API_KEY_2 = os.getenv("GROQ_API_KEY_2")
    GROQ_MODEL_2 = os.getenv("GROQ_MODEL_2", "groq/compound")
    GROQ_API_KEY_3 = os.getenv("GROQ_API_KEY_3")
    GROQ_MODEL_3 = os.getenv("GROQ_MODEL_3", "groq/compound")

    # ── RAG: Google Gemini embeddings (Render-safe, pure HTTP) ──────────────
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
    EMBED_DIM = int(os.getenv("EMBED_DIM", "768"))

    # ── RAG: Qdrant Cloud vector store (REST API) ──────────────────────────
    QDRANT_URL = os.getenv("QDRANT_URL")  # e.g. https://xxx.cloud.qdrant.io
    QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
    QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "diu_kb")

    # RAG behaviour. Falls back to the legacy static prompt when disabled or
    # when Qdrant/Gemini are unreachable, so production never hard-breaks.
    RAG_ENABLED = os.getenv("RAG_ENABLED", "true").lower() in ("1", "true", "yes")
    RAG_TOP_K = int(os.getenv("RAG_TOP_K", "6"))
    RAG_MIN_SCORE = float(os.getenv("RAG_MIN_SCORE", "0.30"))

    # ── AI Knowledge Pipeline (Phase 1+) ───────────────────────────────────
    # Supabase / Postgres connection for the kb_* pipeline tables. The Python
    # service reuses the same DB the Spring service uses. Blank → pipeline
    # endpoints report "not configured" but the rest of the app keeps working.
    DATABASE_URL = os.getenv("DATABASE_URL", "")

    # Optional Redis for the KV/counter cache + scheduler locks. Blank → the
    # cache falls back to an in-process dict and Postgres advisory locks.
    REDIS_URL = os.getenv("REDIS_URL", "")

    # Semantic cache (Layer 3) lives in a dedicated Qdrant collection.
    QDRANT_SEMCACHE_COLLECTION = os.getenv("QDRANT_SEMCACHE_COLLECTION", "diu_semcache")
    SEMANTIC_CACHE_THRESHOLD = float(os.getenv("SEMANTIC_CACHE_THRESHOLD", "0.95"))

    # Scheduler: in-process APScheduler (local) vs Render Cron Jobs (prod).
    # Set SCHEDULER_ENABLED=false in prod and drive sync via cron → /pipeline/sync.
    SCHEDULER_ENABLED = os.getenv("SCHEDULER_ENABLED", "true").lower() in (
        "1",
        "true",
        "yes",
    )
    POPULAR_HIT_THRESHOLD = int(os.getenv("POPULAR_HIT_THRESHOLD", "10"))

    # Per-category sync cadence overrides (seconds). Fall back to kb_sources
    # seeded values when unset (0 = use DB value).
    SYNC_ADMISSION_INTERVAL = int(os.getenv("SYNC_ADMISSION_INTERVAL", "0"))
    SYNC_NOTICE_INTERVAL = int(os.getenv("SYNC_NOTICE_INTERVAL", "0"))
    SYNC_FEES_INTERVAL = int(os.getenv("SYNC_FEES_INTERVAL", "0"))
    SYNC_DEPARTMENT_INTERVAL = int(os.getenv("SYNC_DEPARTMENT_INTERVAL", "0"))

    # HTTP fetch tuning for the scraper/sync layer.
    SCRAPE_TIMEOUT = int(os.getenv("SCRAPE_TIMEOUT", "20"))
    SCRAPE_MAX_RETRIES = int(os.getenv("SCRAPE_MAX_RETRIES", "3"))

    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    SERVICE_HOST = os.getenv("SERVICE_HOST", "0.0.0.0")
    SERVICE_PORT = int(os.getenv("PORT", os.getenv("SERVICE_PORT", "5000")))
    MAX_TOKENS = int(os.getenv("MAX_TOKENS", "1024"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    DEBUG = FLASK_ENV == "development"

    # Department image ingestion
    DEPT_IMAGES_PATH = os.getenv(
        "DEPT_IMAGES_PATH", os.path.join(_PROJECT_ROOT, "department details")
    )
    # Where to save extracted JSON files
    KB_DATA_PATH = os.getenv(
        "KB_DATA_PATH", os.path.join(_BASE_DIR, "data", "departments")
    )
    KB_DATASET_FILE = os.path.join(
        os.path.dirname(
            os.getenv("KB_DATA_PATH", os.path.join(_BASE_DIR, "data", "departments"))
        ),
        "departments_dataset.json",
    )

    # PDF sources at the project root, ingested into the RAG index.
    PDF_SOURCES = [
        os.path.join(_PROJECT_ROOT, "waiver-policy2025.pdf"),
        os.path.join(_PROJECT_ROOT, "application_instruction.pdf"),
    ]
