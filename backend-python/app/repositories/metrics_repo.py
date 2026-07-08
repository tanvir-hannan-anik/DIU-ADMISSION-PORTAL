"""
Metrics repository — kb_metrics durable counters.

Runtime hot counters live in cache_service (Redis / in-proc); these are the
persisted snapshot used by the admin dashboard so totals survive restarts.
"""

from app.db import pg

KNOWN = (
    "total_api_calls", "total_llm_calls",
    "cache_hits", "cache_misses",
    "tokens_saved", "embeddings_generated",
)


def incr(metric_key: str, by: int = 1) -> None:
    pg.execute(
        """
        INSERT INTO kb_metrics (metric_key, metric_value, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (metric_key)
        DO UPDATE SET metric_value = kb_metrics.metric_value + EXCLUDED.metric_value,
                      updated_at = NOW()
        """,
        (metric_key, by),
    )


def get_all() -> dict:
    rows = pg.query("SELECT metric_key, metric_value FROM kb_metrics")
    out = {k: 0 for k in KNOWN}
    out.update({r["metric_key"]: int(r["metric_value"]) for r in rows})
    hits, misses = out.get("cache_hits", 0), out.get("cache_misses", 0)
    out["cache_hit_ratio"] = round(hits / (hits + misses), 4) if (hits + misses) else 0.0
    return out
