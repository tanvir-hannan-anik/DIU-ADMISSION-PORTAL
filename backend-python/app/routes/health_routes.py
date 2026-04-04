from flask import Blueprint, jsonify
from datetime import datetime

bp = Blueprint('health', __name__, url_prefix='/api/v1/health')


@bp.route('/check', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'DIU AI Microservice',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200
