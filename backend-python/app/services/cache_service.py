"""
Cache Service — Redis-optional KV + counters
--------------------------------------------
A tiny abstraction used for hot counters and short-lived locks. Uses Redis when
REDIS_URL is set; otherwise falls back to an in-process dict so the app runs
identically on a single node with no Redis (e.g. Render free tier).

Durable dashboard totals live in Postgres (kb_metrics via metrics_repo); this
layer is for fast, ephemeral state and the scheduler single-run lock.
"""

import logging
import threading
import time

from app.config.settings import Config

logger = logging.getLogger(__name__)

_redis = None
_use_redis = False
_local: dict = {}
_local_expiry: dict = {}
_lock = threading.Lock()

if Config.REDIS_URL:
    try:
        import redis  # type: ignore
        _redis = redis.from_url(Config.REDIS_URL, decode_responses=True)
        _redis.ping()
        _use_redis = True
        logger.info("cache_service using Redis")
    except Exception as e:  # noqa: BLE001
        logger.warning("REDIS_URL set but Redis unavailable (%s) — using in-proc cache", e)


def backend() -> str:
    return "redis" if _use_redis else "in-process"


def _expired(key: str) -> bool:
    exp = _local_expiry.get(key)
    return exp is not None and exp < time.time()


def get(key: str):
    if _use_redis:
        return _redis.get(key)
    with _lock:
        if _expired(key):
            _local.pop(key, None)
            _local_expiry.pop(key, None)
            return None
        return _local.get(key)


def set(key: str, value, ttl: int | None = None) -> None:
    if _use_redis:
        _redis.set(key, value, ex=ttl)
        return
    with _lock:
        _local[key] = value
        _local_expiry[key] = (time.time() + ttl) if ttl else None


def incr(key: str, by: int = 1) -> int:
    if _use_redis:
        return int(_redis.incrby(key, by))
    with _lock:
        cur = int(_local.get(key, 0)) + by
        _local[key] = cur
        return cur


def acquire_lock(name: str, ttl: int = 300) -> bool:
    """Best-effort distributed lock. Returns True if acquired."""
    key = f"lock:{name}"
    if _use_redis:
        return bool(_redis.set(key, "1", nx=True, ex=ttl))
    with _lock:
        if _expired(key) or key not in _local:
            _local[key] = "1"
            _local_expiry[key] = time.time() + ttl
            return True
        return False


def release_lock(name: str) -> None:
    key = f"lock:{name}"
    if _use_redis:
        _redis.delete(key)
    else:
        with _lock:
            _local.pop(key, None)
            _local_expiry.pop(key, None)
