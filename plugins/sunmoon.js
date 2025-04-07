import SunCalc from 'https://cdn.jsdelivr.net/npm/suncalc/+esm';

export default function initSunMoon(map) {
  const sources = {
    sun: 'sun-position',
    moon: 'moon-position',
    sunTrail: 'sun-track',
    moonTrail: 'moon-track'
  };

  const layers = {
    sunIcon: 'sun-symbol',
    moonIcon: 'moon-symbol',
    sunLine: 'sun-track-line',
    moonLine: 'moon-track-line'
  };

  const icons = {
    sun: './assets/sun.png',
    moon: './assets/moon.png'
  };

  const trails = {
    sun: [],
    moon: []
  };

  const iconSize = 0.50;

  // Load and add icons
  function loadAndAddIcon(id, url) {
    map.loadImage(url, (err, image) => {
      if (err) {
        console.error(`Failed to load ${id}:`, err);
        return;
      }
      if (!map.hasImage(id)) {
        map.addImage(id, image);
        console.log(`✅ Loaded image: ${id}`);
      }
    });
  }

  loadAndAddIcon('sun-icon', icons.sun);
  loadAndAddIcon('moon-icon', icons.moon);

  // Add sources and layers
  for (const body of ['sun', 'moon']) {
    map.addSource(sources[body], {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addSource(sources[body + 'Trail'], {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [] }
      }
    });

    map.addLayer({
      id: layers[body + 'Icon'],
      type: 'symbol',
      source: sources[body],
      layout: {
        'icon-image': `${body}-icon`,
        'icon-size': iconSize,
        'icon-allow-overlap': true
      }
    });

    map.addLayer({
      id: layers[body + 'Line'],
      type: 'line',
      source: sources[body + 'Trail'],
      paint: {
        'line-color': body === 'sun' ? '#ffcc00' : '#cccccc',
        'line-width': 2,
        'line-opacity': 0.8
      }
    });
  }

  function updatePositions() {
    const now = new Date();
  
    // SUN SUBPOINT (correct using declination and GHA)
    const sunPos = SunCalc.getPosition(now, 0, 0);
    const sunLat = sunPos.altitude * (180 / Math.PI); // declination ≈ subsolar latitude
    const sunGHA = (now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600) * 15;
    const sunLon = ((-sunGHA + 360) % 360) - 180;
  
    // MOON SUBPOINT (approx using same logic)
    const moonPos = SunCalc.getMoonPosition(now, 0, 0);
    const moonLat = moonPos.altitude * (180 / Math.PI); // approx lunar declination
    const moonGHA = (now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600) * 15;
    const moonLon = ((-moonGHA + moonPos.azimuth * (180 / Math.PI) + 360) % 360) - 180;
  
    const subpoints = {
      sun: [sunLon, sunLat],
      moon: [moonLon, moonLat]
    };
  
    for (const body of ['sun', 'moon']) {
      const coord = subpoints[body];
  
      map.getSource(sources[body]).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coord },
          properties: {}
        }]
      });
  
      trails[body].push(coord);
      if (trails[body].length > 120) trails[body].shift();
  
      map.getSource(sources[body + 'Trail']).setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [...trails[body]] }
        });
    }
  }
  
  updatePositions();
  setInterval(updatePositions, 5000);
}
