import maplibregl from 'https://esm.sh/maplibre-gl@2.4.0';

const maplibreMap = new maplibregl.Map({
  container: 'map',
  style: 'https://demotiles.maplibre.org/style.json',
  center: [0, 0],
  zoom: 1
});

window.maplibreMap = maplibreMap;

async function loadPlugins(configPath) {
  const res = await fetch(configPath);
  const config = await res.json();

  for (const pluginName of config.plugins) {
    try {
      const plugin = await import(`./plugins/${pluginName}.js`);
      plugin.default(maplibreMap);  // Pass map to the plugin
    } catch (err) {
      console.error(`Plugin "${pluginName}" failed to load:`, err);
    }
  }
}

maplibreMap.on('load', () => {
  loadPlugins('./config.json');
});
