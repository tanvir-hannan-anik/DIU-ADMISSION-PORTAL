import os
from dotenv import load_dotenv

load_dotenv(override=True)

# Base directory of the backend-python package
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Project root (one level up from backend-python)
_PROJECT_ROOT = os.path.dirname(_BASE_DIR)

class Config:
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
    RAPIDAPI_KEY = os.getenv('RAPIDAPI_KEY')
    GROQ_VISION_MODEL = os.getenv('GROQ_VISION_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')
    GROQ_API_KEY_2 = os.getenv('GROQ_API_KEY_2')
    GROQ_MODEL_2 = os.getenv('GROQ_MODEL_2', 'llama-3.3-70b-versatile')
    GROQ_API_KEY_3 = os.getenv('GROQ_API_KEY_3')
    GROQ_MODEL_3 = os.getenv('GROQ_MODEL_3', 'llama-3.3-70b-versatile')

    # ── RAG: Google Gemini embeddings (Render-safe, pure HTTP) ──────────────
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    GEMINI_EMBED_MODEL = os.getenv('GEMINI_EMBED_MODEL', 'gemini-embedding-001')
    EMBED_DIM = int(os.getenv('EMBED_DIM', '768'))

    # ── RAG: Qdrant Cloud vector store (REST API) ──────────────────────────
    QDRANT_URL = os.getenv('QDRANT_URL')               # e.g. https://xxx.cloud.qdrant.io
    QDRANT_API_KEY = os.getenv('QDRANT_API_KEY')
    QDRANT_COLLECTION = os.getenv('QDRANT_COLLECTION', 'diu_kb')

    # RAG behaviour. Falls back to the legacy static prompt when disabled or
    # when Qdrant/Gemini are unreachable, so production never hard-breaks.
    RAG_ENABLED = os.getenv('RAG_ENABLED', 'true').lower() in ('1', 'true', 'yes')
    RAG_TOP_K = int(os.getenv('RAG_TOP_K', '6'))
    RAG_MIN_SCORE = float(os.getenv('RAG_MIN_SCORE', '0.30'))

    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    SERVICE_HOST = os.getenv('SERVICE_HOST', '0.0.0.0')
    SERVICE_PORT = int(os.getenv('PORT', os.getenv('SERVICE_PORT', '5000')))
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', '1024'))
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    DEBUG = FLASK_ENV == 'development'

    # Department image ingestion
    DEPT_IMAGES_PATH = os.getenv(
        'DEPT_IMAGES_PATH',
        os.path.join(_PROJECT_ROOT, 'department details')
    )
    # Where to save extracted JSON files
    KB_DATA_PATH = os.getenv(
        'KB_DATA_PATH',
        os.path.join(_BASE_DIR, 'data', 'departments')
    )
    KB_DATASET_FILE = os.path.join(os.path.dirname(os.getenv(
        'KB_DATA_PATH',
        os.path.join(_BASE_DIR, 'data', 'departments')
    )), 'departments_dataset.json')

    # PDF sources at the project root, ingested into the RAG index.
    PDF_SOURCES = [
        os.path.join(_PROJECT_ROOT, 'waiver-policy2025.pdf'),
        os.path.join(_PROJECT_ROOT, 'application_instruction.pdf'),
    ]
