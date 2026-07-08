"""
Faculty Routes
--------------
Serves the structured faculty directory straight from Supabase (kb_faculty) —
NO LLM, NO tokens.

GET  /api/v1/faculty                 — all active faculty grouped by department
GET  /api/v1/faculty?department=cse  — filter by department name/code substring
GET  /api/v1/faculty/flat            — flat list (name, designation, department)
POST /api/v1/faculty/sync            — re-scrape the site into Supabase (needs Playwright; off-Render)
"""

import logging
from flask import Blueprint, jsonify, request

from app.db import pg
from app.repositories import faculty_repo

logger = logging.getLogger(__name__)
bp = Blueprint("faculty", __name__, url_prefix="/api/v1/faculty")


def _guard():
    if not pg.is_configured():
        return jsonify({"success": False, "error": "DATABASE_URL not configured",
                        "errorCode": "DB_NOT_CONFIGURED"}), 503
    return None


@bp.route("", methods=["GET"])
@bp.route("/", methods=["GET"])
def list_faculty():
    guard = _guard()
    if guard:
        return guard
    dept = request.args.get("department", "").strip()
    if dept:
        members = faculty_repo.by_department(dept)
        return jsonify({"success": True, "count": len(members),
                        "data": {"department": dept, "members": members}}), 200
    grouped = faculty_repo.grouped()
    return jsonify({"success": True, "count": faculty_repo.count(),
                    "departments": len(grouped), "data": grouped}), 200


@bp.route("/flat", methods=["GET"])
def flat():
    guard = _guard()
    if guard:
        return guard
    return jsonify({"success": True, "data": faculty_repo.list_active()}), 200


@bp.route("/sync", methods=["POST"])
def sync():
    guard = _guard()
    if guard:
        return guard
    from app.services import faculty_scraper_service
    if not faculty_scraper_service.is_available():
        return jsonify({"success": False,
                        "error": "Playwright not available on this host — run scripts/sync_faculty.py off-Render"}), 503
    try:
        return jsonify(faculty_scraper_service.sync()), 200
    except Exception as e:  # noqa: BLE001
        logger.exception("faculty sync error")
        return jsonify({"success": False, "error": str(e)}), 500
