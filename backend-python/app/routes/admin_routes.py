"""
Admin Dashboard Routes
----------------------
GET /api/v1/admin/dashboard          — one payload with every dashboard metric
GET /api/v1/admin/sources            — per-source status + last run (failed/updated pages)
GET /api/v1/admin/logs               — recent kb_event_log (?category=&level=&limit=)
GET /api/v1/admin/popular-questions  — most-asked questions (query log + FAQ + cache)
GET /api/v1/admin/scheduler          — scheduler status / next run times
"""

import logging
from flask import Blueprint, jsonify, request

from app.db import pg
from app.services import vector_store_service, scheduler_service
from app.repositories import (
    sources_repo, sync_repo, documents_repo, chunks_repo,
    metrics_repo, query_log_repo, faq_repo, semcache_repo,
)

logger = logging.getLogger(__name__)
bp = Blueprint("admin_pipeline", __name__, url_prefix="/api/v1/admin")


def _guard():
    if not pg.is_configured():
        return jsonify({"success": False, "error": "DATABASE_URL not configured",
                        "errorCode": "DB_NOT_CONFIGURED"}), 503
    return None


@bp.route("/dashboard", methods=["GET"])
def dashboard():
    guard = _guard()
    if guard:
        return guard
    try:
        metrics = metrics_repo.get_all()
        sources = sources_repo.list_all()
        latest = {r["source_id"]: r for r in sync_repo.latest_per_source()}

        source_rows = []
        for s in sources:
            run = latest.get(s["id"], {})
            source_rows.append({
                "id": s["id"], "name": s["name"], "category": s["category"],
                "url": s["url"], "render_js": s.get("render_js"),
                "is_active": s["is_active"], "last_status": s.get("last_status"),
                "last_synced_at": s.get("last_synced_at"),
                "consecutive_failures": s.get("consecutive_failures"),
                "interval_seconds": s.get("sync_interval_seconds"),
                "last_run": {
                    "status": run.get("status"),
                    "pages_changed": run.get("pages_changed"),
                    "pages_unchanged": run.get("pages_unchanged"),
                    "pages_failed": run.get("pages_failed"),
                    "embeddings_generated": run.get("embeddings_generated"),
                    "finished_at": run.get("finished_at"),
                } if run else None,
            })

        # sync currently in progress?
        running = pg.query("SELECT id, source_id, started_at FROM kb_sync_runs WHERE status='running' ORDER BY started_at DESC")

        data = {
            "database": pg.healthcheck(),
            "vectors": vector_store_service.collection_info(),
            "counts": {
                "documents_active": documents_repo.count_active(),
                "chunks": chunks_repo.count(),
                "faqs": len(faq_repo.list_all()),
                "semantic_cache_entries": semcache_repo.count(),
            },
            "metrics": {
                "total_api_calls": metrics["total_api_calls"],
                "total_llm_calls": metrics["total_llm_calls"],
                "cache_hits": metrics["cache_hits"],
                "cache_misses": metrics["cache_misses"],
                "cache_hit_ratio": metrics["cache_hit_ratio"],
                "tokens_saved": metrics["tokens_saved"],
                "embeddings_generated": metrics["embeddings_generated"],
            },
            "answer_sources": query_log_repo.source_breakdown(),
            "sources": source_rows,
            "sync_in_progress": running,
            "most_asked": query_log_repo.popular_questions(10),
            "top_faqs": faq_repo.top(5),
            "scheduler": scheduler_service.status(),
        }
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:  # noqa: BLE001
        logger.exception("admin dashboard error")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/sources", methods=["GET"])
def sources():
    guard = _guard()
    if guard:
        return guard
    return jsonify({"success": True, "data": {
        "sources": sources_repo.list_all(),
        "latest_runs": sync_repo.latest_per_source(),
    }}), 200


@bp.route("/logs", methods=["GET"])
def logs():
    guard = _guard()
    if guard:
        return guard
    category = request.args.get("category")
    level = request.args.get("level")
    limit = min(int(request.args.get("limit", 100)), 500)
    return jsonify({"success": True, "data": sync_repo.recent_events(category, level, limit)}), 200


@bp.route("/popular-questions", methods=["GET"])
def popular_questions():
    guard = _guard()
    if guard:
        return guard
    limit = min(int(request.args.get("limit", 10)), 50)
    return jsonify({"success": True, "data": {
        "asked": query_log_repo.popular_questions(limit),
        "top_faqs": faq_repo.top(limit),
        "top_cached": semcache_repo.top(limit),
    }}), 200


@bp.route("/scheduler", methods=["GET"])
def scheduler():
    return jsonify({"success": True, "data": scheduler_service.status()}), 200
