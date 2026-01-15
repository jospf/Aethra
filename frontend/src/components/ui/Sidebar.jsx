import React, { useState } from 'react';

export default function Sidebar({ layers, toggleLayer, moonData, issData, onLocate }) {
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
            <div className="h-full bg-slate-900/90 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col gap-6 overflow-hidden">
                <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                        Layer Control
                    </h2>

                    <div className="space-y-6">
                        {/* Satellite Toggle */}
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300 font-medium tracking-wide">Satellite</span>
                            <button
                                onClick={() => toggleLayer('satellite')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${layers.satellite ? 'bg-cyan-500' : 'bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${layers.satellite ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

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

                    <div className="mt-12 pt-6 border-t border-white/10">
                        <p className="text-xs text-center text-gray-500">
                            AETHRA SYSTEMS v2.1
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
