export default function initISS(map) {
  const sourceId = 'iss-position';
  const trackSourceId = 'iss-track';
  const iconId = 'iss-icon';
  const markerLayerId = 'iss-symbol';
  const lineLayerId = 'iss-track-line';

  const track = [];

  map.loadImage('./assets/iss.png', (error, image) => {
    if (error) {
      console.error("Failed to load ISS icon:", error);
      return;
    }

    if (!map.hasImage(iconId)) {
      map.addImage(iconId, image);
    }

    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });

    map.addSource(trackSourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
    });

    map.addLayer({
      id: markerLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': iconId,
        'icon-size': 0.90,
        'icon-allow-overlap': true
      }
    });

    map.addLayer({
      id: lineLayerId,
      type: 'line',
      source: trackSourceId,
      paint: {
        'line-color': '#00ffff',
        'line-width': 2
      }
    });

    async function updateISSPosition() {
      try {
        const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
        const data = await res.json();

        const coords = [data.longitude, data.latitude];
        console.log(`[ISS] Lat: ${coords[1].toFixed(2)}, Lon: ${coords[0].toFixed(2)}`);

        // Update ISS icon position
        map.getSource(sourceId).setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {}
          }]
        });

        // Update track history
        track.push(coords);
        if (track.length > 360) track.shift();

        map.getSource(trackSourceId).setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [...track] }
        });

      } catch (err) {
        console.error('[ISS Plugin] Error fetching ISS location:', err);
      }
    }

    updateISSPosition();
    setInterval(updateISSPosition, 30000);
  });
}
