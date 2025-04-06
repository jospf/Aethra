const map = new maplibregl.Map({
  container: 'map',
  center: [0, 20],
  zoom: 1.2,
  style: 'https://demotiles.maplibre.org/style.json'
});

map.addControl(new maplibregl.NavigationControl(), 'top-right');

// Live clock (local + UTC)
function updateClock() {
  const now = new Date();
  const local = now.toLocaleTimeString(undefined, { hour12: false });
  const utc = now.toUTCString().split(' ')[4];
  document.getElementById('local-time').textContent = `Local: ${local}`;
  document.getElementById('utc-time').textContent = `UTC:   ${utc}`;
}
setInterval(updateClock, 1000);
updateClock();

// Add static night polygon after map loads
map.on('load', () => {
  const nightPolygon = {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [[
        [-180, -85],
        [-180, 85],
        [0, 85],
        [0, -85],
        [-180, -85]
      ]]
    }
  };

  map.addSource('night', {
    'type': 'geojson',
    'data': nightPolygon
  });

  map.addLayer({
    'id': 'night',
    'type': 'fill',
    'source': 'night',
    'paint': {
      'fill-color': '#000000',
      'fill-opacity': 0.4
    }
  });
});
