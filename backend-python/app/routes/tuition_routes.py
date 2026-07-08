"""
Tuition Fee Routes
------------------
Serves the structured tuition-fee table straight from Supabase — NO tokens.

GET  /api/v1/tuition-fees          — all programs grouped by faculty
GET  /api/v1/tuition-fees/flat     — flat list
POST /api/v1/tuition-fees/sync     — refresh from the DIU public API
"""

import logging
from flask import Blueprint, jsonify

from app.db import pg
from app.repositories import tuition_fee_repo

logger = logging.getLogger(__name__)
bp = Blueprint("tuition", __name__, url_prefix="/api/v1/tuition-fees")


def _guard():
    if not pg.is_configured():
        return jsonify({"success": False, "error": "DATABASE_URL not configured",
                        "errorCode": "DB_NOT_CONFIGURED"}), 503
    return None


@bp.route("", methods=["GET"])
@bp.route("/", methods=["GET"])
def list_fees():
    guard = _guard()
    if guard:
        return guard
    return jsonify({"success": True, "count": tuition_fee_repo.count(),
                    "data": tuition_fee_repo.grouped()}), 200


@bp.route("/flat", methods=["GET"])
def flat():
    guard = _guard()
    if guard:
        return guard
    return jsonify({"success": True, "data": tuition_fee_repo.list_active()}), 200


@bp.route("/sync", methods=["POST"])
def sync():
    guard = _guard()
    if guard:
        return guard
    from app.services import tuition_fee_service
    try:
        return jsonify(tuition_fee_service.sync()), 200
    except Exception as e:  # noqa: BLE001
        logger.exception("tuition sync error")
        return jsonify({"success": False, "error": str(e)}), 500
