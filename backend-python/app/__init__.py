from flask import Flask, jsonify
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from app.routes import ai_routes, health_routes, ingestion_routes, jobs_routes
    app.register_blueprint(ai_routes.bp)
    app.register_blueprint(health_routes.bp)
    app.register_blueprint(ingestion_routes.bp)
    app.register_blueprint(jobs_routes.bp)

    # Load existing knowledge base into memory on startup
    try:
        from app.services.knowledge_base_service import refresh_knowledge_base
        count = refresh_knowledge_base()
        if count:
            import logging
            logging.getLogger(__name__).info(f"Startup: loaded {count} departments into AI knowledge base")
    except Exception:
        pass

    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'service': 'DIU AI Microservice',
            'status': 'running',
            'endpoints': {
                'health': '/api/v1/health/check',
                'ai':     '/api/v1/ai/process'
            }
        }), 200

    return app
