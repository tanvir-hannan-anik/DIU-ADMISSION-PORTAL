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


def _collection_url(suffix: str = "", name: str | None = None) -> str:
    name = name or Config.QDRANT_COLLECTION
    return f"{_base()}/collections/{name}{suffix}"


def _collection_exists(name: str | None = None) -> bool:
    name = name or Config.QDRANT_COLLECTION
    try:
        resp = requests.get(
            f"{_base()}/collections/{name}", headers=_headers(), timeout=_TIMEOUT
        )
        return resp.status_code == 200
    except requests.RequestException:
        return False


def ensure_collection(dim: int | None = None, name: str | None = None) -> None:
    """
    Create the collection if it does not exist — NON-destructive (unlike
    recreate_collection). Used by the incremental sync path so we never drop
    existing vectors just to add new ones.
    """
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    name = name or Config.QDRANT_COLLECTION
    dim = dim or Config.EMBED_DIM
    if _collection_exists(name):
        return
    try:
        resp = requests.put(
            f"{_base()}/collections/{name}",
            headers=_headers(),
            json={"vectors": {"size": dim, "distance": "Cosine"}},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        logger.info("Qdrant collection '%s' created (dim=%d)", name, dim)
    except requests.RequestException as e:
        raise VectorStoreError(f"Failed to create collection '{name}': {e}") from e


def ensure_payload_index(field: str, name: str | None = None) -> None:
    """
    Create a keyword payload index so delete/filter-by-`field` is efficient.
    Idempotent: Qdrant returns OK if the index already exists.
    """
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    name = name or Config.QDRANT_COLLECTION
    try:
        resp = requests.put(
            f"{_base()}/collections/{name}/index",
            headers=_headers(),
            params={"wait": "true"},
            json={"field_name": field, "field_schema": "keyword"},
            timeout=_TIMEOUT,
        )
        # 200 = created, 4xx often = already exists → tolerate.
        if resp.status_code >= 500:
            resp.raise_for_status()
    except requests.RequestException as e:
        logger.warning("ensure_payload_index(%s) on '%s': %s", field, name, e)


def delete_points(ids: list, name: str | None = None) -> int:
    """Delete specific points by id. Returns count requested."""
    if not is_configured() or not ids:
        return 0
    name = name or Config.QDRANT_COLLECTION
    # psycopg returns uuid.UUID for uuid columns; JSON needs str (ints pass through).
    clean_ids = [i if isinstance(i, int) else str(i) for i in ids]
    try:
        resp = requests.post(
            f"{_base()}/collections/{name}/points/delete",
            headers=_headers(),
            params={"wait": "true"},
            json={"points": clean_ids},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
        return len(ids)
    except requests.RequestException as e:
        raise VectorStoreError(f"Delete points failed: {e}") from e


def delete_by_document(document_id: str, name: str | None = None) -> None:
    """Delete all points belonging to a document (filter on payload.document_id)."""
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    name = name or Config.QDRANT_COLLECTION
    try:
        resp = requests.post(
            f"{_base()}/collections/{name}/points/delete",
            headers=_headers(),
            params={"wait": "true"},
            json={"filter": {"must": [
                {"key": "document_id", "match": {"value": str(document_id)}}
            ]}},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        raise VectorStoreError(f"Delete-by-document failed: {e}") from e


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


def upsert(points: list[dict], collection: str | None = None) -> int:
    """
    Upsert points. Each point: {"id": int|uuid, "vector": [...], "payload": {...}}.
    Sends in batches of 64 to stay well under request-size limits.
    `collection` defaults to the main KB collection; pass the semcache name to
    target the semantic-cache collection.
    """
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    name = collection or Config.QDRANT_COLLECTION
    total = 0
    for start in range(0, len(points), 64):
        batch = points[start:start + 64]
        try:
            resp = requests.put(
                _collection_url("/points", name),
                headers=_headers(),
                params={"wait": "true"},
                json={"points": batch},
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            total += len(batch)
        except requests.RequestException as e:
            raise VectorStoreError(f"Upsert failed: {e}") from e
    logger.info("Upserted %d points into '%s'", total, name)
    return total


def search(query_vector: list[float], limit: int, min_score: float = 0.0,
           collection: str | None = None) -> list[dict]:
    """Return [{score, payload}] for the nearest points above min_score."""
    if not is_configured():
        raise VectorStoreError("QDRANT_URL / QDRANT_API_KEY not configured")
    name = collection or Config.QDRANT_COLLECTION
    body = {
        "vector": query_vector,
        "limit": limit,
        "with_payload": True,
    }
    if min_score > 0:
        body["score_threshold"] = min_score
    try:
        resp = requests.post(
            _collection_url("/points/search", name),
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
