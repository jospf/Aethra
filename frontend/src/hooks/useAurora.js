import { useState, useEffect } from 'react';

export function useAurora() {
    const [auroraData, setAuroraData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAuroraData = async () => {
            try {
                const response = await fetch('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json');
                if (!response.ok) throw new Error('Failed to fetch aurora data');

                const data = await response.json();

                // data.coordinates is array of [lon, lat, intensity]
                // Filter for meaningful intensity to reduce point count (e.g. > 0)
                const features = data.coordinates
                    .filter(point => point[2] > 0)
                    .map(point => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [point[0], point[1]]
                        },
                        properties: {
                            intensity: point[2]
                        }
                    }));

                const geoJson = {
                    type: 'FeatureCollection',
                    features: features
                };

                setAuroraData(geoJson);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching aurora data:", err);
                setError(err);
                setLoading(false);
            }
        };

        fetchAuroraData();

        // Refresh every 15 minutes
        const interval = setInterval(fetchAuroraData, 900000);
        return () => clearInterval(interval);
    }, []);

    return { auroraData, loading, error };
}
