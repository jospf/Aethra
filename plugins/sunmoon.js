export default function initSunMoon(map) {
  const DEBUG = true;
  if (DEBUG) console.log("\ud83c\udf1e sunmoon plugin loaded");

  const config = {
    iconSize: 0.5,
    bodies: ['sun', 'moon'],
    icons: {
      sun: './assets/sun.png',
      moon: './assets/moon.png'
    },
    sources: {
      sun: 'sun-position',
      moon: 'moon-position',
      sunTrail: 'sun-track',
      moonTrail: 'moon-track'
    },
    layers: {
      sunIcon: 'sun-symbol',
      moonIcon: 'moon-symbol',
      sunLine: 'sun-track-line',
      moonLine: 'moon-track-line'
    },
    trails: {
      sun: [],
      moon: []
    }
  };

  function updatePositions() {
    if (DEBUG) console.log("\ud83d\udd01 updatePositions() called");

    fetch("http://localhost:5000/subpoints")
      .then(res => res.json())
      .then(data => {
        const subpoints = {
          sun: [data.sun.lon, data.sun.lat],
          moon: [data.moon.lon, data.moon.lat]
        };

        config.bodies.forEach(body => {
          const coord = subpoints[body];
          if (DEBUG) console.log(`\ud83d\ude80 Updating ${body} position:`, coord);

          map.getSource(config.sources[body]).setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: coord },
              properties: {}
            }]
          });

          config.trails[body].push(coord);
          if (config.trails[body].length > 120) config.trails[body].shift();

          map.getSource(config.sources[body + 'Trail']).setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [...config.trails[body]] }
          });
        });
      })
      .catch(err => {
        console.error("\u274c Failed to fetch subpoints:", err);
      });
  }

  function addSourcesAndLayers() {
    config.bodies.forEach(body => {
      map.addSource(config.sources[body], {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addSource(config.sources[body + 'Trail'], {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [] }
        }
      });

      map.addLayer({
        id: config.layers[body + 'Icon'],
        type: 'symbol',
        source: config.sources[body],
        layout: {
          'icon-image': `${body}-icon`,
          'icon-size': config.iconSize,
          'icon-allow-overlap': true
        }
      });

      map.addLayer({
        id: config.layers[body + 'Line'],
        type: 'line',
        source: config.sources[body + 'Trail'],
        paint: {
          'line-color': body === 'sun' ? '#ffcc00' : '#cccccc',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });
    });

    updatePositions();
    setInterval(updatePositions, 5000);
  }

  function loadIconsThenAddLayers() {
    if (!map.isStyleLoaded()) {
      if (DEBUG) console.log("\u23f0 Waiting for style to load...");
      map.once('styledata', loadIconsThenAddLayers);
      return;
    }

    map.loadImage(config.icons.sun, (err, image) => {
      if (err || !image) return console.error("\u274c Could not load sun image", err);
      if (!map.hasImage('sun-icon')) {
        map.addImage('sun-icon', image);
        if (DEBUG) console.log("\u2705 sun-icon added");
      }

      map.loadImage(config.icons.moon, (err2, image2) => {
        if (err2 || !image2) return console.error("\u274c Could not load moon image", err2);
        if (!map.hasImage('moon-icon')) {
          map.addImage('moon-icon', image2);
          if (DEBUG) console.log("\u2705 moon-icon added");
        }

        if (DEBUG) console.log("\u2705 Both icons loaded — adding sources and layers");
        addSourcesAndLayers();
      });
    });
  }

  loadIconsThenAddLayers();
}
