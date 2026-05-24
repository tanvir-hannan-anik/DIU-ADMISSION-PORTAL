"""
Live Data Routes
-----------------
Serve real-time scraped data from official DIU websites to the frontend and
optionally trigger RAG re-indexing with the fresh content.

GET  /api/v1/live/scholarships          — scraped DIU scholarship page
GET  /api/v1/live/tuition-fees          — scraped DIU tuition fee page
GET  /api/v1/live/faculty               — scraped DIU faculty directory
GET  /api/v1/live/faculty/profile       — single faculty profile (?url=...)
POST /api/v1/live/refresh               — force-refresh all caches
POST /api/v1/live/refresh-rag           — refresh caches + rebuild RAG index
"""

import logging
from flask import Blueprint, jsonify, request
from app.services import web_scraper_service

logger = logging.getLogger(__name__)
bp = Blueprint("live_data", __name__, url_prefix="/api/v1/live")


@bp.route("/scholarships", methods=["GET"])
def scholarships():
    force = request.args.get("force", "0") == "1"
    try:
        data = web_scraper_service.fetch_scholarships(force=force)
        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        logger.error("Scholarships endpoint error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@bp.route("/tuition-fees", methods=["GET"])
def tuition_fees():
    force = request.args.get("force", "0") == "1"
    try:
        data = web_scraper_service.fetch_tuition_fees(force=force)
        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        logger.error("Tuition fees endpoint error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@bp.route("/faculty", methods=["GET"])
def faculty_list():
    force = request.args.get("force", "0") == "1"
    try:
        data = web_scraper_service.fetch_faculty_list(force=force)
        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        logger.error("Faculty list endpoint error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@bp.route("/faculty/profile", methods=["GET"])
def faculty_profile():
    url = request.args.get("url", "").strip()
    if not url:
        return jsonify({"success": False, "error": "url query parameter required"}), 400
    # Safety: only allow faculty.daffodilvarsity.edu.bd URLs
    if "faculty.daffodilvarsity.edu.bd" not in url:
        return jsonify({"success": False, "error": "URL must be from faculty.daffodilvarsity.edu.bd"}), 400
    try:
        profile = web_scraper_service.fetch_faculty_profile(url)
        return jsonify({"success": True, "data": profile}), 200
    except Exception as exc:
        logger.error("Faculty profile endpoint error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500


@bp.route("/refresh", methods=["POST"])
def refresh_caches():
    """Force-clear all scraper caches so next request fetches fresh data."""
    web_scraper_service.invalidate_cache()
    return jsonify({"success": True, "message": "Scraper caches cleared. Next request will fetch live data."}), 200


@bp.route("/refresh-rag", methods=["POST"])
def refresh_rag():
    """Refresh all scraper caches AND rebuild the Qdrant RAG index."""
    web_scraper_service.invalidate_cache()
    try:
        from app.services import rag_service
        result = rag_service.build_index()
        return jsonify({
            "success": True,
            "message": "Scraper caches cleared and RAG index rebuilt with live data.",
            "rag": result,
        }), 200
    except RuntimeError as exc:
        return jsonify({"success": False, "error": str(exc)}), 503
    except Exception as exc:
        logger.error("Refresh RAG error: %s", exc)
        return jsonify({"success": False, "error": str(exc)}), 500
