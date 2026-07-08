"""
Tuition-fee repository — kb_tuition_fees.
Change detection by content_hash so re-syncs only write changed programs.
"""

from app.db import pg

_COLS = ("external_id", "program_name", "department_name", "faculty_name",
         "faculty_short", "program_type", "credit", "majors", "duration",
         "payable_admission", "avg_semester_fee", "total_tuition_fee",
         "total_program_fee", "content_hash")


def get(external_id: int) -> dict | None:
    return pg.query_one("SELECT * FROM kb_tuition_fees WHERE external_id = %s", (external_id,))


def upsert(row: dict) -> str:
    existing = get(row["external_id"])
    if existing is None:
        pg.execute(
            f"INSERT INTO kb_tuition_fees ({', '.join(_COLS)}, last_seen_at) "
            f"VALUES ({', '.join(['%s'] * len(_COLS))}, NOW())",
            tuple(row.get(c) for c in _COLS),
        )
        return "created"
    if existing["content_hash"] == row["content_hash"] and existing["is_active"]:
        pg.execute("UPDATE kb_tuition_fees SET last_seen_at = NOW() WHERE id = %s", (existing["id"],))
        return "unchanged"
    sets = ", ".join(f"{c} = %s" for c in _COLS if c != "external_id")
    params = tuple(row.get(c) for c in _COLS if c != "external_id") + (row["external_id"],)
    pg.execute(
        f"UPDATE kb_tuition_fees SET {sets}, is_active = TRUE, updated_at = NOW(), "
        f"last_seen_at = NOW() WHERE external_id = %s",
        params,
    )
    return "updated"


def deactivate_missing(seen_ids: set[int]) -> int:
    active = pg.query("SELECT id, external_id FROM kb_tuition_fees WHERE is_active = TRUE")
    stale = [r["id"] for r in active if r["external_id"] not in seen_ids]
    if stale:
        pg.execute("UPDATE kb_tuition_fees SET is_active = FALSE, updated_at = NOW() WHERE id = ANY(%s)", (stale,))
    return len(stale)


def list_active() -> list[dict]:
    return pg.query(
        """
        SELECT program_name, department_name, faculty_name, program_type,
               credit, majors, duration,
               payable_admission, avg_semester_fee, total_tuition_fee, total_program_fee
        FROM kb_tuition_fees WHERE is_active = TRUE
        ORDER BY faculty_name, program_type, program_name
        """
    )


def grouped() -> dict:
    rows = list_active()
    out: dict[str, list] = {}
    for r in rows:
        out.setdefault(r["faculty_name"] or "Other", []).append(r)
    return out


def count() -> int:
    row = pg.query_one("SELECT COUNT(*) n FROM kb_tuition_fees WHERE is_active = TRUE")
    return int(row["n"]) if row else 0
