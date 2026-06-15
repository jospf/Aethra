import React, { useMemo } from 'react';
import { useSpaceWeather } from '../../hooks/useSpaceWeather';

export default function Ticker({ earthquakeData, volcanoData, moonData, issData }) {
    const spaceWeather = useSpaceWeather();
    const tickerItems = useMemo(() => {
        const items = [];

        // 1. Earthquakes (Magnitude >= 4.0 in the last 24 hours)
        if (earthquakeData && earthquakeData.features) {
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const significantQuakes = earthquakeData.features.filter(
                (q) => q.properties.mag >= 4.0 && q.properties.time >= twentyFourHoursAgo
            );

            significantQuakes.forEach((quake) => {
                items.push(
                    <span key={quake.id} className="text-orange-400 font-semibold mx-8">
                        ⚠️ M {quake.properties.mag.toFixed(1)} Earthquake - {quake.properties.place}
                    </span>
                );
            });
        }

        // 2. Volcanoes (High alert / Erupting)
        if (volcanoData && volcanoData.features) {
            const eruptingVolcanoes = volcanoData.features.filter(
                (v) => v.properties.alert_level === 'high'
            );

            eruptingVolcanoes.forEach((volcano) => {
                items.push(
                    <span key={volcano.properties.id || volcano.properties.name} className="text-red-500 font-semibold mx-8">
                        🌋 Volcano Erupting: {volcano.properties.name}, {volcano.properties.region}
                    </span>
                );
            });
        }

        // 3. Celestial Data
        if (moonData) {
            items.push(
                <span key="moon" className="text-gray-300 mx-8">
                    🌕 Moon Phase: {moonData.phase_name.replace(/-/g, ' ').toUpperCase()} ({Math.round(moonData.illumination * 100)}% Illumination)
                </span>
            );
        }

        if (issData && issData.latitude && issData.longitude) {
            items.push(
                <span key="iss" className="text-cyan-400 mx-8">
                    🛰️ ISS Position: {issData.latitude.toFixed(2)}°N, {issData.longitude.toFixed(2)}°E (Alt: {Math.round(issData.altitude)} km)
                </span>
            );
        }

        // 4. Space Weather Data
        if (spaceWeather && !spaceWeather.loading) {
            items.push(
                <span key="solar-wind" className="text-yellow-400 font-semibold mx-8">
                    ☀️ SOLAR WIND: {spaceWeather.solarWindSpeed} km/s
                </span>
            );
            items.push(
                <span key="kp-index" className={`font-semibold mx-8 ${spaceWeather.kpIndex >= 4.0 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                    🧲 GEOMAGNETIC SCALE: Kp-{spaceWeather.kpIndex.toFixed(2)} ({spaceWeather.geomagneticStormLevel})
                </span>
            );
            if (spaceWeather.solarFlare) {
                items.push(
                    <span key="solar-flare" className="text-orange-400 font-semibold mx-8">
                        💥 SOLAR FLARE: Class {spaceWeather.solarFlare}
                    </span>
                );
            }
        }

        // Add a general system status if no major events
        if (items.length <= 2) { // just moon and iss
           items.push(
               <span key="status" className="text-green-400 mx-8">
                   🟢 SYSTEM NOMINAL. NO MAJOR SEISMIC OR VOLCANIC EVENTS DETECTED IN THE LAST 24 HOURS.
               </span>
           );
        }

        // Duplicate the items a few times to ensure seamless infinite scrolling
        // even on very wide ultra-wide monitors when there are few events.
        const duplicatedItems = [];
        for (let i = 0; i < 4; i++) {
            duplicatedItems.push(
                <React.Fragment key={`copy-${i}`}>
                    {items}
                </React.Fragment>
            );
        }

        return duplicatedItems;
    }, [earthquakeData, volcanoData, moonData, issData, spaceWeather]);

    return (
        <div className="absolute bottom-0 left-0 w-full h-8 bg-slate-900/80 backdrop-blur-md border-t border-white/10 z-20 overflow-hidden flex items-center pointer-events-auto">
            <div className="flex animate-marquee whitespace-nowrap">
                {tickerItems}
            </div>
        </div>
    );
}
