export default function initSunMoon(map) {
  const DEBUG = true;
  if (DEBUG) console.log("🌞 sunmoon plugin loaded");

  const config = {
    iconSize: 1.0,
    bodies: ['sun', 'moon'],
    icons: {
      sun: './assets/sun-icon.png',
      moon: './assets/moon-icon.png'
    },
    sources: {
      sun: 'sun-position',
      moon: 'moon-position'
    },
    layers: {
      sunIcon: 'sun-symbol',
      moonIcon: 'moon-symbol'
    }
  };

  function updatePositions() {
    if (DEBUG) console.log("🔁 updatePositions() called");

    fetch("http://localhost:5000/subpoints")
      .then(res => res.json())
      .then(data => {
        const subpoints = {
          sun: [data.sun.lon, data.sun.lat],
          moon: [data.moon.lon, data.moon.lat]
        };

        config.bodies.forEach(body => {
          const coord = subpoints[body];
          if (DEBUG) console.log(`🛰 Updating ${body} position:`, coord);

          map.getSource(config.sources[body]).setData({
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: coord },
              properties: {}
            }]
          });
        });
      })
      .catch(err => {
        console.error("❌ Failed to fetch subpoints:", err);
      });
  }

  function addSourcesAndLayers() {
    config.bodies.forEach(body => {
      map.addSource(config.sources[body], {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
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
    });

    updatePositions();
    setInterval(updatePositions, 15 * 60 * 1000); // every 15 minutes
  }

  function loadIconsThenAddLayers() {
    if (!map.isStyleLoaded()) {
      if (DEBUG) console.log("⏰ Waiting for style to load...");
      map.once('styledata', loadIconsThenAddLayers);
      return;
    }

    map.loadImage(config.icons.sun, (err, image) => {
      if (err || !image) return console.error("❌ Could not load sun image", err);
      if (!map.hasImage('sun-icon')) {
        map.addImage('sun-icon', image);
        if (DEBUG) console.log("✅ sun-icon added");
      }

      map.loadImage(config.icons.moon, (err2, image2) => {
        if (err2 || !image2) return console.error("❌ Could not load moon image", err2);
        if (!map.hasImage('moon-icon')) {
          map.addImage('moon-icon', image2);
          if (DEBUG) console.log("✅ moon-icon added");
        }

        if (DEBUG) console.log("✅ Both icons loaded — adding sources and layers");
        addSourcesAndLayers();
      });
    });
  }

  loadIconsThenAddLayers();
}
