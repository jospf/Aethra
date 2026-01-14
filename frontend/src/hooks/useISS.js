import { useState, useEffect } from 'react';

export function useISS(pollingInterval = 5000) {
    const [issData, setIssData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchISS = async () => {
        try {
            const response = await fetch('/api/iss');
            if (!response.ok) {
                throw new Error('Failed to fetch ISS data');
            }
            const data = await response.json();
            setIssData(data);
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching ISS data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchISS();
        const interval = setInterval(fetchISS, pollingInterval);
        return () => clearInterval(interval);
    }, [pollingInterval]);

    return { issData, loading, error };
}
