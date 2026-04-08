"""
Ingestion API Routes
---------------------
POST /api/v1/ingestion/run          — Process all images (skip already done)
POST /api/v1/ingestion/run?force=1  — Reprocess all images
POST /api/v1/ingestion/refresh-kb   — Reload KB from existing JSONs (no re-OCR)
GET  /api/v1/ingestion/status       — Show pipeline status
GET  /api/v1/ingestion/dataset      — Return full departments dataset
"""

import logging
from flask import Blueprint, jsonify, request
from app.services.ingestion_service import (
    ingest_all, get_ingestion_status, load_dataset
)
from app.services.knowledge_base_service import refresh_knowledge_base

logger = logging.getLogger(__name__)
bp = Blueprint('ingestion', __name__, url_prefix='/api/v1/ingestion')


@bp.route('/run', methods=['POST'])
def run_ingestion():
    """Trigger full ingestion pipeline."""
    force = request.args.get('force', '0') == '1'
    try:
        result = ingest_all(force=force)
        return jsonify({"success": True, "data": result}), 200
    except FileNotFoundError as e:
        return jsonify({"success": False, "error": str(e)}), 404
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/refresh-kb', methods=['POST'])
def refresh_kb():
    """Reload knowledge base from existing JSON files without re-OCR."""
    try:
        count = refresh_knowledge_base()
        return jsonify({"success": True, "departments_loaded": count}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/status', methods=['GET'])
def status():
    """Return ingestion pipeline status."""
    try:
        return jsonify({"success": True, "data": get_ingestion_status()}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/dataset', methods=['GET'])
def dataset():
    """Return the full departments dataset."""
    try:
        return jsonify({"success": True, "data": load_dataset()}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
