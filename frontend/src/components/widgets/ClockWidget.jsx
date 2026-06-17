import React, { useState, useEffect } from 'react';
import { calculateStardate } from '../../utils/stardate';

const TimezoneClock = ({ tz, label, tvMode }) => {
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
        <div className={`flex flex-col items-center justify-center p-2 transition-all ${tvMode ? 'min-w-[140px] p-3' : 'min-w-[100px]'}`}>
            <div className="flex items-baseline space-x-1">
                <span className={`font-mono font-bold tracking-wider ${tvMode ? 'text-3xl' : 'text-xl'}`}>{displayHour}:{minutes}</span>
                <span className={`font-bold text-gray-400 ${tvMode ? 'text-xs pl-0.5' : 'text-[10px]'}`}>{ampm}</span>
            </div>
            <div className={`uppercase tracking-[0.2em] text-blue-400 font-bold mt-1 ${tvMode ? 'text-xs' : 'text-[10px]'}`}>{label}</div>
        </div>
    );
};

import { AVAILABLE_TIMEZONES } from '../../utils/timezones';

export const ClockWidget = ({ settings, tvMode }) => {
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
                    <div className={`bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl transition-all ${tvMode ? 'px-8 py-3' : 'px-6 py-2'}`}>
                        <span className={`font-mono tracking-[0.3em] text-purple-400 uppercase ${tvMode ? 'text-base' : 'text-sm'}`}>
                            Stardate <span className="text-white">{stardate}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Clock Rows */}
            {visibleTimezones.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 w-full max-w-4xl mx-auto">
                    {visibleTimezones.map((tz) => (
                        <div key={tz.tz} className={`bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-xl hover:bg-gray-900/60 transition-all duration-300 ${tvMode ? 'p-3' : 'p-2'}`}>
                            <TimezoneClock tz={tz.tz} label={tz.label} tvMode={tvMode} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
