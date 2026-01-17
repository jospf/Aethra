import { useState, useEffect } from 'react';
import { createNightPolygon, createDayPolygon } from '../utils/terminator';

/**
 * Hook to calculate and update terminator position
 * Updates every minute
 * Returns both night and day polygons
 */
export function useTerminator() {
    // Calculate initial polygons immediately using lazy initialization
    const [nightPolygon, setNightPolygon] = useState(() => createNightPolygon(new Date()));
    const [dayPolygon, setDayPolygon] = useState(() => createDayPolygon(new Date()));

    useEffect(() => {
        const updateTerminator = () => {
            const now = new Date();
            setNightPolygon(createNightPolygon(now));
            setDayPolygon(createDayPolygon(now));
        };

        // Update every minute
        const interval = setInterval(updateTerminator, 60000);

        return () => clearInterval(interval);
    }, []);

    return { nightPolygon, dayPolygon };
}
