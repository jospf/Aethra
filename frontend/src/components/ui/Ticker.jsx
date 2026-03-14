import React, { useMemo } from 'react';

export default function Ticker({ earthquakeData, volcanoData, moonData, issData }) {
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
    }, [earthquakeData, volcanoData, moonData, issData]);

    return (
        <div className="absolute bottom-0 left-0 w-full h-8 bg-slate-900/80 backdrop-blur-md border-t border-white/10 z-20 overflow-hidden flex items-center pointer-events-auto">
            <div className="flex animate-marquee whitespace-nowrap">
                {tickerItems}
            </div>
        </div>
    );
}
