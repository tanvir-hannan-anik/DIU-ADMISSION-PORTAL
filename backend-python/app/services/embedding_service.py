"""
Gemini Embedding Service
------------------------
Generates embeddings via Google Gemini's REST API (gemini-embedding-001).
Pure HTTP — no local model — so it stays within Render's free-tier RAM.

Notes:
  • gemini-embedding-001 exposes only `embedContent` (no batch endpoint), so
    batch embedding is a sequential loop with light retry.
  • `outputDimensionality` is requested explicitly so vectors match the
    Qdrant collection size (Config.EMBED_DIM). Sub-3072 vectors aren't
    L2-normalised by Gemini, which is fine because Qdrant uses cosine.

Task types matter for retrieval quality:
  • RETRIEVAL_DOCUMENT — when indexing knowledge-base chunks
  • RETRIEVAL_QUERY    — when embedding a user's question
"""

import logging
import time

import requests

from app.config.settings import Config

logger = logging.getLogger(__name__)

_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"
_TIMEOUT = 30
_MAX_RETRIES = 3


class EmbeddingError(RuntimeError):
    """Raised when embeddings cannot be produced (missing key, API failure)."""


def is_configured() -> bool:
    return bool(Config.GEMINI_API_KEY)


def _model_id() -> str:
    model = Config.GEMINI_EMBED_MODEL
    return model.split("/", 1)[1] if model.startswith("models/") else model


def _embed_one(text: str, task_type: str) -> list[float]:
    """Single embedContent call with retry on transient (429/5xx) errors."""
    model = _model_id()
    url = f"{_API_ROOT}/{model}:embedContent"
    payload = {
        "model": f"models/{model}",
        "content": {"parts": [{"text": text}]},
        "taskType": task_type,
        "outputDimensionality": Config.EMBED_DIM,
    }
    last_err = None
    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            resp = requests.post(
                url,
                params={"key": Config.GEMINI_API_KEY},
                json=payload,
                timeout=_TIMEOUT,
            )
            if resp.status_code in (429, 500, 502, 503, 504):
                last_err = f"{resp.status_code} {resp.text[:160]}"
                time.sleep(min(2 ** attempt, 8))
                continue
            resp.raise_for_status()
            return resp.json()["embedding"]["values"]
        except requests.RequestException as e:
            last_err = str(e)
            time.sleep(min(2 ** attempt, 8))
        except (KeyError, ValueError) as e:
            raise EmbeddingError(f"Unexpected Gemini response shape: {e}") from e
    raise EmbeddingError(f"Gemini embedContent failed after retries: {last_err}")


def embed_text(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
    """Embed a single string. Used for user queries at request time."""
    if not is_configured():
        raise EmbeddingError("GEMINI_API_KEY is not configured")
    return _embed_one(text, task_type)


def embed_batch(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> list[list[float]]:
    """Embed many strings (indexing). Sequential — model has no batch endpoint."""
    if not is_configured():
        raise EmbeddingError("GEMINI_API_KEY is not configured")
    if not texts:
        return []

    out: list[list[float]] = []
    total = len(texts)
    for i, t in enumerate(texts, 1):
        out.append(_embed_one(t, task_type))
        if i % 10 == 0 or i == total:
            logger.info("Embedded %d/%d chunks", i, total)
    return out
