import { useState, useEffect } from 'react';

export function useEarthquakes() {
    const [earthquakeData, setEarthquakeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEarthquakes = async () => {
            try {
                // USGS Feed: M2.5+ Earthquakes, Past 7 Days
                const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson');
                if (!response.ok) throw new Error('Failed to fetch earthquake data');

                const data = await response.json();
                setEarthquakeData(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching earthquake data:", err);
                setError(err);
                setLoading(false);
            }
        };

        fetchEarthquakes();

        // Refresh every 5 minutes
        const interval = setInterval(fetchEarthquakes, 300000);
        return () => clearInterval(interval);
    }, []);

    return { earthquakeData, loading, error };
}
