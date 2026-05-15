"""
Qdrant Vector Store Service
---------------------------
Thin REST client for Qdrant Cloud. Uses `requests` only (no qdrant-client /
grpcio), keeping the Render image small.

Collection is recreated on a full rebuild (clean slate) so re-indexing never
leaves stale chunks behind.
"""

import logging
import requests
from app.config.settings import Config

logger = logging.getLogger(__name__)

_TIMEOUT = 30


class VectorStoreError(RuntimeError):
    """Raised when Qdrant is unreachable or returns an error."""


def is_configured() -> bool:
    return bool(Config.QDRANT_URL and Config.QDRANT_API_KEY)


def _base() -> str:
    return Config.QDRANT_URL.rstrip("/")


def _headers() -> dict:
    return {"api-key": Config.QDRANT_API_KEY, "Content-Type": "application/json"}


def _collection_url(suffix: str = "") -> str:
    return f"{_base()}/collections/{Config.QDRANT_COLLECTION}{suffix}"


def recreate_collection(dim: int | None = None) -> None:
    """Drop and recreate the collection with a cosine-distance vector space."""
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    dim = dim or Config.EMBED_DIM
    try:
        requests.delete(_collection_url(), headers=_headers(), timeout=_TIMEOUT)
        resp = requests.put(
            _collection_url(),
            headers=_headers(),
            json={"vectors": {"size": dim, "distance": "Cosine"}},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        logger.info("Qdrant collection '%s' recreated (dim=%d)",
                    Config.QDRANT_COLLECTION, dim)
    except requests.RequestException as e:
        raise VectorStoreError(f"Failed to recreate collection: {e}") from e


def upsert(points: list[dict]) -> int:
    """
    Upsert points. Each point: {"id": int, "vector": [...], "payload": {...}}.
    Sends in batches of 64 to stay well under request-size limits.
    """
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    total = 0
    for start in range(0, len(points), 64):
        batch = points[start:start + 64]
        try:
            resp = requests.put(
                _collection_url("/points"),
                headers=_headers(),
                params={"wait": "true"},
                json={"points": batch},
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            total += len(batch)
        except requests.RequestException as e:
            raise VectorStoreError(f"Upsert failed: {e}") from e
    logger.info("Upserted %d points into '%s'", total, Config.QDRANT_COLLECTION)
    return total


def search(query_vector: list[float], limit: int, min_score: float = 0.0) -> list[dict]:
    """Return [{score, payload}] for the nearest chunks above min_score."""
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    body = {
        "vector": query_vector,
        "limit": limit,
        "with_payload": True,
    }
    if min_score > 0:
        body["score_threshold"] = min_score
    try:
        resp = requests.post(
            _collection_url("/points/search"),
            headers=_headers(),
            json=body,
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        result = resp.json().get("result", [])
        return [{"score": r.get("score", 0.0), "payload": r.get("payload", {})}
                for r in result]
    except requests.RequestException as e:
        raise VectorStoreError(f"Search failed: {e}") from e


def collection_info() -> dict:
    """Return basic collection status (points count, health)."""
    if not is_configured():
        return {"configured": False}
    try:
        resp = requests.get(_collection_url(), headers=_headers(), timeout=_TIMEOUT)
        if resp.status_code == 404:
            return {"configured": True, "exists": False}
        resp.raise_for_status()
        r = resp.json().get("result", {})
        return {
            "configured": True,
            "exists": True,
            "points_count": r.get("points_count"),
            "status": r.get("status"),
        }
    except requests.RequestException as e:
        return {"configured": True, "error": str(e)}
