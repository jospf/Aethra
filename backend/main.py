from fastapi import FastAPI
from skyfield.api import load, wgs84
from skyfield import almanac
from datetime import datetime, timezone
import json
import os

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

@app.get("/api/iss")
def get_iss_position():
    # Load ISS TLE data (stations.txt)
    # Using the cached file or downloading if needed
    stations_url = 'http://celestrak.org/NORAD/elements/stations.txt'
    satellites = load.tle_file(stations_url)
    by_name = {sat.name: sat for sat in satellites}
    iss = by_name['ISS (ZARYA)']

    t = ts.now()
    geocentric = iss.at(t)
    subpoint = wgs84.subpoint(geocentric)

    return {
        "latitude": subpoint.latitude.degrees,
        "longitude": subpoint.longitude.degrees
    }


@app.get("/api/volcanoes")
def get_volcanoes():
    """
    Get volcano data as GeoJSON enriched with real-time activity from GVP Weekly Report
    """
    try:
        # Load base volcano data from volcanoes.json
        volcano_file_path = os.path.join(os.path.dirname(__file__), 'volcanoes.json')
        
        with open(volcano_file_path, 'r') as f:
            volcano_data = json.load(f)
        
        # Fetch current volcanic activity from GVP RSS
        try:
            import feedparser
            
            gvp_rss_url = 'https://volcano.si.edu/news/WeeklyVolcanoRSS.xml'
            feed = feedparser.parse(gvp_rss_url)
            
            # Extract volcano names from RSS entries
            active_volcanoes = set()
            for entry in feed.entries:
                # Entry title format: "Volcano Name (Country) - Activity Description"
                title = entry.get('title', '')
                if ' (' in title:
                    volcano_name = title.split(' (')[0].strip()
                    active_volcanoes.add(volcano_name.lower())
            
            # Enrich volcano data with current status
            for feature in volcano_data['features']:
                volcano_name = feature['properties'].get('name', '').lower()
                
                # If volcano is in the GVP weekly report, mark as erupting
                if volcano_name in active_volcanoes:
                    feature['properties']['status'] = 'Erupting'
                    feature['properties']['alert_level'] = 'high'
                # Otherwise keep existing status or mark as monitored
                elif feature['properties'].get('status') == 'Erupting':
                    # Downgrade if not in current reports
                    feature['properties']['status'] = 'Active'
                    feature['properties']['alert_level'] = 'medium'
                else:
                    feature['properties']['alert_level'] = 'low'
            
            print(f"Successfully enriched volcano data with {len(active_volcanoes)} active volcanoes from GVP")
            
        except Exception as rss_error:
            print(f"Warning: Could not fetch GVP RSS feed: {rss_error}")
            # Continue with static data if RSS fails
            for feature in volcano_data['features']:
                # Set default alert levels based on existing status
                status = feature['properties'].get('status', 'Monitored')
                if status == 'Erupting':
                    feature['properties']['alert_level'] = 'high'
                elif status in ['Active', 'Restless']:
                    feature['properties']['alert_level'] = 'medium'
                else:
                    feature['properties']['alert_level'] = 'low'
        
        return volcano_data
        
    except FileNotFoundError:
        return {"type": "FeatureCollection", "features": []}
    except Exception as e:
        print(f"Error loading volcano data: {e}")
        return {"type": "FeatureCollection", "features": []}



