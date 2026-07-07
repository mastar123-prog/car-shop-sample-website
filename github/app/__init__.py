from flask import Flask
from .config import Config
from .db import init_db
from .security import csrf, limiter

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    csrf.init_app(app)
    limiter.init_app(app)

    init_db()

    from .routes.vault import vault_bp
    from .routes.tools import tools_bp
    from .routes.health import health_bp

    app.register_blueprint(vault_bp, url_prefix="/v")
    app.register_blueprint(tools_bp)
    app.register_blueprint(health_bp)

    @app.errorhandler(Exception)
    def handle_error(e):
        return {"error": "internal_error"}, 500

    return app