// main.js
//import maplibregl from 'https://cdn.skypack.dev/maplibre-gl';
import maplibregl from 'https://esm.sh/maplibre-gl@2.4.0';

const map = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 1
});

async function loadPlugins(configPath) {
  const res = await fetch(configPath);
  const config = await res.json();

  for (const pluginName of config.plugins) {
    try {
      const plugin = await import(`./plugins/${pluginName}.js`);
      plugin.default(map);  // Pass map to the plugin
    } catch (err) {
      console.error(`Plugin "${pluginName}" failed to load:`, err);
    }
  }
}

map.on('load', () => {
  loadPlugins('./config.json');
});
