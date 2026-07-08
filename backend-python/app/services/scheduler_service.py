"""
Scheduler Service — automatic per-source sync
=============================================
Local/dev default: an in-process APScheduler runs one interval job per active
source at its own cadence (admission 15m, notices 5m, fees 1h, departments
daily — from kb_sources, overridable via env).

Production (Render free tier that spins down): set SCHEDULER_ENABLED=false and
drive syncs with Render Cron Jobs hitting POST /api/v1/pipeline/sync — no
always-on process required. See render.yaml.

Single-run safety: sync_service.run_source() already takes a per-source Postgres
advisory lock, so even if gunicorn runs several workers (each with its own
scheduler), only one actually performs each run; the others no-op.
"""

import logging

from app.config.settings import Config
from app.db import pg

logger = logging.getLogger(__name__)

_scheduler = None
_started = False

# category → env override (seconds); 0 means "use the kb_sources value".
_CATEGORY_OVERRIDE = {
    "admission":  lambda: Config.SYNC_ADMISSION_INTERVAL,
    "homepage":   lambda: Config.SYNC_NOTICE_INTERVAL,
    "notice":     lambda: Config.SYNC_NOTICE_INTERVAL,
    "fees":       lambda: Config.SYNC_FEES_INTERVAL,
    "scholarship":lambda: Config.SYNC_FEES_INTERVAL,
    "faculty":    lambda: Config.SYNC_DEPARTMENT_INTERVAL,
    "faculties":  lambda: Config.SYNC_DEPARTMENT_INTERVAL,
    "department": lambda: Config.SYNC_DEPARTMENT_INTERVAL,
}


def _interval_for(source: dict) -> int:
    override = _CATEGORY_OVERRIDE.get(source["category"], lambda: 0)()
    return override if override and override > 0 else int(source["sync_interval_seconds"])


def _run_job(source_id: int) -> None:
    try:
        from app.services import sync_service
        sync_service.run_source(source_id)
    except Exception as e:  # noqa: BLE001 - a job failure must not kill the scheduler
        logger.warning("Scheduled sync failed for source %s: %s", source_id, e)


def start() -> bool:
    """Start the scheduler if enabled + DB configured. Returns True if started."""
    global _scheduler, _started
    if _started:
        return True
    if not Config.SCHEDULER_ENABLED:
        logger.info("Scheduler disabled (SCHEDULER_ENABLED=false) — use Render cron")
        return False
    if not pg.is_configured():
        logger.info("Scheduler not started — DATABASE_URL not configured")
        return False
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from apscheduler.triggers.interval import IntervalTrigger
    except Exception as e:  # noqa: BLE001
        logger.warning("APScheduler not installed — scheduler unavailable: %s", e)
        return False

    try:
        from app.repositories import sources_repo
        sources = sources_repo.list_active()
    except Exception as e:  # noqa: BLE001
        logger.warning("Scheduler: could not load sources: %s", e)
        return False

    _scheduler = BackgroundScheduler(daemon=True)
    for s in sources:
        interval = _interval_for(s)
        _scheduler.add_job(
            _run_job, IntervalTrigger(seconds=interval, jitter=min(interval // 10, 30)),
            args=[s["id"]], id=f"sync_source_{s['id']}",
            max_instances=1, coalesce=True, misfire_grace_time=60,
        )
        logger.info("Scheduled source #%d (%s) every %ds", s["id"], s["name"], interval)
    _scheduler.start()
    _started = True
    logger.info("Scheduler started with %d jobs", len(sources))

    import atexit
    atexit.register(_safe_shutdown)
    return True


def _safe_shutdown() -> None:
    try:
        if _scheduler and _scheduler.running:
            _scheduler.shutdown(wait=False)
    except Exception:  # noqa: BLE001
        pass


def status() -> dict:
    if not Config.SCHEDULER_ENABLED:
        return {"enabled": False, "mode": "render-cron", "running": False, "jobs": []}
    if not _scheduler or not _started:
        return {"enabled": True, "running": False, "jobs": []}
    jobs = [{
        "id": j.id,
        "next_run": j.next_run_time.isoformat() if j.next_run_time else None,
    } for j in _scheduler.get_jobs()]
    return {"enabled": True, "mode": "apscheduler", "running": True, "jobs": jobs}
