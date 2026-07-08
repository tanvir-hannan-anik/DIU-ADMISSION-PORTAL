"""
Semantic Cache Service — Token-optimization Layer 3
---------------------------------------------------
Stores answered questions as (question_embedding → answer) points in a dedicated
Qdrant collection (diu_semcache). When a semantically similar question arrives
(cosine similarity >= SEMANTIC_CACHE_THRESHOLD, default 0.95) the stored answer
is returned with NO LLM call.

Cache invalidation is targeted: when a source document changes, only cache
entries whose answer was grounded on that document are removed (via the
source_doc_ids mirror in Postgres). Unrelated entries are untouched.
"""

import logging
import uuid

from app.config.settings import Config
from app.db import pg
from app.services import embedding_service, vector_store_service
from app.repositories import semcache_repo

logger = logging.getLogger(__name__)

_NS = uuid.UUID("6f9619ff-8b86-d011-b42d-00cf4fc964ff")
_ready = False


def _collection() -> str:
    return Config.QDRANT_SEMCACHE_COLLECTION


def is_available() -> bool:
    return (embedding_service.is_configured()
            and vector_store_service.is_configured()
            and pg.is_configured())


def ensure_ready() -> None:
    global _ready
    if _ready:
        return
    vector_store_service.ensure_collection(Config.EMBED_DIM, name=_collection())
    _ready = True


def lookup(query_vec: list[float]) -> dict | None:
    """
    Search the semantic cache. Returns {"answer", "cache_id", "question",
    "score"} when a match clears the threshold, else None. Increments hit_count.
    """
    if not is_available():
        return None
    try:
        ensure_ready()
        hits = vector_store_service.search(
            query_vec, limit=1, min_score=Config.SEMANTIC_CACHE_THRESHOLD,
            collection=_collection(),
        )
        if not hits:
            return None
        top = hits[0]
        payload = top.get("payload", {})
        cache_id = payload.get("cache_id")
        if cache_id:
            try:
                semcache_repo.increment_hit(cache_id)
                semcache_repo.promote_if_popular(cache_id, Config.POPULAR_HIT_THRESHOLD)
            except Exception:  # noqa: BLE001
                pass
        return {"answer": payload.get("answer", ""), "cache_id": cache_id,
                "question": payload.get("question", ""), "score": top.get("score", 0.0)}
    except Exception as e:  # noqa: BLE001 - cache miss must never break chat
        logger.warning("Semantic cache lookup failed: %s", e)
        return None


def store(normalized_q: str, question: str, answer: str, query_vec: list[float],
          source_doc_ids: list[str], category: str | None = None) -> None:
    """Persist a freshly-generated answer into the semantic cache."""
    if not is_available() or not answer.strip():
        return
    try:
        ensure_ready()
        vector_id = str(uuid.uuid5(_NS, normalized_q))
        row = semcache_repo.insert(vector_id, question, normalized_q, answer,
                                   category, source_doc_ids)
        vector_store_service.upsert(
            [{
                "id": vector_id,
                "vector": query_vec,
                "payload": {
                    "cache_id": str(row["id"]),
                    "question": question,
                    "answer": answer,
                    "category": category or "",
                },
            }],
            collection=_collection(),
        )
        logger.info("Semantic cache stored: %r", normalized_q[:60])
    except Exception as e:  # noqa: BLE001 - storing is best-effort
        logger.warning("Semantic cache store failed: %s", e)


def invalidate_for_documents(doc_ids: list[str]) -> int:
    """
    Remove cache entries grounded on any of the given documents (called by the
    sync pipeline when those documents change). Returns entries invalidated.
    """
    if not doc_ids or not pg.is_configured():
        return 0
    try:
        rows = semcache_repo.find_by_source_docs([str(d) for d in doc_ids])
        if not rows:
            return 0
        vector_ids = [r["vector_id"] for r in rows]
        cache_ids = [str(r["id"]) for r in rows]
        try:
            vector_store_service.delete_points(vector_ids, name=_collection())
        except Exception as e:  # noqa: BLE001
            logger.warning("semcache point delete failed: %s", e)
        semcache_repo.delete_by_ids(cache_ids)
        logger.info("Invalidated %d semantic-cache entries for %d changed docs",
                    len(cache_ids), len(doc_ids))
        return len(cache_ids)
    except Exception as e:  # noqa: BLE001
        logger.warning("Semantic cache invalidation failed: %s", e)
        return 0


def clear_all() -> int:
    """Admin: drop the whole semantic cache (Qdrant collection + PG mirror)."""
    global _ready
    n = semcache_repo.count()
    try:
        import requests
        requests.delete(
            f"{Config.QDRANT_URL.rstrip('/')}/collections/{_collection()}",
            headers={"api-key": Config.QDRANT_API_KEY}, timeout=30,
        )
        _ready = False
        ensure_ready()  # recreate empty collection
    except Exception as e:  # noqa: BLE001
        logger.warning("clear_all collection reset failed: %s", e)
    if pg.is_configured():
        pg.execute("DELETE FROM kb_semantic_cache")
    return n
