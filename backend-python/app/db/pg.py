"""
Postgres / Supabase access layer
---------------------------------
A thin, lazily-initialised connection pool over the same Supabase Postgres the
Spring service uses. Only the AI Knowledge Pipeline (`kb_*` tables) talks to it.

Design goals:
  • Never break the app at import time. If `psycopg` isn't installed or
    DATABASE_URL is blank, `is_configured()` returns False and callers degrade
    (pipeline endpoints report "not configured"; chat keeps working).
  • Dict rows everywhere so repositories return plain dicts.
  • A small helper surface: query / query_one / execute / transaction / advisory lock.
"""

import logging
import threading
from contextlib import contextmanager

from app.config.settings import Config

logger = logging.getLogger(__name__)

_pool = None
_pool_lock = threading.Lock()
_import_ok = True

try:  # psycopg is optional at import time
    import psycopg
    from psycopg.rows import dict_row
    from psycopg_pool import ConnectionPool
except Exception as e:  # noqa: BLE001
    _import_ok = False
    logger.warning("psycopg not available — pipeline DB layer disabled: %s", e)


def is_configured() -> bool:
    """True only when the DB driver is present AND DATABASE_URL is set."""
    return bool(_import_ok and Config.DATABASE_URL)


class DBNotConfigured(RuntimeError):
    """Raised when a DB operation is attempted without DATABASE_URL/psycopg."""


def _get_pool():
    """Lazily create a small connection pool on first use."""
    global _pool
    if not is_configured():
        raise DBNotConfigured(
            "DATABASE_URL is not configured (or psycopg is not installed)."
        )
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = ConnectionPool(
                    conninfo=Config.DATABASE_URL,
                    min_size=1,
                    max_size=int(__import__("os").getenv("DB_POOL_MAX", "5")),
                    kwargs={"row_factory": dict_row, "autocommit": True},
                    open=True,
                    name="kb_pipeline_pool",
                    timeout=15,
                    # Validate a connection before handing it out so a stale one
                    # (Supabase pooler closes idle conns) is recycled, not returned
                    # dead. Also cap connection lifetime for the same reason.
                    check=ConnectionPool.check_connection,
                    max_idle=120,
                    max_lifetime=1800,
                )
                logger.info("Postgres pool opened for AI pipeline")
    return _pool


@contextmanager
def connection():
    """Borrow a pooled connection (autocommit). Use `transaction()` for atomics."""
    pool = _get_pool()
    with pool.connection() as conn:
        yield conn


@contextmanager
def transaction():
    """Borrow a connection and wrap the block in a single transaction."""
    pool = _get_pool()
    with pool.connection() as conn:
        conn.autocommit = False
        try:
            with conn.transaction():
                yield conn
        finally:
            conn.autocommit = True


def query(sql: str, params: tuple | dict | None = None) -> list[dict]:
    """Run a SELECT and return all rows as dicts."""
    with connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall() or []


def query_one(sql: str, params: tuple | dict | None = None) -> dict | None:
    """Run a SELECT and return the first row (or None)."""
    with connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()


def execute(sql: str, params: tuple | dict | None = None) -> int:
    """Run an INSERT/UPDATE/DELETE; return affected row count."""
    with connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.rowcount


def execute_returning(sql: str, params: tuple | dict | None = None) -> dict | None:
    """Run a write with RETURNING; return the first returned row."""
    with connection() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()


@contextmanager
def advisory_lock(key: int):
    """
    Best-effort Postgres session advisory lock used as the scheduler single-run
    guard across gunicorn workers. Yields True if acquired, False otherwise.
    Never raises on lock failure — the caller decides whether to skip.
    """
    acquired = False
    try:
        with connection() as conn, conn.cursor() as cur:
            cur.execute("SELECT pg_try_advisory_lock(%s) AS ok", (key,))
            row = cur.fetchone()
            acquired = bool(row and row.get("ok"))
            try:
                yield acquired
            finally:
                if acquired:
                    cur.execute("SELECT pg_advisory_unlock(%s)", (key,))
    except Exception as e:  # noqa: BLE001
        logger.warning("advisory_lock(%s) failed: %s", key, e)
        yield False


def close() -> None:
    """Close the pool cleanly (registered atexit to avoid shutdown warnings)."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
        except Exception:  # noqa: BLE001
            pass
        _pool = None


import atexit as _atexit
_atexit.register(close)


def healthcheck() -> dict:
    """Lightweight DB status for admin/health endpoints."""
    if not is_configured():
        return {"configured": False}
    try:
        row = query_one("SELECT 1 AS ok")
        return {"configured": True, "reachable": bool(row and row.get("ok") == 1)}
    except Exception as e:  # noqa: BLE001
        return {"configured": True, "reachable": False, "error": str(e)}
