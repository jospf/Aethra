from fastapi import FastAPI
from skyfield.api import load, wgs84
from skyfield import almanac
from datetime import datetime, timezone

app = FastAPI()

# Initialize Skyfield
# This will download the file if not present, which might take a moment on first run.
ts = load.timescale()
ephemeris = load('de421.bsp')
moon = ephemeris['moon']
earth = ephemeris['earth']
sun = ephemeris['sun']

@app.get("/")
def read_root():
    return {"message": "Aethra Backend Online"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/moon")
def get_moon_data():
    t = ts.now()
    
    # Position
    astrometric = earth.at(t).observe(moon)
    subpoint = wgs84.subpoint(astrometric)
    
    # Phase calculation
    # Calculate phase angle to determine the correct image
    e = earth.at(t)
    
    # Use ecliptic frame for phase angle calculation
    from skyfield.framelib import ecliptic_frame
    _, sun_lon, _ = e.observe(sun).apparent().frame_latlon(ecliptic_frame)
    _, moon_lon, _ = e.observe(moon).apparent().frame_latlon(ecliptic_frame)
    
    phase_angle = (moon_lon.degrees - sun_lon.degrees) % 360.0
    
    # Map angle to 8 phases
    # 0 = New, 90 = First Quarter, 180 = Full, 270 = Last Quarter
    # Segments are centered on these:
    # New: 337.5 - 22.5
    # Waxing Crescent: 22.5 - 67.5
    # First Quarter: 67.5 - 112.5
    # ...
    
    phase_idx = int((phase_angle + 22.5) / 45.0) % 8
    
    phases = [
        "moon-new-moon",       # 0
        "moon-waxing-crescent",# 1
        "moon-first-quarter",  # 2
        "moon-waxing-gibbous", # 3
        "moon-full-moon",      # 4
        "moon-waning-gibbous", # 5
        "moon-last-quarter",   # 6
        "moon-waning-crescent" # 7
    ]
    phase_name = phases[phase_idx]
    
    # Fraction illuminated
    percent = almanac.fraction_illuminated(ephemeris, 'moon', t)

    return {
        "latitude": subpoint.latitude.degrees,
        "longitude": subpoint.longitude.degrees,
        "phase_name": phase_name,
        "illumination": percent,
        "phase_angle": phase_angle
    }
