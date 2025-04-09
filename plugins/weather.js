export default async function initWeather(map) {
    console.log("☁️ Weather plugin loaded");
  
    try {
      const res = await fetch('./config.json');
      const config = await res.json();
      const apiKey = config.weather?.openweathermap_api_key;
  
      if (!apiKey) {
        console.warn("⚠️ No OpenWeatherMap API key found in config.json");
        return;
      }
  
      console.log("🔑 API key loaded:", apiKey);
      console.log("🗘️ Map style loaded?", map.isStyleLoaded());
  
      function addCloudLayer() {
        console.log("⛅️ Attempting to add cloud source and layer");
  
        if (map.getSource('clouds')) {
          console.warn("☁️ Cloud source already exists — skipping");
          return;
        }
  
        map.addSource("clouds", {
          type: "raster",
          tiles: [
            `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`
          ],
          tileSize: 256
        });
  
        map.addLayer({
          id: "clouds-layer",
          type: "raster",
          source: "clouds",
          paint: {
            "raster-opacity": 1
          }
        });
  
        console.log("✅ Cloud layer added");
      }
  
      if (map.isStyleLoaded()) {
        console.log("🟢 Style is already loaded — adding immediately");
        addCloudLayer();
      } else {
        console.log("🟡 Waiting for map load or styledata");
        map.once('styledata', () => {
          console.log("🟢 styledata event fired — adding cloud layer");
          addCloudLayer();
        });
        map.once('load', () => {
          console.log("🟢 load event fired — adding cloud layer");
          addCloudLayer();
        });
      }
    } catch (err) {
      console.error("🔥 Weather plugin failed:", err);
    }
  }
  