"""
Sync Service
------------
Per-source pipeline orchestrator (spec: Data Collector → … → Change Detection →
Embedding → Qdrant). For one source it:

  1. Conditional-GET fetches the page (ETag / If-Modified-Since). 304 → skip.
  2. Extracts clean section documents (content_extractor_service).
  3. Runs change detection (SHA-256) → created / updated / unchanged / deactivated.
  4. Incrementally indexes only created + updated docs; removes vectors for
     deactivated docs.
  5. (hook) Invalidates semantic-cache entries grounded on changed docs. The
     cache module lands in Phase 2; the hook is a safe no-op until then.
  6. Records a kb_sync_runs row + structured events, and never lets one source's
     failure affect another.

A per-source Postgres advisory lock prevents two concurrent syncs of the same
source (manual call racing the scheduler, or two gunicorn workers).
"""

import logging
import time

import requests

from app.config.settings import Config
from app.db import pg
from app.repositories import sources_repo, sync_repo, metrics_repo
from app.services import content_extractor_service, change_detection_service
from app.services import incremental_index_service as indexer

logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Advisory-lock namespace offset so pipeline locks don't collide with others.
_LOCK_BASE = 918_000_000


def _conditional_get(url: str, etag: str | None, last_modified: str | None) -> dict:
    """
    Fetch with conditional headers + retry/backoff.
    Returns {status:'ok'|'not_modified'|'error', html, etag, last_modified, error}.
    """
    headers = dict(_HEADERS)
    if etag:
        headers["If-None-Match"] = etag
    if last_modified:
        headers["If-Modified-Since"] = last_modified

    last_err = None
    for attempt in range(1, Config.SCRAPE_MAX_RETRIES + 1):
        try:
            resp = requests.get(url, headers=headers, timeout=Config.SCRAPE_TIMEOUT)
            if resp.status_code == 304:
                return {"status": "not_modified"}
            resp.raise_for_status()
            return {
                "status": "ok",
                "html": resp.text,
                "etag": resp.headers.get("ETag"),
                "last_modified": resp.headers.get("Last-Modified"),
            }
        except requests.RequestException as e:
            last_err = str(e)
            if attempt < Config.SCRAPE_MAX_RETRIES:
                time.sleep(min(2 ** attempt, 8))
    return {"status": "error", "error": last_err}


def _reconcile_missing_vectors(source_id: int, stats: dict, skip_ids: set | None = None) -> None:
    """
    Embed active documents that have no vectors yet (transient Qdrant failure
    on a prior run). Cheap + idempotent: index_document only embeds missing
    chunks. Best-effort — never raises into the sync flow.
    """
    skip_ids = skip_ids or set()
    try:
        from app.repositories import documents_repo as _docs
        indexer.ensure_ready()
        for doc in _docs.active_missing_vectors(source_id):
            if str(doc["id"]) in skip_ids:
                continue
            r = indexer.index_document(doc)
            stats["embeddings_generated"] += r["embedded"]
            stats["vectors_upserted"] += r["upserted"]
    except Exception as e:  # noqa: BLE001
        sync_repo.log("WARNING", "embedding",
                      f"reconcile missing vectors failed for source {source_id}",
                      {"error": str(e)})
        logger.warning("reconcile missing vectors failed (source %s): %s", source_id, e)


def run_source(source_id: int) -> dict:
    """Sync a single source by id. Safe to call directly or from the scheduler."""
    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}

    source = sources_repo.get(source_id)
    if not source:
        return {"success": False, "error": f"source {source_id} not found"}

    lock_key = _LOCK_BASE + source_id
    with pg.advisory_lock(lock_key) as got:
        if not got:
            return {"success": False, "skipped": True,
                    "error": "another sync for this source is in progress"}
        return _run_locked(source)


