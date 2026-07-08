"""
Sync-run + event-log repository — kb_sync_runs, kb_event_log.
Also the durable metric counter helpers (kb_metrics).
"""

import json
import logging
from app.db import pg

logger = logging.getLogger(__name__)


# ── Sync runs ─────────────────────────────────────────────────────────────────

def start_run(source_id: int) -> int:
    row = pg.execute_returning(
        "INSERT INTO kb_sync_runs (source_id, status) VALUES (%s,'running') RETURNING id",
        (source_id,),
    )
    return row["id"]


def finish_run(run_id: int, status: str, stats: dict, error: str | None = None) -> None:
    pg.execute(
        """
        UPDATE kb_sync_runs SET
            finished_at = NOW(), status = %s,
            pages_fetched = %s, pages_changed = %s, pages_unchanged = %s, pages_failed = %s,
            docs_upserted = %s, embeddings_generated = %s,
            vectors_upserted = %s, vectors_deleted = %s,
            cache_entries_invalidated = %s, error = %s
        WHERE id = %s
        """,
        (status,
         stats.get("pages_fetched", 0), stats.get("pages_changed", 0),
         stats.get("pages_unchanged", 0), stats.get("pages_failed", 0),
         stats.get("docs_upserted", 0), stats.get("embeddings_generated", 0),
         stats.get("vectors_upserted", 0), stats.get("vectors_deleted", 0),
         stats.get("cache_entries_invalidated", 0), error, run_id),
    )


def recent_runs(limit: int = 20) -> list[dict]:
    return pg.query(
        "SELECT * FROM kb_sync_runs ORDER BY started_at DESC LIMIT %s", (limit,)
    )


def latest_per_source() -> list[dict]:
    return pg.query(
        """
        SELECT DISTINCT ON (source_id) *
        FROM kb_sync_runs
        ORDER BY source_id, started_at DESC
        """
    )


# ── Event log ─────────────────────────────────────────────────────────────────

def log(level: str, category: str, message: str, meta: dict | None = None) -> None:
    """Persist a structured event. Best-effort — never raises into the caller."""
    try:
        pg.execute(
            "INSERT INTO kb_event_log (level, category, message, meta) VALUES (%s,%s,%s,%s)",
            (level, category, message, json.dumps(meta) if meta else None),
        )
    except Exception as e:  # noqa: BLE001
        logger.warning("kb_event_log write failed (%s): %s", category, e)


def recent_events(category: str | None = None, level: str | None = None,
                  limit: int = 100) -> list[dict]:
    clauses, params = [], []
    if category:
        clauses.append("category = %s")
        params.append(category)
    if level:
        clauses.append("level = %s")
        params.append(level)
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params.append(limit)
    return pg.query(
        f"SELECT * FROM kb_event_log {where} ORDER BY created_at DESC LIMIT %s",
        tuple(params),
    )
