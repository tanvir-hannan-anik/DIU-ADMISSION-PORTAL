from flask import Flask, jsonify
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    from app.routes import ai_routes, health_routes
    app.register_blueprint(ai_routes.bp)
    app.register_blueprint(health_routes.bp)

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
