export default async function initWeather(map) {
  console.log("\u2601\ufe0f weather plugin loaded");

  let apiKey = null;
  let config = null;

  try {
    const res = await fetch('./localConfig.json');
    const local = await res.json();
    apiKey = local.weatherApiKey;
    if (!apiKey) throw new Error("No API key in localConfig.json");
  } catch (err) {
    console.warn("No valid API key found in localConfig.json. Skipping weather overlay.", err);
    return;
  }

  try {
    const configRes = await fetch('./config.json');
    config = await configRes.json();
  } catch (err) {
    console.warn("Could not load config.json:", err);
    return;
  }

  if (!config.weather || config.weather.enabled === false) {
    console.log("\u26c5 Weather plugin disabled in config.json");
    return;
  }

  const layerType = config.weather.layer || 'clouds_new';
  const opacity = config.weather.opacity ?? 0.5;

  const tileUrl = `https://tile.openweathermap.org/map/${layerType}/{z}/{x}/{y}.png?appid=${apiKey}`;

  map.addSource('weather-clouds', {
    type: 'raster',
    tiles: [tileUrl],
    tileSize: 256
  });

  map.addLayer({
    id: 'weather-cloud-layer',
    type: 'raster',
    source: 'weather-clouds',
    paint: {
      'raster-opacity': opacity
    }
  }, 'sun-symbol'); // ✅ Insert weather below sun (and moon) so icons stay visible

  console.log(`\u2601\ufe0f ${layerType} layer added to map with opacity ${opacity}`);
}
