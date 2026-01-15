import React, { useState } from 'react'
import Map from './components/Map'
import { ClockWidget } from './components/widgets/ClockWidget'
import { useMoon } from './hooks/useMoon';
import { useISS } from './hooks/useISS';
import Sidebar from './components/ui/Sidebar';

function App() {
    const [mapStyle, setMapStyle] = useState('satellite');
    const [layers, setLayers] = useState({
        night: true,
        moon: true,
        iss: false
    });
    const [focusLocation, setFocusLocation] = useState(null);
    const { moonData } = useMoon();
    const issData = useISS();

    const toggleLayer = (layer) => {
        setLayers(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    const [clockSettings, setClockSettings] = useState({
        showStardate: true,
        activeTimezones: ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']
    });

    const toggleClockSetting = (setting) => {
        setClockSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const toggleTimezone = (tz) => {
        setClockSettings(prev => {
            const active = prev.activeTimezones;
            if (active.includes(tz)) {
                return { ...prev, activeTimezones: active.filter(t => t !== tz) };
            } else {
                return { ...prev, activeTimezones: [...active, tz] };
            }
        });
    };

    const handleLocate = (lat, lon) => {
        setFocusLocation({ lat, lon, timestamp: Date.now() });
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden selection:bg-cyan-500/30">
            {/* Map Background */}
            <div className="absolute inset-0 z-0">
                <Map
                    mapStyle={mapStyle}
                    layers={layers}
                    moonData={moonData}
                    issData={issData}
                    focusLocation={focusLocation}
                />
            </div>

            {/* Sidebar */}
            <Sidebar
                mapStyle={mapStyle}
                onStyleChange={setMapStyle}
                layers={layers}
                toggleLayer={toggleLayer}
                moonData={moonData}
                issData={issData}
                onLocate={handleLocate}
                clockSettings={clockSettings}
                toggleClockSetting={toggleClockSetting}
                toggleTimezone={toggleTimezone}
            />

            {/* Header Overlay */}
            <header className="absolute top-0 left-0 w-full z-10 p-6 flex justify-between items-start pointer-events-none">
                {/* Brand / Status */}
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 shadow-2xl">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-widest">
                            Aethra
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[10px] font-medium tracking-[0.2em] text-cyan-400/80 uppercase">
                            System Online
                        </span>
                    </div>
                </div>

                {/* Clock Widgets */}
                <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto">
                    <ClockWidget settings={clockSettings} />
                </div>
            </header>

            {/* Footer Overlay */}
            <footer className="absolute bottom-0 left-0 w-full z-10 p-4 flex justify-between items-end pointer-events-none">
                <div className="text-[10px] text-white/30 tracking-wider font-light">
                    © 2026 AETHRA COMMAND • GEOSPATIAL INTELLIGENCE
                </div>
            </footer>
        </div>
    );
}

export default App

