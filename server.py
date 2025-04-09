from flask import Flask, jsonify
from flask_cors import CORS
from skyfield.api import load
from skyfield.toposlib import wgs84
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

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

if __name__ == '__main__':
    app.run(debug=True)
