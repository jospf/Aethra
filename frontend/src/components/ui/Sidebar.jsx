import React, { useState } from 'react';
import { AVAILABLE_TIMEZONES } from '../../utils/timezones';

export default function Sidebar({ mapStyle, onStyleChange, layers, toggleLayer, showDateLine, toggleDateLine, weatherLayers, toggleWeatherLayer, moonData, issData, onLocate, clockSettings, toggleClockSetting, toggleTimezone, dayNightMode, toggleDayNightMode }) {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`fixed top-0 right-0 h-full z-20 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-12'} pointer-events-auto`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-6 left-0 -translate-x-full bg-slate-900/80 backdrop-blur-md p-2 rounded-l-lg border-y border-l border-white/10 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
            </button>

            {/* Sidebar Content */}
            <div className="h-full bg-slate-900/90 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-6 overflow-hidden overflow-y-auto">
                <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>

                    {/* Map Style Selector */}
                    <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
                        Map Style
                    </h2>
                    <div className="grid grid-cols-4 gap-2 mb-8">
                        {[
                            { id: 'satellite', label: 'SAT' },
                            { id: 'dark', label: 'DARK' },
                            { id: 'light', label: 'LIGHT' },
                            { id: 'grey', label: 'GREY' }
                        ].map((style) => (
                            <button
                                key={style.id}
                                onClick={() => onStyleChange(style.id)}
                                className={`px-2 py-2 rounded-md text-[10px] font-medium uppercase tracking-wider border transition-all
                                    ${mapStyle === style.id
                                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                                        : 'bg-transparent border-white/10 text-gray-500 hover:border-white/30 hover:text-gray-300'
                                    }`}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>

                    <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                        Layer Control
                    </h2>

                    <div className="space-y-6">
                        {/* Terminator Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Day/Night</span>
                            <button
                                onClick={() => toggleLayer('night')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${layers.night ? 'bg-cyan-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layers.night ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* City Lights Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">City Lights</span>
                            <button
                                onClick={() => toggleLayer('cityLights')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${layers.cityLights ? 'bg-cyan-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layers.cityLights ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Day/Night Mode Toggle */}
                        <div className="flex flex-col gap-2 mt-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-cyan-300 font-semibold tracking-wide">Day/Night Mode</span>
                                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                                        Auto Differential Maps
                                    </span>
                                </div>
                                <button
                                    onClick={toggleDayNightMode}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${dayNightMode ? 'bg-gradient-to-r from-yellow-400 to-indigo-600' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${dayNightMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {dayNightMode && (
                                <p className="text-[9px] text-cyan-400/80 leading-relaxed">
                                    Satellite in day • City lights in night
                                </p>
                            )}
                        </div>

                        {/* Moon Toggle */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-gray-300 font-medium tracking-wide">Moon Phase</span>
                                    {moonData && (
                                        <span className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
                                            {moonData.phase_name.replace('moon-', '').replace('-', ' ')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleLayer('moon')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${layers.moon ? 'bg-cyan-500' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layers.moon ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Locate Button */}
                            {layers.moon && moonData && (
                                <button
                                    onClick={() => onLocate && onLocate(moonData.latitude, moonData.longitude)}
                                    className="text-xs flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors pl-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    LOCATE ON MAP
                                </button>
                            )}
                        </div>

                        {/* ISS Toggle */}
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-gray-300 font-medium tracking-wide">ISS Tracker</span>
                                    {layers.iss && (
                                        <span className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider">
                                            LIVE ORBIT
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => toggleLayer('iss')}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${layers.iss ? 'bg-cyan-500' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layers.iss ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            {/* Locate Button ISS */}
                            {layers.iss && issData && (
                                <button
                                    onClick={() => onLocate && onLocate(issData.latitude, issData.longitude)}
                                    className="text-xs flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors pl-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    LOCATE STATION
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-green-500 bg-clip-text text-transparent mb-6">
                            Weather
                        </h2>

                        {/* Precipitation Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Precipitation</span>
                            <button
                                onClick={() => toggleWeatherLayer('precipitation')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.precipitation ? 'bg-teal-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.precipitation ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6">
                        Space Weather
                    </h2>

                    <div className="space-y-6">
                        {/* Aurora Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Aurora Forecast</span>
                            <button
                                onClick={() => toggleWeatherLayer('aurora')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.aurora ? 'bg-indigo-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.aurora ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-6">
                        Geological Events
                    </h2>

                    <div className="space-y-6">
                        {/* Earthquakes Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Earthquakes (M2.5+)</span>
                            <button
                                onClick={() => toggleWeatherLayer('earthquakes')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.earthquakes ? 'bg-orange-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.earthquakes ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Volcanoes Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Active Volcanoes</span>
                            <button
                                onClick={() => toggleWeatherLayer('volcanoes')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.volcanoes ? 'bg-red-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.volcanoes ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-6">
                        Global Traffic
                    </h2>

                    <div className="space-y-6">
                        {/* Flights Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Flight Traffic</span>
                            <button
                                onClick={() => toggleWeatherLayer('flights')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.flights ? 'bg-sky-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.flights ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Maritime Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Maritime Traffic</span>
                            <button
                                onClick={() => toggleWeatherLayer('ships')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.ships ? 'bg-cyan-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.ships ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-6">
                        Infrastructure
                    </h2>

                    <div className="space-y-6">
                        {/* Submarine Cables Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Submarine Cables</span>
                            <button
                                onClick={() => toggleWeatherLayer('cables')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.cables ? 'bg-emerald-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.cables ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-6">
                        Geographical Features
                    </h2>

                    <div className="space-y-6">
                        {/* IDL Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">International Date Line</span>
                            <button
                                onClick={toggleDateLine}
                                className={`w-12 h-6 rounded-full transition-colors relative ${showDateLine ? 'bg-indigo-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showDateLine ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-fuchsia-400 to-rose-500 bg-clip-text text-transparent mb-6">
                        Satellites
                    </h2>

                    <div className="space-y-6">
                        {/* GPS Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">GPS (MEO)</span>
                            <button
                                onClick={() => toggleWeatherLayer('gps')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.gps ? 'bg-amber-400' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.gps ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Iridium Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Iridium (LEO)</span>
                            <button
                                onClick={() => toggleWeatherLayer('iridium')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${weatherLayers.iridium ? 'bg-pink-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${weatherLayers.iridium ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-6">
                        Clock Control
                    </h2>

                    <div className="space-y-6">
                        {/* Stardate Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Show Stardate</span>
                            <button
                                onClick={() => toggleClockSetting('showStardate')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${clockSettings?.showStardate ? 'bg-purple-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${clockSettings?.showStardate ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Timezones List */}
                        <div className="space-y-3">
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Active Timezones</span>
                            {AVAILABLE_TIMEZONES.map((tz) => {
                                const isActive = clockSettings?.activeTimezones.includes(tz.tz);
                                return (
                                    <div key={tz.tz} className="flex items-center justify-between">
                                        <span className="text-gray-400 text-sm font-mono">{tz.label}</span>
                                        <button
                                            onClick={() => toggleTimezone(tz.tz)}
                                            className={`w-8 h-4 rounded-full transition-colors relative ${isActive ? 'bg-purple-500/50' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-6 border-t border-white/10">
                    <p className="text-xs text-center text-gray-500">
                        AETHRA SYSTEMS v2.1
                    </p>
                </div>
            </div>
        </div>
    );
}
