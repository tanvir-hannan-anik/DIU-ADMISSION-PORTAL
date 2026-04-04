from flask import Flask
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    from app.routes import ai_routes, health_routes
    app.register_blueprint(ai_routes.bp)
    app.register_blueprint(health_routes.bp)

    return app
