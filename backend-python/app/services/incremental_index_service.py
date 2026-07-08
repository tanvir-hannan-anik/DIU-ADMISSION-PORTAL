"""
Incremental Index Service
--------------------------
Keeps Qdrant in sync with a single document at the CHUNK level, generating the
minimum number of embeddings:

  • Chunk the document (reusing rag_service._chunk_text).
  • Deterministic vector id = uuid5(document_id:chunk_index) → stable across runs,
    so an upsert overwrites the same point in place.
  • Re-embed a chunk ONLY when its text hash differs from the stored kb_chunks
    hash. Unchanged chunks are left untouched (no Gemini call, no Qdrant write).
  • Delete points for chunks that no longer exist (document shrank).
  • On deactivate/remove: delete every point for the document.

Payload stored on each point: text, title, category, source, document_id,
chunk_index, version — so retrieval keeps working and delete-by-document filters.
"""

import logging
import uuid

from app.config.settings import Config
from app.services import embedding_service, vector_store_service, rag_service
from app.services.content_extractor_service import sha256, estimate_tokens
from app.repositories import chunks_repo, metrics_repo

logger = logging.getLogger(__name__)

# Stable namespace for deterministic point ids.
_NS = uuid.UUID("6f9619ff-8b86-d011-b42d-00cf4fc964ff")


def _vector_id(document_id: str, chunk_index: int) -> str:
    return str(uuid.uuid5(_NS, f"{document_id}:{chunk_index}"))


def ensure_ready() -> None:
    """Make sure the collection + payload index exist (non-destructive)."""
    vector_store_service.ensure_collection(Config.EMBED_DIM)
    vector_store_service.ensure_payload_index("document_id")


def index_document(document: dict) -> dict:
    """
    Incrementally (re)index one active document. `document` is a kb_documents row.
    Returns {embedded, upserted, deleted, skipped}.
    """
    document_id = str(document["id"])
    chunks = rag_service._chunk_text(document["content"])
    if not chunks:
        # No content → treat like a removal.
        return remove_document(document_id)

    existing_hashes = chunks_repo.hash_map(document_id)  # chunk_index -> hash

    to_embed_idx: list[int] = []
    chunk_hashes: dict[int, str] = {}
    for i, ch in enumerate(chunks):
        h = sha256(ch)
        chunk_hashes[i] = h
        if existing_hashes.get(i) != h:
            to_embed_idx.append(i)

    embedded = upserted = 0
    if to_embed_idx:
        vectors = embedding_service.embed_batch(
            [chunks[i] for i in to_embed_idx], task_type="RETRIEVAL_DOCUMENT"
        )
        points = []
        for i, vec in zip(to_embed_idx, vectors):
            vid = _vector_id(document_id, i)
            points.append({
                "id": vid,
                "vector": vec,
                "payload": {
                    "text": chunks[i],
                    "title": document.get("title") or "",
                    "category": document.get("category") or "",
                    "source": "pipeline",
                    "document_id": document_id,
                    "chunk_index": i,
                    "version": document.get("version"),
                },
            })
            chunks_repo.upsert(document_id, i, vid, chunk_hashes[i], estimate_tokens(chunks[i]))
        upserted = vector_store_service.upsert(points)
        embedded = len(points)

    # Delete vectors for chunks that no longer exist (doc shrank).
    keep = set(range(len(chunks)))
    stale_vector_ids = chunks_repo.delete_from_index(document_id, keep)
    deleted = vector_store_service.delete_points(stale_vector_ids) if stale_vector_ids else 0

    if embedded:
        try:
            metrics_repo.incr("embeddings_generated", embedded)
        except Exception:  # noqa: BLE001
            pass

    skipped = len(chunks) - len(to_embed_idx)
    logger.info("Indexed doc %s: embedded=%d skipped=%d deleted=%d",
                document_id, embedded, skipped, deleted)
    return {"embedded": embedded, "upserted": upserted, "deleted": deleted, "skipped": skipped}


def remove_document(document_id: str) -> dict:
    """Delete every vector + chunk row for a document (deactivate/removed path)."""
    document_id = str(document_id)
    stale = chunks_repo.delete_all(document_id)
    deleted = 0
    try:
        vector_store_service.delete_by_document(document_id)
        deleted = len(stale)
    except Exception as e:  # noqa: BLE001
        logger.warning("delete_by_document(%s) failed, falling back to id delete: %s",
                       document_id, e)
        deleted = vector_store_service.delete_points(stale) if stale else 0
    return {"embedded": 0, "upserted": 0, "deleted": deleted, "skipped": 0}
