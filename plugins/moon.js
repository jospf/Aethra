export default function initMoon(map) {
  const sourceId = 'moon-position';
  const trackSourceId = 'moon-track';
  const markerLayerId = 'moon-symbol';
  const lineLayerId = 'moon-track-line';

  const track = [];

  // Set up empty sources
  map.addSource(sourceId, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }
  });

  map.addSource(trackSourceId, {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
  });

  // Add placeholder icon initially (e.g., new moon)
  map.loadImage('./assets/moon_phases/moon-new-moon.png', (error, image) => {
    if (error) {
      console.error("Failed to load default moon icon:", error);
      return;
    }
    if (!map.hasImage('moon-default')) {
      map.addImage('moon-default', image);
    }

    // Add symbol layer
    map.addLayer({
      id: markerLayerId,
      type: 'symbol',
      source: sourceId,
      layout: {
        'icon-image': 'moon-default',
        'icon-size': 0.5,
        'icon-allow-overlap': true
      }
    });

    // Add trail layer
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

    // Now begin updates
    updateMoonPosition();
    setInterval(updateMoonPosition, 10000);
  });

  function updateMoonPosition() {
    fetch('http://localhost:5000/moon')
      .then(res => res.json())
      .then(data => {
        const { lat, lon, phase, illumination } = data;
        const coords = [lon, lat];

        const iconName = `moon-${phase.toLowerCase().replace(/\s+/g, '-')}`;
        const iconPath = `./assets/moon_phases/${iconName}.png`;

        // Load icon if not already present
        if (!map.hasImage(iconName)) {
          map.loadImage(iconPath, (err, image) => {
            if (err) {
              console.warn(`Moon icon '${iconPath}' failed to load.`, err);
              return;
            }
            map.addImage(iconName, image);
            map.setLayoutProperty(markerLayerId, 'icon-image', iconName);
          });
        } else {
          map.setLayoutProperty(markerLayerId, 'icon-image', iconName);
        }

        // Update moon icon location
        map.getSource(sourceId).setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coords },
            properties: {
              title: `${phase} (${illumination}%)`
            }
          }]
        });

        // Add to trail
        track.push(coords);
        if (track.length > 120) track.shift();
        map.getSource(trackSourceId).setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [...track] }
        });
      })
      .catch(err => console.error("🌙 Failed to fetch moon data:", err));
  }
}
