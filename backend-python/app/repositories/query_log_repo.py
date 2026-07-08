"""
Query-log repository — kb_query_log (analytics + token-savings accounting).
"""

from app.db import pg


def log(question: str, normalized_q: str, answer_source: str, matched_layer: int,
        similarity: float | None, tokens_prompt: int, tokens_completion: int,
        tokens_saved: int, latency_ms: int) -> None:
    pg.execute(
        """
        INSERT INTO kb_query_log
            (question, normalized_question, answer_source, matched_layer, similarity,
             tokens_prompt, tokens_completion, tokens_saved, latency_ms)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (question[:2000], normalized_q[:2000], answer_source, matched_layer,
         similarity, tokens_prompt, tokens_completion, tokens_saved, latency_ms),
    )


def source_breakdown() -> list[dict]:
    return pg.query(
        """
        SELECT answer_source, COUNT(*) AS n,
               COALESCE(SUM(tokens_saved),0) AS tokens_saved,
               COALESCE(SUM(tokens_prompt+tokens_completion),0) AS tokens_used
        FROM kb_query_log
        GROUP BY answer_source ORDER BY n DESC
        """
    )


def popular_questions(limit: int = 10) -> list[dict]:
    return pg.query(
        """
        SELECT normalized_question, COUNT(*) AS asked,
               MAX(question) AS sample
        FROM kb_query_log
        WHERE normalized_question <> ''
        GROUP BY normalized_question
        ORDER BY asked DESC LIMIT %s
        """,
        (limit,),
    )


def recent(limit: int = 50) -> list[dict]:
    return pg.query("SELECT * FROM kb_query_log ORDER BY created_at DESC LIMIT %s", (limit,))
