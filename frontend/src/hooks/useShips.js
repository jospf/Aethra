import { useState, useEffect } from 'react';

/**
 * Hook to fetch real-time maritime traffic data
 * Updates every 10 seconds (local cache serve)
 * Data is populated in backend via live WebSocket from AisStream.io
 */
export function useShips() {
    const [shipData, setShipData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchShips = async () => {
        try {
            const response = await fetch('/api/ships');
            if (!response.ok) {
                throw new Error('Failed to fetch ship data');
            }
            const data = await response.json();
            setShipData(data);
            setLoading(false);
        } catch (err) {
            console.error('Ship data error:', err);
            setError(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShips();
        // Poll every 10 seconds
        const interval = setInterval(fetchShips, 10000);
        return () => clearInterval(interval);
    }, []);

    return { shipData, loading, error };
}
