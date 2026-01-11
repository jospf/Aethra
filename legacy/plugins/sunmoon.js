export default async function initSunMoon(map) {
  const DEBUG = true;
  console.log("🌞 sunmoon plugin loaded");

  // Load plugin configuration
  let showSun = true;
  let showMoon = true;
  try {
    const conf = await fetch("./config.json").then(r => r.json());
    if (conf.sunmoon) {
      showSun = conf.sunmoon.showSun !== false;
      showMoon = conf.sunmoon.showMoon !== false;
    }
  } catch (err) {
    console.warn('⚠️ sunmoon config missing or invalid, using defaults', err);
  }

  // Icon sizes (adjust as needed)
  const iconSizeSun = 1;
  const iconSizeMoon = 1;

  // ADD SUN LAYER
  if (showSun) {
    try {
      await new Promise(res => map.loadImage('./assets/sun.png', (e, img) => {
        if (!e && img) map.addImage('sun-icon', img);
        res();
      }));
      map.addSource('sun-pos', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'sun-sym',
        type: 'symbol',
        source: 'sun-pos',
        layout: {
          'icon-image': 'sun-icon',
          'icon-size': iconSizeSun,
          'icon-allow-overlap': true
        }
      });
      if (DEBUG) console.log('✅ Sun layer added');
    } catch (e) {
      console.error('❌ Sun init failed', e);
    }
  }

  // PRELOAD MOON PHASE ICONS AND ADD MOON LAYER
  const moonPhases = [
    'new-moon','waxing-crescent','first-quarter','waxing-gibbous',
    'full-moon','waning-gibbous','last-quarter','waning-crescent'
  ];
  if (showMoon) {
    for (const phase of moonPhases) {
      const name = `moon-${phase}`;
      await new Promise(res => map.loadImage(`./assets/moon_phases/${name}.png`, (e, img) => {
        if (!e && img) map.addImage(name, img);
        res();
      }));
      if (DEBUG) console.log(`✅ Preloaded ${name}`);
    }
    map.addSource('moon-pos', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: 'moon-sym',
      type: 'symbol',
      source: 'moon-pos',
      layout: {
        'icon-image': 'moon-new-moon',
        'icon-size': iconSizeMoon,
        'icon-allow-overlap': true
      }
    });
    if (DEBUG) console.log('✅ Moon layer added');
  }

  // UPDATE FUNCTION
  async function updatePositions() {
    if (showSun) {
      try {
        const sp = await fetch('http://localhost:5000/subpoints').then(r => r.json());
        map.getSource('sun-pos').setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [sp.sun.lon, sp.sun.lat] } }]
        });
      } catch (e) {
        console.error('❌ Sun update failed', e);
      }
    }
    if (showMoon) {
      try {
        const md = await fetch('http://localhost:5000/moon').then(r => r.json());
        const phaseKey = md.phase.toLowerCase().replace(/\s+/g, '-');
        const iconName = `moon-${phaseKey}`;
        map.setLayoutProperty('moon-sym', 'icon-image', iconName);
        if (DEBUG) console.log(`🌗 Moon phase icon set to ${iconName}`);
        map.getSource('moon-pos').setData({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [md.lon, md.lat] }, properties: { title: `${md.phase} (${md.illumination}%)` } }]
        });
      } catch (e) {
        console.error('❌ Moon update failed', e);
      }
    }
  }

  // INITIAL UPDATE & INTERVAL
  await updatePositions();
  setInterval(updatePositions, 60 * 1000);
}
