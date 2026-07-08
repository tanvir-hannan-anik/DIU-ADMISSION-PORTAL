"""
Sources repository — CRUD over kb_sources (the 5 website sources).
"""

from app.db import pg


def list_active() -> list[dict]:
    return pg.query(
        "SELECT * FROM kb_sources WHERE is_active = TRUE ORDER BY id"
    )


def list_all() -> list[dict]:
    return pg.query("SELECT * FROM kb_sources ORDER BY id")


def get(source_id: int) -> dict | None:
    return pg.query_one("SELECT * FROM kb_sources WHERE id = %s", (source_id,))


def get_by_category(category: str) -> list[dict]:
    return pg.query(
        "SELECT * FROM kb_sources WHERE category = %s AND is_active = TRUE ORDER BY id",
        (category,),
    )


def due_for_sync() -> list[dict]:
    """Active sources whose interval has elapsed since last_synced_at."""
    return pg.query(
        """
        SELECT * FROM kb_sources
        WHERE is_active = TRUE
          AND (last_synced_at IS NULL
               OR last_synced_at + (sync_interval_seconds || ' seconds')::interval <= NOW())
        ORDER BY id
        """
    )


def update_http_hints(source_id: int, etag: str | None, last_modified: str | None) -> None:
    pg.execute(
        "UPDATE kb_sources SET etag = %s, last_modified = %s, updated_at = NOW() WHERE id = %s",
        (etag, last_modified, source_id),
    )


def mark_synced(source_id: int, status: str, failed: bool = False) -> None:
    if failed:
        pg.execute(
            """
            UPDATE kb_sources
            SET last_synced_at = NOW(), last_status = %s,
                consecutive_failures = consecutive_failures + 1, updated_at = NOW()
            WHERE id = %s
            """,
            (status, source_id),
        )
    else:
        pg.execute(
            """
            UPDATE kb_sources
            SET last_synced_at = NOW(), last_status = %s,
                consecutive_failures = 0, updated_at = NOW()
            WHERE id = %s
            """,
            (status, source_id),
        )
