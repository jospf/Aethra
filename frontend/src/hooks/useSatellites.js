import { useState, useEffect } from 'react';

/**
 * Hook to fetch satellite constellation data
 * @param {string} group - 'gps', 'iridium', 'starlink'
 * @param {number} intervalMs - Poll interval in ms (default 10s)
 */
export function useSatellites(group, intervalMs = 10000) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Auto-refresh logic handled here or by parent?
    // Let's do auto-refresh here.

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!group) return;
            try {
                const response = await fetch(`/api/satellites/${group}`);
                if (!response.ok) throw new Error('Failed to fetch');
                const json = await response.json();
                if (isMounted) {
                    setData(json);
                    setLoading(false);
                }
            } catch (err) {
                console.error(`Error fetching satellites (${group}):`, err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, intervalMs);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [group, intervalMs]);

    return { data, loading };
}
