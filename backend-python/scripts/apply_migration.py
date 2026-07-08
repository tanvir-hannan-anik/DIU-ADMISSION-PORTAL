"""
Apply a SQL migration file to the configured Supabase/Postgres DB.

Usage:
    python scripts/apply_migration.py <path-to-.sql>
    python scripts/apply_migration.py            # defaults to the kb pipeline migration

Idempotent: the pipeline migration uses CREATE TABLE IF NOT EXISTS / ON CONFLICT,
so re-running is safe.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import pg  # noqa: E402

_DEFAULT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "supabase", "migrations", "20260708000001_ai_knowledge_pipeline.sql",
)


def main() -> int:
    path = sys.argv[1] if len(sys.argv) > 1 else _DEFAULT
    if not pg.is_configured():
        print("ERROR: DATABASE_URL not configured (or psycopg missing).")
        return 1
    if not os.path.exists(path):
        print(f"ERROR: migration file not found: {path}")
        return 1

    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()

    print(f"Applying migration: {os.path.basename(path)}  ({len(sql)} bytes)")
    with pg.connection() as conn, conn.cursor() as cur:
        cur.execute(sql)          # DDL runs as a multi-statement script (autocommit)
    print("Migration applied OK.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
