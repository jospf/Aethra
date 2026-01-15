import { useState, useEffect } from 'react';

export function useMoon() {
    const [moonData, setMoonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMoonData = async () => {
        try {
            const response = await fetch('/api/moon');
            if (!response.ok) {
                throw new Error('Failed to fetch moon data');
            }
            const data = await response.json();
            setMoonData(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMoonData();
        // Poll every 10 minutes
        const interval = setInterval(fetchMoonData, 600000);
        return () => clearInterval(interval);
    }, []);

    return { moonData, loading, error };
}
