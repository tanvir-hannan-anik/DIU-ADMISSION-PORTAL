"""
Pipeline API Routes
-------------------
REST surface for the AI Knowledge Pipeline (Phase 1).

POST /api/v1/pipeline/sync                 — sync sources
     ?source=<id>                            one source
     ?category=admission,fees                one or more categories
     (no param)                              all active sources
POST /api/v1/pipeline/sync/due             — sync only sources whose interval elapsed
POST /api/v1/pipeline/embeddings/rebuild   — recreate collection + re-embed all docs
POST /api/v1/pipeline/rebuild              — full re-crawl + embeddings rebuild
GET  /api/v1/pipeline/status               — sources, last runs, vector + doc counts
GET  /api/v1/pipeline/sources              — list sources + health
GET  /api/v1/search/documents?q=           — keyword search over kb_documents
"""

import logging
from flask import Blueprint, jsonify, request

from app.db import pg
from app.services import sync_service, vector_store_service
from app.repositories import sources_repo, sync_repo, documents_repo, chunks_repo, metrics_repo

logger = logging.getLogger(__name__)
bp = Blueprint("pipeline", __name__, url_prefix="/api/v1")


def _require_db():
    if not pg.is_configured():
        return jsonify({
            "success": False,
            "error": "DATABASE_URL not configured — run the kb_* migration and set DATABASE_URL.",
            "errorCode": "DB_NOT_CONFIGURED",
        }), 503
    return None


@bp.route("/pipeline/sync", methods=["POST"])
def sync():
    guard = _require_db()
    if guard:
        return guard
    source = request.args.get("source")
    category = request.args.get("category")
    try:
        if source:
            result = sync_service.run_source(int(source))
        elif category:
            result = sync_service.run_category(category)
        else:
            result = sync_service.run_all()
        code = 200 if result.get("success") else 500
        return jsonify(result), code
    except ValueError:
        return jsonify({"success": False, "error": "source must be an integer id"}), 400
    except Exception as e:  # noqa: BLE001
        logger.exception("sync endpoint error")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/pipeline/sync/due", methods=["POST"])
def sync_due():
    guard = _require_db()
    if guard:
        return guard
    return jsonify(sync_service.run_due()), 200


@bp.route("/pipeline/embeddings/rebuild", methods=["POST"])
def embeddings_rebuild():
    guard = _require_db()
    if guard:
        return guard
    try:
        return jsonify(sync_service.rebuild_embeddings()), 200
    except Exception as e:  # noqa: BLE001
        logger.exception("embeddings rebuild error")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/pipeline/rebuild", methods=["POST"])
def rebuild():
    guard = _require_db()
    if guard:
        return guard
    try:
        return jsonify(sync_service.full_rebuild()), 200
    except Exception as e:  # noqa: BLE001
        logger.exception("full rebuild error")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/pipeline/status", methods=["GET"])
def status():
    guard = _require_db()
    if guard:
        return guard
    try:
        data = {
            "database": pg.healthcheck(),
            "sources": sources_repo.list_all(),
            "latest_runs": sync_repo.latest_per_source(),
            "documents_active": documents_repo.count_active(),
            "chunks": chunks_repo.count(),
            "vectors": vector_store_service.collection_info(),
            "metrics": metrics_repo.get_all(),
        }
        return jsonify({"success": True, "data": data}), 200
    except Exception as e:  # noqa: BLE001
        logger.exception("pipeline status error")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route("/pipeline/sources", methods=["GET"])
def sources():
    guard = _require_db()
    if guard:
        return guard
    return jsonify({"success": True, "data": sources_repo.list_all()}), 200


@bp.route("/search/documents", methods=["GET"])
def search_documents():
    guard = _require_db()
    if guard:
        return guard
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"success": False, "error": "q query parameter required"}), 400
    limit = min(int(request.args.get("limit", 10)), 50)
    return jsonify({"success": True, "data": documents_repo.search(q, limit)}), 200


@bp.route("/search/faq", methods=["GET"])
def search_faq():
    guard = _require_db()
    if guard:
        return guard
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"success": False, "error": "q query parameter required"}), 400
    from app.services import faq_service
    hit = faq_service.match(q)
    return jsonify({"success": True, "data": hit}), 200


@bp.route("/cache/semantic", methods=["GET"])
def inspect_semantic_cache():
    guard = _require_db()
    if guard:
        return guard
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"success": False, "error": "q query parameter required"}), 400
    from app.services import embedding_service, semantic_cache_service
    if not semantic_cache_service.is_available():
        return jsonify({"success": False, "error": "semantic cache unavailable"}), 503
    vec = embedding_service.embed_text(q, task_type="RETRIEVAL_QUERY")
    hit = semantic_cache_service.lookup(vec)
    return jsonify({"success": True, "data": hit}), 200


@bp.route("/cache/invalidate", methods=["POST"])
def invalidate_cache():
    guard = _require_db()
    if guard:
        return guard
    from app.services import semantic_cache_service
    body = request.get_json(silent=True) or {}
    if body.get("all"):
        n = semantic_cache_service.clear_all()
        return jsonify({"success": True, "cleared": n}), 200
    doc_ids = body.get("document_ids") or ([body["document_id"]] if body.get("document_id") else [])
    if not doc_ids:
        return jsonify({"success": False, "error": "provide document_id(s) or {all:true}"}), 400
    n = semantic_cache_service.invalidate_for_documents(doc_ids)
    return jsonify({"success": True, "invalidated": n}), 200
