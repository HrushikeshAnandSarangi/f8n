import os

from flask import Flask, jsonify

from .config import config_by_name
from .extensions import cors, db, migrate, socketio


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if db_uri.startswith("postgres://"):
        # Some hosts (Render, Heroku) hand out the legacy "postgres://" scheme;
        # SQLAlchemy 2.x only accepts "postgresql://".
        app.config["SQLALCHEMY_DATABASE_URI"] = db_uri.replace("postgres://", "postgresql://", 1)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    socketio.init_app(app)

    from . import models  # noqa: F401  registers all models with SQLAlchemy's metadata
    from . import blocks  # noqa: F401  registers all block types with the block registry

    from .api.backtests import backtests_bp
    from .api.blocks import blocks_bp
    from .api.leaderboard import leaderboard_bp
    from .api.paper_sessions import paper_sessions_bp
    from .api.strategies import strategies_bp

    app.register_blueprint(blocks_bp, url_prefix="/api/blocks")
    app.register_blueprint(strategies_bp, url_prefix="/api/strategies")
    app.register_blueprint(backtests_bp, url_prefix="/api/backtests")
    app.register_blueprint(paper_sessions_bp, url_prefix="/api/paper-sessions")
    app.register_blueprint(leaderboard_bp, url_prefix="/api/leaderboard")

    from . import sockets  # noqa: F401  registers Socket.IO event handlers

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app
