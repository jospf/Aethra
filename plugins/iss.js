export default function initISS(map) {
  console.log("🛰️ ISS plugin loaded");

  const issSourceId = 'iss';
  const issLayerId = 'iss-icon';
  const trackSourceId = 'iss-track';
  const trackLayerId = 'iss-track-line';

  const iconUrl = './assets/iss.png';
  const iconSize = 1.0;
  const updateInterval = 30 * 1000; // 30 seconds
  const maxPoints = 2700 / 30; // 2 ISS orbits (~90 min/orbit)

  let track = [];

  // Split ISS path when crossing ±180° longitude
  function splitTrackForWraparound(points) {
    const segments = [];
    let current = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1][0];
      const curr = points[i][0];
      const diff = Math.abs(curr - prev);

      if (diff > 180) {
        segments.push(current);
        current = [];
      }
      current.push(points[i]);
    }

    if (current.length) segments.push(current);
    return segments;
  }

  function updateISSPosition() {
    fetch("http://localhost:5000/iss")
      .then(res => res.json())
      .then(data => {
        const coord = [data.lon, data.lat];
        console.log("📡 ISS position:", coord);

        // Update icon
        map.getSource(issSourceId).setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coord },
            properties: {}
          }]
        });

        // Update track
        track.push(coord);
        if (track.length > maxPoints) track.shift();

        const segments = splitTrackForWraparound(track);

        const multilines = segments.map(segment => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: segment
          }
        }));

        map.getSource(trackSourceId).setData({
          type: 'FeatureCollection',
          features: multilines
        });
      })
      .catch(err => {
        console.error("❌ Failed to fetch ISS:", err);
      });
  }

  function loadIconAndInit() {
    if (!map.isStyleLoaded()) {
      map.once('styledata', loadIconAndInit);
      return;
    }

    map.loadImage(iconUrl, (err, image) => {
      if (err || !image) return console.error("❌ Couldn't load ISS icon", err);
      if (!map.hasImage('iss-icon')) {
        map.addImage('iss-icon', image);
        console.log("✅ ISS icon added");
      }

      map.addSource(issSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addSource(trackSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      map.addLayer({
        id: issLayerId,
        type: 'symbol',
        source: issSourceId,
        layout: {
          'icon-image': 'iss-icon',
          'icon-size': iconSize,
          'icon-allow-overlap': true
        }
      });

      map.addLayer({
        id: trackLayerId,
        type: 'line',
        source: trackSourceId,
        paint: {
          'line-color': '#00ffff',
          'line-width': 2,
          'line-opacity': 0.7
        }
      });

      updateISSPosition();
      setInterval(updateISSPosition, updateInterval);
    });
  }

  loadIconAndInit();
}
