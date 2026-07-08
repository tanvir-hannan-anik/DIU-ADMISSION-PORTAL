"""
Faculty repository — kb_faculty (structured faculty directory in Supabase).

Change detection by content_hash(name|designation|department) so re-syncs only
write rows that actually changed, and members who disappear are deactivated.
"""

import hashlib
from app.db import pg


def _hash(name: str, designation: str, department: str) -> str:
    return hashlib.sha256(f"{name}|{designation}|{department}".lower().encode("utf-8")).hexdigest()


def get(name: str, department: str) -> dict | None:
    return pg.query_one(
        "SELECT * FROM kb_faculty WHERE name = %s AND department = %s LIMIT 1",
        (name, department),
    )


def upsert(rec: dict) -> str:
    """
    Insert/update one faculty member by (name, department). Returns action:
    'created' | 'updated' | 'unchanged'.
    """
    name = rec["name"]
    department = rec["department"]
    designation = rec.get("designation") or ""
    h = _hash(name, designation, department)
    existing = get(name, department)

    if existing is None:
        pg.execute(
            """
            INSERT INTO kb_faculty (name, designation, department, profile_url, raw, content_hash, last_seen_at)
            VALUES (%s,%s,%s,%s,%s,%s,NOW())
            """,
            (name, designation, department, rec.get("profile_url"),
             _jsonb(rec), h),
        )
        return "created"

    if existing["content_hash"] == h and existing["is_active"]:
        pg.execute("UPDATE kb_faculty SET last_seen_at = NOW() WHERE id = %s", (existing["id"],))
        return "unchanged"

    pg.execute(
        """
        UPDATE kb_faculty
        SET designation = %s, profile_url = %s, raw = %s, content_hash = %s,
            is_active = TRUE, updated_at = NOW(), last_seen_at = NOW()
        WHERE id = %s
        """,
        (designation, rec.get("profile_url"), _jsonb(rec), h, existing["id"]),
    )
    return "updated"


def deactivate_missing(seen_keys: set[tuple]) -> int:
    """Deactivate active faculty whose (name, department) wasn't seen this run."""
    active = pg.query("SELECT id, name, department FROM kb_faculty WHERE is_active = TRUE")
    stale_ids = [r["id"] for r in active if (r["name"], r["department"]) not in seen_keys]
    if stale_ids:
        pg.execute("UPDATE kb_faculty SET is_active = FALSE, updated_at = NOW() WHERE id = ANY(%s)", (stale_ids,))
    return len(stale_ids)


def list_active() -> list[dict]:
    return pg.query(
        "SELECT name, designation, department, profile_url FROM kb_faculty WHERE is_active = TRUE ORDER BY department, id"
    )


def by_department(department: str) -> list[dict]:
    return pg.query(
        "SELECT name, designation, department, profile_url FROM kb_faculty WHERE is_active = TRUE AND department ILIKE %s ORDER BY id",
        (f"%{department}%",),
    )


def grouped() -> dict:
    """All active faculty grouped by department: {department: [members...]}."""
    rows = list_active()
    out: dict[str, list] = {}
    for r in rows:
        out.setdefault(r["department"], []).append(
            {"name": r["name"], "designation": r["designation"], "profile_url": r["profile_url"]}
        )
    return out


def count() -> int:
    row = pg.query_one("SELECT COUNT(*) n FROM kb_faculty WHERE is_active = TRUE")
    return int(row["n"]) if row else 0


def _jsonb(rec: dict):
    import json
    return json.dumps({"department_code": rec.get("department_code")})
