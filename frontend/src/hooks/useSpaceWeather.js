import { useState, useEffect } from 'react';

/**
 * Hook to fetch planetary Space Weather telemetry from NOAA SWPC
 * Falls back to dynamic simulated values if NOAA endpoints are unreachable.
 */
export function useSpaceWeather() {
    const [spaceWeather, setSpaceWeather] = useState({
        kpIndex: 2.33,
        solarWindSpeed: 420.5,
        solarFlare: 'C2.4',
        geomagneticStormLevel: 'Nominal',
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchSpaceWeather = async () => {
            try {
                // Fetch K-Index
                const response = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');
                if (!response.ok) throw new Error('Failed to fetch space weather');
                const data = await response.json();
                
                // Get the last valid Kp index
                const validEntries = data.filter(entry => entry.kp_index !== undefined && entry.kp_index !== null);
                const latestEntry = validEntries[validEntries.length - 1];
                const kpIndex = latestEntry ? parseFloat(latestEntry.kp_index) : 2.33;

                // Determine Storm Level based on NOAA scales:
                // Kp < 5: Nominal
                // Kp = 5: G1 Minor
                // Kp = 6: G2 Moderate
                // Kp = 7: G3 Strong
                // Kp = 8: G4 Severe
                // Kp = 9: G5 Extreme
                let stormLevel = 'Nominal';
                if (kpIndex >= 9) stormLevel = 'G5 Extreme';
                else if (kpIndex >= 8) stormLevel = 'G4 Severe';
                else if (kpIndex >= 7) stormLevel = 'G3 Strong';
                else if (kpIndex >= 6) stormLevel = 'G2 Moderate';
                else if (kpIndex >= 5) stormLevel = 'G1 Minor';

                // Generate simulated but realistic solar wind speed and solar flare class based on Kp index
                // High Kp index correlates with higher solar wind speeds and active flares!
                const baseWindSpeed = kpIndex * 80 + 250; // Kp = 2 -> ~410 km/s, Kp = 7 -> ~810 km/s
                const solarWindSpeed = parseFloat((baseWindSpeed + Math.sin(Date.now() / 60000) * 15).toFixed(1));

                let solarFlare = 'C1.2';
                if (kpIndex >= 8) solarFlare = 'X2.4';
                else if (kpIndex >= 6) solarFlare = 'M4.8';
                else if (kpIndex >= 4) solarFlare = 'C8.5';
                else solarFlare = `C${(kpIndex * 1.5 + 0.8).toFixed(1)}`;

                setSpaceWeather({
                    kpIndex,
                    solarWindSpeed,
                    solarFlare,
                    geomagneticStormLevel: stormLevel,
                    loading: false,
                    error: null
                });
            } catch (err) {
                console.warn("Error fetching live space weather, using nominal simulation fallback:", err);
                
                // Stable fallback simulation that varies slowly over time
                const timeSec = Date.now() / 100000;
                const kpIndex = parseFloat((2.5 + Math.sin(timeSec) * 1.2 + Math.cos(timeSec / 2) * 0.5).toFixed(2));
                
                let stormLevel = 'Nominal';
                if (kpIndex >= 9) stormLevel = 'G5 Extreme';
                else if (kpIndex >= 8) stormLevel = 'G4 Severe';
                else if (kpIndex >= 7) stormLevel = 'G3 Strong';
                else if (kpIndex >= 6) stormLevel = 'G2 Moderate';
                else if (kpIndex >= 5) stormLevel = 'G1 Minor';

                const solarWindSpeed = parseFloat((kpIndex * 85 + 280 + Math.sin(timeSec) * 20).toFixed(1));
                const solarFlare = kpIndex >= 5.0 ? `M${(kpIndex - 4).toFixed(1)}` : `C${(kpIndex * 1.8 + 0.5).toFixed(1)}`;

                setSpaceWeather({
                    kpIndex,
                    solarWindSpeed,
                    solarFlare,
                    geomagneticStormLevel: stormLevel,
                    loading: false,
                    error: err.message
                });
            }
        };

        fetchSpaceWeather();

        // Update space weather every 10 minutes
        const interval = setInterval(fetchSpaceWeather, 600000);
        return () => clearInterval(interval);
    }, []);

    return spaceWeather;
}
