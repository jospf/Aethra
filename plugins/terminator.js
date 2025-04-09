export default function initTerminator(map) {
    console.log("🌑 terminator plugin loaded");
  
    function createNightPolygon(centerLon) {
      const offset = 45; // degrees of darkness width
      let minLon = centerLon - offset;
      let maxLon = centerLon + offset;
  
      if (minLon < -180) minLon += 360;
      if (maxLon > 180) maxLon -= 360;
  
      if (minLon < maxLon) {
        return [[
          [minLon, -90], [minLon, 90],
          [maxLon, 90], [maxLon, -90],
          [minLon, -90]
        ]];
      } else {
        // Wraps around -180/+180
        return [[
          [minLon, -90], [minLon, 90],
          [180, 90], [180, -90],
          [minLon, -90]
        ], [
          [-180, -90], [-180, 90],
          [maxLon, 90], [maxLon, -90],
          [-180, -90]
        ]];
      }
    }
  
    function updateNightOverlay() {
        fetch('http://localhost:5000/terminator')
          .then(res => res.json())
          .then(data => {
            const curve = data.terminator;
      
            const polygon = [
              ...curve,
              [180, -90],
              [-180, -90],
              curve[0] // close the ring
            ];
      
            map.getSource('night').setData({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: [polygon]
                }
              }]
            });
          });
      }
      
  
    map.addSource('night', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  
    map.addLayer({
      id: 'night-layer',
      type: 'fill',
      source: 'night',
      paint: {
        'fill-color': '#000',
        'fill-opacity': 0.3
      }
    });
  
    updateNightOverlay();
    setInterval(updateNightOverlay, 60000);
  }
  