def _run_locked(source: dict) -> dict:
    source_id = source["id"]
    url = source["url"]
    category = source["category"]
    run_id = sync_repo.start_run(source_id)
    stats = {k: 0 for k in (
        "pages_fetched", "pages_changed", "pages_unchanged", "pages_failed",
        "docs_upserted", "embeddings_generated", "vectors_upserted",
        "vectors_deleted", "cache_entries_invalidated",
    )}

    try:
        metrics_repo.incr("total_api_calls", 1)
        if source.get("render_js"):
            # JS-rendered page → headless browser (off-Render worker). No ETag
            # conditional GET; SHA-256 change detection still dedupes downstream.
            from app.services import rendered_fetch_service
            rendered = rendered_fetch_service.fetch_rendered(url)
            if rendered["status"] == "unavailable":
                sources_repo.mark_synced(source_id, "skipped")
                sync_repo.finish_run(run_id, "success", stats)
                sync_repo.log("WARNING", "scraping",
                              f"JS source skipped (Playwright unavailable): {url}",
                              {"source_id": source_id})
                return {"success": True, "source_id": source_id, "skipped": True,
                        "reason": "render_js source requires Playwright (run scripts/sync_js_sources.py off-Render)",
                        "stats": stats}
            fetched = ({"status": "ok", "html": rendered["html"], "etag": None, "last_modified": None}
                       if rendered["status"] == "ok"
                       else {"status": "error", "error": rendered.get("error")})
        else:
            fetched = _conditional_get(url, source.get("etag"), source.get("last_modified"))

        if fetched["status"] == "not_modified":
            # Page unchanged — but vectors may still be missing (e.g. Qdrant was
            # down on a prior run). Self-heal those before returning.
            _reconcile_missing_vectors(source_id, stats)
            sources_repo.mark_synced(source_id, "success")
            sync_repo.finish_run(run_id, "success", stats)
            sync_repo.log("INFO", "sync", f"{url} not modified (304)", {"source_id": source_id})
            return {"success": True, "source_id": source_id, "status": "success",
                    "not_modified": True, "stats": stats}

        if fetched["status"] == "error":
            stats["pages_failed"] = 1
            sources_repo.mark_synced(source_id, "failed", failed=True)
            sync_repo.finish_run(run_id, "failed", stats, error=fetched.get("error"))
            sync_repo.log("ERROR", "scraping", f"fetch failed: {url}",
                          {"source_id": source_id, "error": fetched.get("error")})
            return {"success": False, "source_id": source_id, "error": fetched.get("error")}

        stats["pages_fetched"] = 1

        # Extract → detect
        docs = content_extractor_service.extract_documents(fetched["html"], url, category)
        change = change_detection_service.apply(source_id, url, docs)
        c = change["counts"]
        stats["pages_unchanged"] = c["unchanged"]
        stats["pages_changed"] = c["created"] + c["updated"]
        stats["docs_upserted"] = c["created"] + c["updated"]

        # Index only what changed (unless Qdrant/Gemini unavailable → docs still saved)
        indexed_ok = True
        try:
            indexer.ensure_ready()
            changed_ids = {str(d["id"]) for d in change["created"] + change["updated"]}
            for doc in change["created"] + change["updated"]:
                r = indexer.index_document(doc)
                stats["embeddings_generated"] += r["embedded"]
                stats["vectors_upserted"] += r["upserted"]
                stats["vectors_deleted"] += r["deleted"]
            for doc in change["deactivated"]:
                r = indexer.remove_document(doc["id"])
                stats["vectors_deleted"] += r["deleted"]
            # Self-heal any active docs that still have no vectors (skip the ones
            # we just indexed above).
            _reconcile_missing_vectors(source_id, stats, skip_ids=changed_ids)
        except Exception as e:  # noqa: BLE001 - DB writes already committed
            indexed_ok = False
            sync_repo.log("ERROR", "embedding", f"indexing failed for {url}",
                          {"source_id": source_id, "error": str(e)})
            logger.warning("Indexing failed for source %s: %s", source_id, e)

        # Phase-2 hook: invalidate semantic cache for changed/deactivated docs.
        try:
            from app.services import semantic_cache_service  # noqa: F401
            changed_ids = [str(d["id"]) for d in change["created"] + change["updated"] + change["deactivated"]]
            stats["cache_entries_invalidated"] = semantic_cache_service.invalidate_for_documents(changed_ids)
        except Exception:  # noqa: BLE001 - module not present until Phase 2
            pass

        # Persist HTTP hints for the next conditional GET.
        sources_repo.update_http_hints(source_id, fetched.get("etag"), fetched.get("last_modified"))

        status = "success" if indexed_ok else "partial"
        sources_repo.mark_synced(source_id, status)
        sync_repo.finish_run(run_id, status, stats)
        metrics_repo.incr("embeddings_generated", 0)  # ensure row exists
        sync_repo.log("INFO", "sync", f"synced {url}", {"source_id": source_id, **stats})
        return {"success": True, "source_id": source_id, "status": status, "stats": stats}

    except Exception as e:  # noqa: BLE001 - top-level guard, one source only
        sources_repo.mark_synced(source_id, "failed", failed=True)
        sync_repo.finish_run(run_id, "failed", stats, error=str(e))
        sync_repo.log("ERROR", "sync", f"unhandled error syncing {url}",
                      {"source_id": source_id, "error": str(e)})
        logger.exception("Sync failed for source %s", source_id)
        return {"success": False, "source_id": source_id, "error": str(e)}


def run_all() -> dict:
    """Sync every active source. Failures are isolated per source."""
    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}
    results = [run_source(s["id"]) for s in sources_repo.list_active()]
    return {"success": True, "results": results}


def run_category(category: str) -> dict:
    """Sync all active sources in one or more comma-separated categories."""
    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}
    cats = [c.strip() for c in category.split(",") if c.strip()]
    seen, sources = set(), []
    for cat in cats:
        for s in sources_repo.get_by_category(cat):
            if s["id"] not in seen:
                seen.add(s["id"])
                sources.append(s)
    results = [run_source(s["id"]) for s in sources]
    return {"success": True, "category": category, "results": results}


def run_due() -> dict:
    """Sync only sources whose interval has elapsed (scheduler entry point)."""
    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}
    due = sources_repo.due_for_sync()
    results = [run_source(s["id"]) for s in due]
    return {"success": True, "synced": len(results), "results": results}


def rebuild_embeddings() -> dict:
    """
    Recreate the Qdrant collection and re-embed every ACTIVE document from the
    DB (no re-crawl). Truncating kb_chunks forces the incremental indexer to
    embed all chunks fresh. Admin action.
    """
    if not pg.is_configured():
        return {"success": False, "error": "DATABASE_URL not configured"}
    from app.services import vector_store_service
    from app.repositories import documents_repo

    vector_store_service.recreate_collection(Config.EMBED_DIM)
    vector_store_service.ensure_payload_index("document_id")
    pg.execute("DELETE FROM kb_chunks")  # clear chunk→vector map

    docs = documents_repo.list_active()
    embedded = 0
    for doc in docs:
        r = indexer.index_document(doc)
        embedded += r["embedded"]
    sync_repo.log("INFO", "embedding", "full embeddings rebuild",
                  {"documents": len(docs), "embedded": embedded})
    return {"success": True, "documents": len(docs), "embedded": embedded}


def full_rebuild() -> dict:
    """Re-crawl every source, then rebuild all embeddings from scratch."""
    crawl = run_all()
    embed = rebuild_embeddings()
    return {"success": True, "crawl": crawl, "embeddings": embed}
