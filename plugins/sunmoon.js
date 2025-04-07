export default function initSunMoon(map) {
  console.log("🌞 sunmoon plugin loaded");

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

  // Load and register icon images
  function loadAndAddIcon(id, url) {
    map.loadImage(url, (err, image) => {
      if (err) {
        console.error(`❌ Failed to load ${id}:`, err);
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

  // Then call like:
  loadAndAddIcon('sun', 'sun-icon', './assets/sun.png');
  loadAndAddIcon('moon', 'moon-icon', './assets/moon.png');
  

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

  // Fetch subsolar/sublunar points from local Flask server
  function updatePositions() {
    console.log("🔁 updatePositions() called");

    fetch("http://localhost:5000/subpoints")
      .then(res => res.json())
      .then(data => {
        console.log("Fetched subpoints:", data);

        const subpoints = {
          sun: [data.sun.lon, data.sun.lat],
          moon: [data.moon.lon, data.moon.lat]
        };

        for (const body of ['sun', 'moon']) {
          const coord = subpoints[body];
          console.log(`🛰 Updating ${body} position:`, coord);

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
      })
      .catch(err => {
        console.error("❌ Failed to fetch subpoints:", err);
      });
  }

  // Call immediately, then every 5 seconds
  updatePositions();
  setInterval(updatePositions, 5000);
}
