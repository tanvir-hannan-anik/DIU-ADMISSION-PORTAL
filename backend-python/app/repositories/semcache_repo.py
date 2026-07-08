"""
Semantic-cache repository — kb_semantic_cache (PG mirror of the Qdrant
diu_semcache collection). The mirror drives popularity tracking and targeted
cache invalidation by source document.
"""

from app.db import pg


def insert(vector_id: str, question: str, normalized_q: str, answer: str,
           category: str | None, source_doc_ids: list[str]) -> dict:
    return pg.execute_returning(
        """
        INSERT INTO kb_semantic_cache
            (vector_id, question, normalized_question, answer, category, source_doc_ids)
        VALUES (%s,%s,%s,%s,%s,%s)
        RETURNING *
        """,
        (vector_id, question, normalized_q, answer, category, source_doc_ids or []),
    )


def increment_hit(cache_id: str) -> None:
    pg.execute(
        "UPDATE kb_semantic_cache SET hit_count = hit_count + 1, last_used_at = NOW() WHERE id = %s",
        (cache_id,),
    )


def promote_if_popular(cache_id: str, threshold: int) -> None:
    pg.execute(
        "UPDATE kb_semantic_cache SET is_permanent = TRUE WHERE id = %s AND hit_count >= %s",
        (cache_id, threshold),
    )


def find_by_source_docs(doc_ids: list[str]) -> list[dict]:
    if not doc_ids:
        return []
    return pg.query(
        "SELECT id, vector_id FROM kb_semantic_cache WHERE source_doc_ids && %s",
        (doc_ids,),
    )


def delete_by_ids(cache_ids: list[str]) -> int:
    if not cache_ids:
        return 0
    return pg.execute(
        "DELETE FROM kb_semantic_cache WHERE id = ANY(%s)", (cache_ids,)
    )


def top(limit: int = 10) -> list[dict]:
    return pg.query(
        "SELECT question, hit_count, category FROM kb_semantic_cache ORDER BY hit_count DESC LIMIT %s",
        (limit,),
    )


def count() -> int:
    row = pg.query_one("SELECT COUNT(*) n FROM kb_semantic_cache")
    return int(row["n"]) if row else 0
