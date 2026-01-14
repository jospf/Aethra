from fastapi import FastAPI
from skyfield.api import load, wgs84
from datetime import datetime, timezone, timedelta
import time

app = FastAPI()

# Global variables for TLE caching
tle_data = None
last_tle_update = 0
TLE_CACHE_TTL = 3600  # 1 hour

def get_iss_data():
    global tle_data, last_tle_update
    
    now = time.time()
    # Refresh TLE if cache is old or empty
    if not tle_data or (now - last_tle_update) > TLE_CACHE_TTL:
        try:
            stations_url = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle'
            satellites = load.tle_file(stations_url)
            by_name = {sat.name: sat for sat in satellites}
            tle_data = by_name['ISS (ZARYA)']
            last_tle_update = now
        except Exception as e:
            if not tle_data:
                raise e
            # If fetch fails but we have old data, keep using it

    ts = load.timescale()
    t = ts.now()
    geocentric = tle_data.at(t)
    subpoint = wgs84.subpoint(geocentric)
    
    # Calculate velocity (crude but effective for display)
    vel = geocentric.velocity.km_per_s
    speed_kmh = sum(v*v for v in vel)**0.5 * 3600

    # Calculate orbital path (next 90 minutes, 1.5 min steps for ~60 points)
    segments = []
    current_segment = []
    
    for i in range(0, 91, 2):
        future_t = ts.from_datetime(datetime.now(timezone.utc) + timedelta(minutes=i))
        future_pos = tle_data.at(future_t)
        future_subpoint = wgs84.subpoint(future_pos)
        
        lon = future_subpoint.longitude.degrees
        lat = future_subpoint.latitude.degrees
        
        # Detect antimeridian crossing (longitude jump > 180)
        if current_segment:
            prev_lon = current_segment[-1][0]
            if abs(lon - prev_lon) > 180:
                segments.append(current_segment)
                current_segment = []
        
        current_segment.append([lon, lat])
    
    if current_segment:
        segments.append(current_segment)

    return {
        "name": "ISS (ZARYA)",
        "latitude": subpoint.latitude.degrees,
        "longitude": subpoint.longitude.degrees,
        "altitude": subpoint.elevation.km,
        "velocity": speed_kmh,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "path": segments
    }

@app.get("/")
def read_root():
    return {"message": "Aethra Backend Online"}

@app.get("/api/status")
def status():
    return {"status": "ok", "version": "2.0.0"}

@app.get("/api/iss")
def get_iss():
    try:
        return get_iss_data()
    except Exception as e:
        return {"error": str(e)}, 500
