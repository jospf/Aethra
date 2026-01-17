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


@app.get("/api/flights")
def get_flights():
    """
    Get real-time flight data from OpenSky Network
    Returns GeoJSON of aircraft positions
    """
    import requests
    
    try:
        response = requests.get(
            'https://opensky-network.org/api/states/all',
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"OpenSky API error: {response.status_code}")
            return {"type": "FeatureCollection", "features": []}
        
        data = response.json()
        states = data.get('states', [])
        
        features = []
        for state in states[:500]:  # Limit for performance
            if state[5] is None or state[6] is None:
                continue
            
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [state[5], state[6]]
                },
                "properties": {
                    "icao24": state[0],
                    "callsign": (state[1] or "").strip(),
                    "country": state[2],
                    "altitude": state[7],
                    "on_ground": state[8],
                    "velocity": state[9],
                    "heading": state[10],
                    "vertical_rate": state[11]
                }
            }
            features.append(feature)
        
        print(f"Returning {len(features)} aircraft")
        return {"type": "FeatureCollection", "features": features}
        
    except Exception as e:
        print(f"Error fetching flights: {e}")
        return {"type": "FeatureCollection", "features": []}


# --- Maritime Tracking (AisStream.io) ---

import asyncio
import websockets
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Global in-memory storage for ship data
# { mmsi: { lat, lon, name, etc, timestamp } }
ships_data = {}

async def connect_to_aisstream():
    """
    Background task to connect to AisStream.io WebSocket
    and update ships_data in real-time.
    """
    api_key = os.getenv("AISSTREAM_API_KEY")
    if not api_key:
        print("AISSTREAM_API_KEY not found in .env - Maritime tracking disabled")
        return

    print(f"Starting AisStream connection with key: {api_key[:5]}...")
    
    # Subscribe to PositionReport and ShipStaticData messages for the whole world
    subscription_message = {
        "APIKey": api_key,
        "BoundingBoxes": [[[-90, -180], [90, 180]]], # Global coverage
        "FilterMessageTypes": ["PositionReport", "ShipStaticData"],
        "FilterShipMMSI": [] 
    }

    while True:
        try:
            async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
                await websocket.send(json.dumps(subscription_message))
                print("Connected to AisStream.io WebSocket")
                
                async for message_json in websocket:
                    try:
                        message = json.loads(message_json)
                        msg_type = message.get("MessageType")
                        
                        if msg_type == "PositionReport":
                            report = message["Message"]["PositionReport"]
                            mmsi = report["UserID"]
                            
                            # Create or update entry
                            if mmsi not in ships_data:
                                ships_data[mmsi] = {}
                                
                            ships_data[mmsi].update({
                                "mmsi": mmsi,
                                "lat": report["Latitude"],
                                "lon": report["Longitude"],
                                "sog": report.get("Sog", 0),  # Speed over ground
                                "cog": report.get("Cog", 0),  # Course over ground
                                "timestamp": datetime.now(timezone.utc).timestamp()
                            })
                            
                        elif msg_type == "ShipStaticData":
                            report = message["Message"]["ShipStaticData"]
                            mmsi = report["UserID"]
                            
                            if mmsi not in ships_data:
                                ships_data[mmsi] = {}
                                
                            ships_data[mmsi].update({
                                "name": report.get("Name", "Unknown").strip(),
                                "ship_type": report.get("Type", 0),
                                "callsign": report.get("CallSign", "").strip(),
                                "destination": report.get("Destination", "").strip(),
                                "timestamp": datetime.now(timezone.utc).timestamp()
                            })
                            
                        # Prune old ships (simulated garbage collection)
                        # In a production app, do this periodically, not every message
                        if len(ships_data) > 2000:
                            # Keep only recent 1000 ships
                            sorted_ships = sorted(ships_data.items(), key=lambda x: x[1].get('timestamp', 0), reverse=True)
                            ships_data.clear()
                            ships_data.update(dict(sorted_ships[:1000]))
                            
                    except Exception as msg_error:
                        # Ignore malformed messages
                        pass
                        
        except Exception as e:
            print(f"AisStream WebSocket error: {e}")
            print("Reconnecting in 10 seconds...")
            await asyncio.sleep(10)

@app.on_event("startup")
async def startup_event():
    # Start the AIS background task
    asyncio.create_task(connect_to_aisstream())

@app.get("/api/ships")
def get_ships():
    """
    Get real-time maritime traffic data
    Returns GeoJSON of ship positions
    """
    features = []
    current_time = datetime.now(timezone.utc).timestamp()
    
    # Convert dict to list for iteration to avoid runtime errors if dict changes size
    for mmsi, data in list(ships_data.items()):
        # Filter out very old stale data (> 10 minutes)
        if current_time - data.get('timestamp', 0) > 600:
            continue
            
        if 'lat' not in data or 'lon' not in data:
            continue
            
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [data['lon'], data['lat']]
            },
            "properties": {
                "mmsi": data.get("mmsi"),
                "name": data.get("name", "Unknown"),
                "type": data.get("ship_type", 0),
                "speed": data.get("sog", 0),
                "heading": data.get("cog", 0),
                "destination": data.get("destination", "Unknown")
            }
        }
        features.append(feature)
    
    return {"type": "FeatureCollection", "features": features}
