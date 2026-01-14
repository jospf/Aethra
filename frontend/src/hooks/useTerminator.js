import { useState, useEffect } from 'react';
import { createNightPolygon } from '../utils/terminator';

/**
 * Hook to calculate and update terminator position
 * Updates every minute
 */
export function useTerminator() {
    // Calculate initial terminator immediately using lazy initialization
    const [nightPolygon, setNightPolygon] = useState(() => createNightPolygon(new Date()));

    useEffect(() => {
        const updateTerminator = () => {
            const polygon = createNightPolygon(new Date());
            setNightPolygon(polygon);
        };

        // Update every minute
        const interval = setInterval(updateTerminator, 60000);

        return () => clearInterval(interval);
    }, []);

    return nightPolygon;
}
