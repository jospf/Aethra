import React from 'react';

const ISSWidget = ({ data, loading, error }) => {
    if (loading && !data) return null;
    if (error) return null;
    if (!data) return null;

    const { latitude, longitude, altitude, velocity } = data;

    return (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white font-mono text-xs w-48 shadow-2xl">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                <span className="text-blue-400 animate-pulse">●</span>
                <span className="font-bold tracking-widest uppercase text-[10px]">ISS Telemetry</span>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <span className="text-white/50 uppercase text-[9px]">Lat</span>
                    <span>{latitude.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/50 uppercase text-[9px]">Lng</span>
                    <span>{longitude.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/50 uppercase text-[9px]">Alt</span>
                    <span>{altitude.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-white/50 uppercase text-[9px]">V-Ground</span>
                    <span>{Math.round(velocity).toLocaleString()} km/h</span>
                </div>
            </div>
        </div>
    );
};

export default ISSWidget;
