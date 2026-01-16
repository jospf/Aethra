import { useState, useEffect } from 'react';

export function useVolcanoes() {
    const [volcanoData, setVolcanoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchVolcanoData = async () => {
        try {
            const response = await fetch('/api/volcanoes');
            if (!response.ok) {
                throw new Error('Failed to fetch volcano data');
            }
            const data = await response.json();
            setVolcanoData(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching volcano data:', err);
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVolcanoData();

        // Refresh every 30 minutes (volcanoes don't change rapidly)
        const interval = setInterval(fetchVolcanoData, 30 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    return { volcanoData, loading, error };
}
