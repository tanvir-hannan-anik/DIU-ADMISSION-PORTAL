from flask import Flask, jsonify
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from app.routes import ai_routes, health_routes, ingestion_routes, jobs_routes, live_data_routes
    app.register_blueprint(ai_routes.bp)
    app.register_blueprint(health_routes.bp)
    app.register_blueprint(ingestion_routes.bp)
    app.register_blueprint(jobs_routes.bp)
    app.register_blueprint(live_data_routes.bp)

    # Load existing knowledge base into memory on startup
    try:
        from app.services.knowledge_base_service import refresh_knowledge_base
        count = refresh_knowledge_base()
        if count:
            import logging
            logging.getLogger(__name__).info(f"Startup: loaded {count} departments into AI knowledge base")
    except Exception:
        pass

    # Warm web scraper caches in background on startup (best-effort)
    try:
        import threading
        from app.services.web_scraper_service import (
            fetch_scholarships, fetch_tuition_fees, fetch_faculty_list
        )
        def _warm_scraper():
            import logging as _log
            _lg = _log.getLogger("scraper_warmup")
            try:
                fetch_scholarships()
                _lg.info("Scholarship scraper warmed")
            except Exception as e:
                _lg.warning("Scholarship warmup failed: %s", e)
            try:
                fetch_tuition_fees()
                _lg.info("Tuition fee scraper warmed")
            except Exception as e:
                _lg.warning("Tuition fee warmup failed: %s", e)
            try:
                fetch_faculty_list()
                _lg.info("Faculty scraper warmed")
            except Exception as e:
                _lg.warning("Faculty warmup failed: %s", e)
        threading.Thread(target=_warm_scraper, daemon=True).start()
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
