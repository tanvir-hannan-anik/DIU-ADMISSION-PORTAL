"""
Documents repository — kb_documents + kb_document_versions.

Central to change detection: `upsert()` compares the incoming SHA-256 against
the stored hash and only writes (with a new version row) when it actually
changed. Returns the action taken so the caller knows whether to re-embed.
"""

import json
from app.db import pg


def get(source_id: int, natural_key: str) -> dict | None:
    return pg.query_one(
        "SELECT * FROM kb_documents WHERE source_id = %s AND natural_key = %s",
        (source_id, natural_key),
    )


def get_by_id(document_id: str) -> dict | None:
    return pg.query_one("SELECT * FROM kb_documents WHERE id = %s", (document_id,))


def list_active_natural_keys(source_id: int) -> set[str]:
    rows = pg.query(
        "SELECT natural_key FROM kb_documents WHERE source_id = %s AND is_active = TRUE",
        (source_id,),
    )
    return {r["natural_key"] for r in rows}


def upsert(source_id: int, source_url: str, doc: dict) -> dict:
    """
    Insert or update one document by (source_id, natural_key), comparing hashes.

    `doc` = {natural_key, title, category, content, content_hash,
             structured_data(optional), token_estimate(optional)}

    Returns {action: 'created'|'updated'|'unchanged', document: {...}}.
    Writes a kb_document_versions row on created/updated.
    """
    existing = get(source_id, doc["natural_key"])
    structured = doc.get("structured_data")
    structured_json = json.dumps(structured) if structured is not None else None

    if existing is None:
        row = pg.execute_returning(
            """
            INSERT INTO kb_documents
                (source_id, source_url, natural_key, title, category, content,
                 structured_data, content_hash, version, token_estimate,
                 is_active, last_seen_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,1,%s,TRUE,NOW())
            RETURNING *
            """,
            (source_id, source_url, doc["natural_key"], doc.get("title"),
             doc["category"], doc["content"], structured_json,
             doc["content_hash"], doc.get("token_estimate")),
        )
        _add_version(row["id"], 1, doc["content_hash"], doc["content"], "created")
        return {"action": "created", "document": row}

    if existing["content_hash"] == doc["content_hash"] and existing["is_active"]:
        # Identical + still active → just prove liveness, no re-embed.
        pg.execute(
            "UPDATE kb_documents SET last_seen_at = NOW() WHERE id = %s",
            (existing["id"],),
        )
        return {"action": "unchanged", "document": existing}

    # Changed (or was deactivated and is back) → bump version, write history.
    new_version = existing["version"] + 1
    reactivated = not existing["is_active"]
    row = pg.execute_returning(
        """
        UPDATE kb_documents
        SET title = %s, category = %s, content = %s, structured_data = %s,
            content_hash = %s, version = %s, token_estimate = %s,
            is_active = TRUE, updated_at = NOW(), last_seen_at = NOW()
        WHERE id = %s
        RETURNING *
        """,
        (doc.get("title"), doc["category"], doc["content"], structured_json,
         doc["content_hash"], new_version, doc.get("token_estimate"),
         existing["id"]),
    )
    _add_version(
        existing["id"], new_version, doc["content_hash"], doc["content"],
        "reactivated" if reactivated else "updated",
    )
    return {"action": "updated", "document": row}


def deactivate_missing(source_id: int, seen_keys: set[str]) -> list[dict]:
    """
    Mark any active doc for this source whose natural_key was NOT seen this run
    as inactive (it disappeared from the site). Returns the deactivated rows so
    the caller can delete their vectors.
    """
    if seen_keys:
        rows = pg.query(
            """
            SELECT * FROM kb_documents
            WHERE source_id = %s AND is_active = TRUE AND natural_key <> ALL(%s)
            """,
            (source_id, list(seen_keys)),
        )
    else:
        rows = pg.query(
            "SELECT * FROM kb_documents WHERE source_id = %s AND is_active = TRUE",
            (source_id,),
        )
    for r in rows:
        new_version = r["version"] + 1
        pg.execute(
            """
            UPDATE kb_documents
            SET is_active = FALSE, version = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (new_version, r["id"]),
        )
        _add_version(r["id"], new_version, r["content_hash"], None, "deactivated")
    return rows


def _add_version(document_id, version, content_hash, content, change_type,
                 diff_summary=None) -> None:
    pg.execute(
        """
        INSERT INTO kb_document_versions
            (document_id, version, content_hash, content, change_type, diff_summary)
        VALUES (%s,%s,%s,%s,%s,%s)
        """,
        (document_id, version, content_hash, content, change_type, diff_summary),
    )


def count_active() -> int:
    row = pg.query_one("SELECT COUNT(*) AS n FROM kb_documents WHERE is_active = TRUE")
    return int(row["n"]) if row else 0


def list_active() -> list[dict]:
    return pg.query("SELECT * FROM kb_documents WHERE is_active = TRUE ORDER BY source_id, id")


def active_missing_vectors(source_id: int) -> list[dict]:
    """
    Active documents for a source that have NO chunk rows (never embedded, e.g.
    because Qdrant was unreachable when they were first saved). Used by the sync
    reconciler to self-heal vector gaps even though the doc hash is unchanged.
    """
    return pg.query(
        """
        SELECT d.* FROM kb_documents d
        LEFT JOIN kb_chunks c ON c.document_id = d.id
        WHERE d.source_id = %s AND d.is_active = TRUE AND c.id IS NULL
        """,
        (source_id,),
    )


def search(q: str, limit: int = 10) -> list[dict]:
    """Simple keyword search over active documents (title/content ILIKE)."""
    like = f"%{q}%"
    return pg.query(
        """
        SELECT id, source_url, title, category, version, updated_at,
               left(content, 400) AS snippet
        FROM kb_documents
        WHERE is_active = TRUE AND (title ILIKE %s OR content ILIKE %s)
        ORDER BY updated_at DESC
        LIMIT %s
        """,
        (like, like, limit),
    )
