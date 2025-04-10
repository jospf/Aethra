from flask import Flask, jsonify
from flask_cors import CORS
from skyfield.api import load, EarthSatellite
from skyfield.toposlib import wgs84
from datetime import datetime, timezone
import requests
import traceback

app = Flask(__name__)
CORS(app, origins=["http://localhost:8000"])

# Load ephemeris and time
eph = load('de421.bsp')
ts = load.timescale()
earth = eph['earth']
sun = eph['sun']
moon = eph['moon']

@app.route('/subpoints')
def subpoints():
    t = ts.now()

    # Get the Geocentric position vector from Earth to Sun/Moon
    sun_astrometric = earth.at(t).observe(sun).apparent()
    moon_astrometric = earth.at(t).observe(moon).apparent()

    # Convert that vector to subpoints using WGS84 Earth model
    sun_sp = wgs84.subpoint(sun_astrometric)
    moon_sp = wgs84.subpoint(moon_astrometric)

    return jsonify({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sun": {
            "lat": sun_sp.latitude.degrees,
            "lon": sun_sp.longitude.degrees
        },
        "moon": {
            "lat": moon_sp.latitude.degrees,
            "lon": moon_sp.longitude.degrees
        }
    })

ts = load.timescale()
planets = load('de421.bsp')
earth, sun = planets['earth'], planets['sun']


@app.route('/iss')
def iss():
    try:
        # fallback TLE
        fallback_tle = [
            "ISS (ZARYA)",
            "1 25544U 98067A   24100.67873843  .00003578  00000+0  73447-4 0  9994",
            "2 25544  51.6384 104.1685 0004321 305.4353 182.5320 15.50086897439957"
        ]
        name, line1, line2 = fallback_tle

        satellite = EarthSatellite(line1, line2, name, ts)
        t = ts.now()
        subpoint = wgs84.subpoint(satellite.at(t))

        return jsonify({
            "timestamp": t.utc_iso(),
            "lat": subpoint.latitude.degrees,
            "lon": subpoint.longitude.degrees
        })

    except Exception as e:
        print("❌ ISS route error:")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@app.route('/terminator')
def terminator():
    t = ts.now()
    points = []

    for lon in range(-180, 181, 2):  # Sample every 5°
        lat_min, lat_max = -90, 90
        for _ in range(10):  # Binary search
            lat_mid = (lat_min + lat_max) / 2
            location = wgs84.latlon(lat_mid, lon)
            observer = earth + location  # ✅ FIXED LINE
            alt, az, distance = observer.at(t).observe(sun).apparent().altaz()

            if alt.degrees > 0:
                lat_max = lat_mid
            else:
                lat_min = lat_mid

        points.append([lon, lat_mid])

    return jsonify({
        "terminator": points,
        "timestamp": t.utc_iso()
    })

if __name__ == '__main__':
    app.run(debug=True)
