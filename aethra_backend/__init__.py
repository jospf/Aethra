"""Aethra backend application factory."""

from __future__ import annotations

from flask import Flask
from flask_cors import CORS
from skyfield.api import load
from skyfield.toposlib import wgs84


def create_app(config: dict | None = None) -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    if config:
        app.config.update(config)

    CORS(app, origins=["http://localhost:8000"])

    eph = load("de421.bsp")
    ts = load.timescale()
    earth = eph["earth"]
    sun = eph["sun"]
    moon = eph["moon"]

    app.config["SKYFIELD_TS"] = ts
    app.config["SKYFIELD_WGS84"] = wgs84
    app.config["SKYFIELD_EARTH"] = earth
    app.config["SKYFIELD_SUN"] = sun
    app.config["SKYFIELD_MOON"] = moon
    app.config["SKYFIELD_EPH"] = eph

    from .routes import bp as api_bp

    app.register_blueprint(api_bp)

    return app


__all__ = ["create_app"]
