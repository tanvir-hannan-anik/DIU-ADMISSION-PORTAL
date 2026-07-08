"""
Chunks repository — kb_chunks (document → Qdrant vector mapping).

Lets us re-embed only the chunks whose text actually changed, and delete a
document's vectors precisely on update/deactivate.
"""

from app.db import pg


def get_for_document(document_id: str) -> list[dict]:
    return pg.query(
        "SELECT * FROM kb_chunks WHERE document_id = %s ORDER BY chunk_index",
        (document_id,),
    )


def hash_map(document_id: str) -> dict[int, str]:
    """chunk_index → content_hash for a document (to detect unchanged chunks)."""
    return {r["chunk_index"]: r["content_hash"] for r in get_for_document(document_id)}


def upsert(document_id: str, chunk_index: int, vector_id: str,
           content_hash: str, token_estimate: int | None) -> None:
    pg.execute(
        """
        INSERT INTO kb_chunks
            (document_id, chunk_index, vector_id, content_hash, token_estimate, embedded_at)
        VALUES (%s,%s,%s,%s,%s,NOW())
        ON CONFLICT (document_id, chunk_index)
        DO UPDATE SET vector_id = EXCLUDED.vector_id,
                      content_hash = EXCLUDED.content_hash,
                      token_estimate = EXCLUDED.token_estimate,
                      embedded_at = NOW()
        """,
        (document_id, chunk_index, vector_id, content_hash, token_estimate),
    )


def delete_from_index(document_id: str, keep_indexes: set[int]) -> list[str]:
    """
    Delete chunk rows for a document whose chunk_index is NOT in keep_indexes
    (i.e. chunks that no longer exist after a shrink). Returns their vector_ids
    so the caller removes them from Qdrant.
    """
    if keep_indexes:
        rows = pg.query(
            "SELECT vector_id FROM kb_chunks WHERE document_id = %s AND chunk_index <> ALL(%s)",
            (document_id, list(keep_indexes)),
        )
        pg.execute(
            "DELETE FROM kb_chunks WHERE document_id = %s AND chunk_index <> ALL(%s)",
            (document_id, list(keep_indexes)),
        )
    else:
        rows = pg.query(
            "SELECT vector_id FROM kb_chunks WHERE document_id = %s", (document_id,)
        )
        pg.execute("DELETE FROM kb_chunks WHERE document_id = %s", (document_id,))
    return [r["vector_id"] for r in rows]


def delete_all(document_id: str) -> list[str]:
    rows = pg.query(
        "SELECT vector_id FROM kb_chunks WHERE document_id = %s", (document_id,)
    )
    pg.execute("DELETE FROM kb_chunks WHERE document_id = %s", (document_id,))
    return [r["vector_id"] for r in rows]


def count() -> int:
    row = pg.query_one("SELECT COUNT(*) AS n FROM kb_chunks")
    return int(row["n"]) if row else 0
