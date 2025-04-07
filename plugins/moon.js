import SunCalc from 'https://cdn.jsdelivr.net/npm/suncalc/+esm';

export default function initMoon(map) {
  const sourceId = 'moon-position';
  const trackSourceId = 'moon-track';
  const markerLayerId = 'moon-symbol';
  const lineLayerId = 'moon-track-line';

  const track = [];

  map.loadImage('./assets/moon.png', (error, image) => {
    if (error) {
      console.error("Failed to load Moon icon:", error);
      return;
    }

    if (!map.hasImage('moon-icon')) {
      map.addImage('moon-icon', image);
    }

    // Set up sources
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addSource(trackSourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
    });

    // Icon for the moon
    map.addLayer({
      id: markerLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': 'moon-icon',
        'icon-size': 0.50,
        'icon-allow-overlap': true
      }
    });

    // Moon trail
    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: trackSourceId,
      paint: {
        'line-color': '#cccccc',
        'line-width': 2,
        'line-opacity': 0.7
      }
    });

    function updateMoonPosition() {
      const now = new Date();

      // Lat/lon subpoint of moon
      const moonPos = SunCalc.getMoonPosition(now, 0, 0);
      const subLat = moonPos.altitude * (180 / Math.PI); // approximate
      const subLon = (now.getUTCHours() * 15 + moonPos.azimuth * 180 / Math.PI + 180) % 360 - 180;

      const coords = [subLon, subLat];

      // Icon
      map.getSource(sourceId).setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coords },
          properties: {}
        }]
      });

      // Track
      track.push(coords);
      if (track.length > 120) track.shift();

      map.getSource(trackSourceId).setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: [...track] }
      });
    }

    updateMoonPosition();
    setInterval(updateMoonPosition, 5000);
  });
}
