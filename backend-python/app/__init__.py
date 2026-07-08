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

    # Structured faculty directory + tuition fees (served from Supabase — no tokens).
    try:
        from app.routes import faculty_routes, tuition_routes
        app.register_blueprint(faculty_routes.bp)
        app.register_blueprint(tuition_routes.bp)
    except Exception as e:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).warning("Faculty/tuition routes not loaded: %s", e)

    # AI Knowledge Pipeline (Phases 1–3) — registered only if it imports cleanly
    # so a missing optional dep (psycopg) never takes down the whole service.
    try:
        from app.routes import pipeline_routes, admin_routes
        app.register_blueprint(pipeline_routes.bp)
        app.register_blueprint(admin_routes.bp)
    except Exception as e:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).warning("Pipeline routes not loaded: %s", e)

    # Start the per-source scheduler (no-op when SCHEDULER_ENABLED=false or the DB
    # is unconfigured — production uses Render cron instead).
    try:
        from app.services import scheduler_service
        scheduler_service.start()
    except Exception as e:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).warning("Scheduler not started: %s", e)

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
