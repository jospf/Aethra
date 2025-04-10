export default async function initSunMoon(map) {
  const DEBUG = true;
  if (DEBUG) console.log("\ud83c\udf1e sunmoon plugin loaded");

  const configResponse = await fetch('./config.json');
  const fullConfig = await configResponse.json();
  const defaultConfig = { showSun: true, showMoon: true };
  const pluginConfig = { ...defaultConfig, ...(fullConfig.sunmoon || {}) };

  const iconSize = 1.1;
  const bodies = [];
  if (pluginConfig.showSun === true) bodies.push('sun');
  if (pluginConfig.showMoon === true) bodies.push('moon');

  const sources = {
    sun: 'sun-position',
    moon: 'moon-position'
  };

  const layers = {
    sunIcon: 'sun-symbol',
    moonIcon: 'moon-symbol'
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

        bodies.forEach(body => {
          const coord = subpoints[body];
          if (DEBUG) console.log(`\ud83d\ude80 Updating ${body} position:`, coord);

          map.getSource(sources[body]).setData({
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
        console.error("\u274c Failed to fetch subpoints:", err);
      });
  }

  function addSourcesAndLayers() {
    bodies.forEach(body => {
      map.addSource(sources[body], {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
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
    });

    updatePositions();
    setInterval(updatePositions, 15 * 60 * 1000); // every 15 minutes
  }

  function loadIconsThenAddLayers() {
    if (!map.isStyleLoaded()) {
      if (DEBUG) console.log("\u23f0 Waiting for style to load...");
      map.once('styledata', loadIconsThenAddLayers);
      return;
    }

    const loadQueue = bodies.map(body => new Promise((resolve, reject) => {
      map.loadImage(`./assets/${body}.png`, (err, image) => {
        if (err || !image) {
          console.error(`\u274c Could not load ${body} icon`, err);
          resolve(); // silently continue if file is missing
        } else {
          if (!map.hasImage(`${body}-icon`)) {
            map.addImage(`${body}-icon`, image);
            if (DEBUG) console.log(`\u2705 ${body}-icon added`);
          }
          resolve();
        }
      });
    }));

    Promise.all(loadQueue)
      .then(() => {
        if (DEBUG) console.log("\u2705 All icons processed — adding sources and layers");
        addSourcesAndLayers();
      })
      .catch(err => console.error("\u274c Icon load failure", err));
  }

  loadIconsThenAddLayers();
}
