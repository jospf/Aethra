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

export const ClockWidget = () => {
    const [stardate, setStardate] = useState(calculateStardate());

    useEffect(() => {
        const timer = setInterval(() => setStardate(calculateStardate()), 10000);
        return () => clearInterval(timer);
    }, []);

    const timezones = [
        { tz: 'UTC', label: 'UTC' },
        { tz: 'America/New_York', label: 'NYC' },
        { tz: 'America/Los_Angeles', label: 'LAX' },
        { tz: 'Europe/London', label: 'LON' },
        { tz: 'Asia/Tokyo', label: 'TYO' },
        { tz: 'Australia/Sydney', label: 'SYD' }
    ];

    return (
        <div className="flex flex-col space-y-4 w-full">
            {/* Top Banner (Stardate) */}
            <div className="flex justify-center">
                <div className="bg-gray-900/60 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full shadow-2xl">
                    <span className="text-sm font-mono tracking-[0.3em] text-purple-400 uppercase">
                        Stardate <span className="text-white">{stardate}</span>
                    </span>
                </div>
            </div>

            {/* Clock Rows */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 w-full max-w-4xl mx-auto">
                {timezones.map((tz) => (
                    <div key={tz.tz} className="bg-gray-900/40 backdrop-blur-md border border-white/5 rounded-xl p-2 hover:bg-gray-900/60 transition-all duration-300">
                        <TimezoneClock tz={tz.tz} label={tz.label} />
                    </div>
                ))}
            </div>
        </div>
    );
};
