"""
FAQ repository — kb_faqs (token-optimization Layer 2).
"""

from app.db import pg


def get_by_normalized(normalized_q: str) -> dict | None:
    return pg.query_one(
        "SELECT * FROM kb_faqs WHERE is_active = TRUE AND normalized_question = %s LIMIT 1",
        (normalized_q,),
    )


def search_keywords(tokens: list[str], limit: int = 5) -> list[dict]:
    """Rank active FAQs by keyword overlap with the query tokens."""
    if not tokens:
        return []
    return pg.query(
        """
        SELECT *, (
            SELECT COUNT(*) FROM unnest(keywords) k WHERE k = ANY(%s)
        ) AS overlap
        FROM kb_faqs
        WHERE is_active = TRUE AND keywords && %s
        ORDER BY overlap DESC, hit_count DESC
        LIMIT %s
        """,
        (tokens, tokens, limit),
    )


def increment_hit(faq_id: int) -> None:
    pg.execute(
        "UPDATE kb_faqs SET hit_count = hit_count + 1, updated_at = NOW() WHERE id = %s",
        (faq_id,),
    )


def upsert(question: str, normalized_q: str, answer: str, category: str,
           keywords: list[str], source_document_id: str | None = None) -> dict:
    return pg.execute_returning(
        """
        INSERT INTO kb_faqs (question, normalized_question, answer, category, keywords, source_document_id)
        VALUES (%s,%s,%s,%s,%s,%s)
        ON CONFLICT DO NOTHING
        RETURNING *
        """,
        (question, normalized_q, answer, category, keywords, source_document_id),
    )


def list_all() -> list[dict]:
    return pg.query("SELECT * FROM kb_faqs WHERE is_active = TRUE ORDER BY hit_count DESC")


def top(limit: int = 10) -> list[dict]:
    return pg.query(
        "SELECT question, hit_count, category FROM kb_faqs WHERE is_active = TRUE ORDER BY hit_count DESC LIMIT %s",
        (limit,),
    )
