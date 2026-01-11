export default function initStarlink(map) {
    console.log("🛰️ Starlink plugin loaded");

    // Add a GeoJSON source for Starlink satellites
    map.addSource('starlink', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    // Add a layer to display the satellites as points
    map.addLayer({
        id: 'starlink-layer',
        type: 'circle',
        source: 'starlink',
        paint: {
            'circle-radius': 5,
            'circle-color': '#00f'
        }
    });

    // Function to update satellite positions
    function updateStarlinkPositions() {
        fetch('http://localhost:5000/starlink') // Replace with the actual API endpoint
            .then(res => res.json())
            .then(data => {
                if (!data.satellites || !Array.isArray(data.satellites)) {
                    throw new Error('Invalid API response: satellites data is missing or not an array');
                }

                const features = data.satellites.map(sat => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [sat.longitude, sat.latitude]
                    },
                    properties: {
                        name: sat.name
                    }
                }));

                map.getSource('starlink').setData({
                    type: 'FeatureCollection',
                    features: features
                });
            })
            .catch(err => console.error('Failed to fetch Starlink data:', err));
    }

    // Initial update and periodic refresh every minute
    updateStarlinkPositions();
    setInterval(updateStarlinkPositions, 60000);
}