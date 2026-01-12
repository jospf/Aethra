import { useState, useEffect } from 'react';
import { createNightPolygon } from '../utils/terminator';

/**
 * Hook to calculate and update terminator position
 * Updates every minute
 */
export function useTerminator() {
    const [nightPolygon, setNightPolygon] = useState(null);

    useEffect(() => {
        const updateTerminator = () => {
            const polygon = createNightPolygon(new Date());
            setNightPolygon(polygon);
        };

        // Initial calculation
        updateTerminator();

        // Update every minute
        const interval = setInterval(updateTerminator, 60000);

        return () => clearInterval(interval);
    }, []);

    return nightPolygon;
}
