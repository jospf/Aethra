import { useState, useEffect } from 'react';

/**
 * Hook to fetch real-time flight data from OpenSky Network
 * Updates every 30 seconds (OpenSky rate limit friendly)
 */
export function useFlights() {
    const [flightData, setFlightData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFlights = async () => {
        try {
            const response = await fetch('/api/flights');
            if (!response.ok) {
                throw new Error('Failed to fetch flight data');
            }
            const data = await response.json();
            setFlightData(data);
            setLoading(false);
        } catch (err) {
            console.error('Flight data error:', err);
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlights();
        // Poll every 30 seconds (OpenSky rate limit friendly)
        const interval = setInterval(fetchFlights, 30000);
        return () => clearInterval(interval);
    }, []);

    return { flightData, loading, error };
}
