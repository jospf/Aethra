export default function initEarth(map) {
    console.log("🌍 Earth base layer plugin loaded");
  
    map.addSource("earth-tiles", {
      type: "raster",
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256
    });
  
    map.addLayer({
        id: "earth-base",
        type: "raster",
        source: "earth-tiles",
        paint: {
          "raster-opacity": 1.0
        }
      });
    }      