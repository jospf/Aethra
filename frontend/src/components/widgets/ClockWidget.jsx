import React, { useState, useEffect } from 'react';
import { calculateStardate } from '../../utils/stardate';

const TimezoneClock = ({ tz, label }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const d = new Date(time.toLocaleString('en-US', { timeZone: tz }));
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    const displayHour = (hours % 12 || 12).toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    return (
        <div className="flex flex-col items-center justify-center p-2 min-w-[100px]">
            <div className="flex items-baseline space-x-1">
                <span className="text-xl font-mono font-bold tracking-wider">{displayHour}:{minutes}</span>
                <span className="text-[10px] font-bold text-gray-400">{ampm}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold mt-1">{label}</div>
        </div>
    );
};

import { AVAILABLE_TIMEZONES } from '../../utils/timezones';

// ... (TimezoneClock component remains the same)

export const ClockWidget = ({ settings }) => {
    const [stardate, setStardate] = useState(calculateStardate());

    useEffect(() => {
        const timer = setInterval(() => setStardate(calculateStardate()), 10000);
        return () => clearInterval(timer);
    }, []);

    // Default to showing everything if settings aren't provided yet
    const showStardate = settings?.showStardate ?? true;
    const activeTimezones = settings?.activeTimezones ?? AVAILABLE_TIMEZONES.map(t => t.tz);

    const visibleTimezones = AVAILABLE_TIMEZONES.filter(tz => activeTimezones.includes(tz.tz));

    if (!showStardate && visibleTimezones.length === 0) return null;

    return (
        <div className="flex flex-col space-y-4 w-full">
            {/* Top Banner (Stardate) */}
            {showStardate && (
                <div className="flex justify-center">
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full shadow-2xl">
                        <span className="text-sm font-mono tracking-[0.3em] text-purple-400 uppercase">
                            Stardate <span className="text-white">{stardate}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Clock Rows */}
            {visibleTimezones.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 w-full max-w-4xl mx-auto">
                    {visibleTimezones.map((tz) => (
                        <div key={tz.tz} className="bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-xl p-2 hover:bg-gray-900/60 transition-all duration-300">
                            <TimezoneClock tz={tz.tz} label={tz.label} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
