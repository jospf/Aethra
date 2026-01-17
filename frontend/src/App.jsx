import React, { useState, useEffect } from 'react'
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
        iss: false,
        cityLights: false
    });
    const [showDateLine, setShowDateLine] = useState(true);
    const [weatherLayers, setWeatherLayers] = useState({
        precipitation: false,
        aurora: false,
        earthquakes: false,
        volcanoes: false,
        flights: false,
        ships: false,
        cables: false,
        gps: false,
        iridium: false,
        clouds: false,
        temperature: false
    });
    const [focusLocation, setFocusLocation] = useState(null);
    const [dayNightMode, setDayNightMode] = useState(false);
    const { moonData } = useMoon();
    const issData = useISS();

    // Auto-sync layers when Day/Night Mode is toggled
    useEffect(() => {
        if (dayNightMode) {
            // Enable required layers for day/night effect
            setLayers(prev => ({
                ...prev,
                night: true,
                cityLights: true
            }));
        }
    }, [dayNightMode]);

    const toggleLayer = (layer) => {
        setLayers(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    const toggleWeatherLayer = (layer) => {
        setWeatherLayers(prev => ({
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
                    showDateLine={showDateLine}
                    weatherLayers={weatherLayers}
                    moonData={moonData}
                    issData={issData}
                    focusLocation={focusLocation}
                    dayNightMode={dayNightMode}
                />
            </div>

            {/* Sidebar */}
            <Sidebar
                mapStyle={mapStyle}
                onStyleChange={setMapStyle}
                layers={layers}
                toggleLayer={toggleLayer}
                showDateLine={showDateLine}
                toggleDateLine={() => setShowDateLine(!showDateLine)}
                weatherLayers={weatherLayers}
                toggleWeatherLayer={toggleWeatherLayer}
                moonData={moonData}
                issData={issData}
                onLocate={handleLocate}
                clockSettings={clockSettings}
                toggleClockSetting={toggleClockSetting}
                toggleTimezone={toggleTimezone}
                dayNightMode={dayNightMode}
                toggleDayNightMode={() => setDayNightMode(!dayNightMode)}
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

                    {/* Volcano Legend - Only show when volcanoes are active */}
                    {weatherLayers.volcanoes && (
                        <div className="mt-2 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-2xl">
                            <div className="text-[9px] font-semibold tracking-widest text-cyan-400/60 uppercase mb-1.5">
                                Volcanic Activity
                            </div>
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24">
                                        <path d="M12 2 L22 22 L2 22 Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="2" />
                                    </svg>
                                    <span className="text-[10px] text-gray-300">Erupting (High)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24">
                                        <path d="M12 2 L22 22 L2 22 Z" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
                                    </svg>
                                    <span className="text-[10px] text-gray-300">Active (Medium)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg width="12" height="12" viewBox="0 0 24 24">
                                        <path d="M12 2 L22 22 L2 22 Z" fill="#9ca3af" stroke="#6b7280" strokeWidth="2" />
                                    </svg>
                                    <span className="text-[10px] text-gray-300">Monitored (Low)</span>
                                </div>
                            </div>
                        </div>
                    )}
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

