"""Application routes blueprint."""

from __future__ import annotations

from datetime import datetime, timezone
import traceback

import requests
from flask import Blueprint, current_app, jsonify
from skyfield import almanac
from skyfield.api import EarthSatellite

bp = Blueprint("api", __name__)


def _get_skyfield_objects():
    config = current_app.config
    return (
        config["SKYFIELD_TS"],
        config["SKYFIELD_WGS84"],
        config["SKYFIELD_EARTH"],
        config["SKYFIELD_SUN"],
        config["SKYFIELD_MOON"],
        config["SKYFIELD_EPH"],
    )


@bp.route("/subpoints")
def subpoints():
    ts, wgs84, earth, sun, moon, _ = _get_skyfield_objects()
    t = ts.now()

    sun_astrometric = earth.at(t).observe(sun).apparent()
    moon_astrometric = earth.at(t).observe(moon).apparent()

    sun_sp = wgs84.subpoint(sun_astrometric)
    moon_sp = wgs84.subpoint(moon_astrometric)

    return jsonify(
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sun": {"lat": sun_sp.latitude.degrees, "lon": sun_sp.longitude.degrees},
            "moon": {"lat": moon_sp.latitude.degrees, "lon": moon_sp.longitude.degrees},
        }
    )


@bp.route("/iss")
def iss():
    ts, wgs84, *_ = _get_skyfield_objects()
    try:
        fallback_tle = [
            "ISS (ZARYA)",
            "1 25544U 98067A   24100.67873843  .00003578  00000+0  73447-4 0  9994",
            "2 25544  51.6384 104.1685 0004321 305.4353 182.5320 15.50086897439957",
        ]
        name, line1, line2 = fallback_tle

        satellite = EarthSatellite(line1, line2, name, ts)
        t = ts.now()
        subpoint = wgs84.subpoint(satellite.at(t))

        return jsonify(
            {
                "timestamp": t.utc_iso(),
                "lat": subpoint.latitude.degrees,
                "lon": subpoint.longitude.degrees,
            }
        )

    except Exception as exc:  # pragma: no cover - log and propagate error response
        print("❌ ISS route error:")
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


@bp.route("/terminator")
def terminator():
    ts, wgs84, earth, sun, *_ = _get_skyfield_objects()
    t = ts.now()
    points = []

    for lon in range(-180, 181, 2):
        lat_min, lat_max = -90, 90
        for _ in range(10):
            lat_mid = (lat_min + lat_max) / 2
            location = wgs84.latlon(lat_mid, lon)
            observer = earth + location
            alt, az, distance = observer.at(t).observe(sun).apparent().altaz()

            if alt.degrees > 0:
                lat_max = lat_mid
            else:
                lat_min = lat_mid

        points.append([lon, lat_mid])

    return jsonify({"terminator": points, "timestamp": t.utc_iso()})


@bp.route("/starlink")
def starlink():
    ts, wgs84, *_ = _get_skyfield_objects()
    try:
        tle_url = "https://celestrak.org/NORAD/elements/supplemental/sup-gp.php?FILE=starlink&FORMAT=tle"
        response = requests.get(tle_url)
        response.raise_for_status()

        print("Fetched TLE data:", response.text[:500])

        tle_lines = response.text.strip().split("\n")

        if not tle_lines or len(tle_lines) < 3:
            return jsonify({"error": "No valid TLE data found"}), 500

        print("Parsed TLE lines:", tle_lines[:6])

        satellites = []

        for i in range(0, len(tle_lines), 3):
            if i + 2 >= len(tle_lines):
                print(f"Skipping incomplete TLE entry at lines {i}-{i + 2}")
                continue

            name = tle_lines[i].strip()
            line1 = tle_lines[i + 1].strip()
            line2 = tle_lines[i + 2].strip()

            try:
                satellite = EarthSatellite(line1, line2, name, ts)
                t = ts.now()
                subpoint = wgs84.subpoint(satellite.at(t))

                satellites.append(
                    {
                        "name": name,
                        "latitude": subpoint.latitude.degrees,
                        "longitude": subpoint.longitude.degrees,
                    }
                )
            except Exception as exc:  # pragma: no cover - log and continue
                print(f"Error processing satellite {name}: {exc}")

        return jsonify({"timestamp": datetime.now(timezone.utc).isoformat(), "satellites": satellites})

    except Exception as exc:  # pragma: no cover - log and propagate error response
        print("❌ Starlink route error:")
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500


@bp.route("/moon")
def moon_info():
    ts, wgs84, earth, sun, moon, eph = _get_skyfield_objects()
    try:
        t = ts.now()

        moon_astrometric = earth.at(t).observe(moon).apparent()
        subpoint = wgs84.subpoint(moon_astrometric)

        phase_angle = almanac.moon_phase(eph, t).degrees
        illumination = almanac.fraction_illuminated(eph, "moon", t)

        def describe_phase(angle: float) -> str:
            if angle < 22.5:
                return "New Moon"
            if angle < 67.5:
                return "Waxing Crescent"
            if angle < 112.5:
                return "First Quarter"
            if angle < 157.5:
                return "Waxing Gibbous"
            if angle < 202.5:
                return "Full Moon"
            if angle < 247.5:
                return "Waning Gibbous"
            if angle < 292.5:
                return "Last Quarter"
            if angle < 337.5:
                return "Waning Crescent"
            return "New Moon"

        return jsonify(
            {
                "timestamp": t.utc_iso(),
                "lat": subpoint.latitude.degrees,
                "lon": subpoint.longitude.degrees,
                "phase": describe_phase(phase_angle),
                "illumination": round(illumination * 100, 1),
            }
        )

    except Exception as exc:  # pragma: no cover - log and propagate error response
        print("❌ /moon route error:")
        traceback.print_exc()
        return jsonify({"error": str(exc)}), 500
