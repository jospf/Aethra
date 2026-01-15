import { useState, useEffect } from 'react';

export function useWeather() {
    const [weatherData, setWeatherData] = useState({
        radarPath: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchWeatherConfig = async () => {
            try {
                // Fetch available maps from RainViewer
                const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
                if (!response.ok) throw new Error('Failed to fetch weather config');

                const data = await await response.json();

                // data.radar.past is array of { time: unix_timestamp, path: string }
                // We want the latest available frame from the past (most recent observation)
                const latestRadar = data.radar.past && data.radar.past.length > 0
                    ? data.radar.past[data.radar.past.length - 1].path
                    : null;

                setWeatherData({
                    radarPath: latestRadar,
                    loading: false,
                    error: null
                });
            } catch (err) {
                console.error("Error fetching weather data:", err);
                setWeatherData({
                    radarPath: null,
                    loading: false,
                    error: err
                });
            }
        };

        fetchWeatherConfig();

        // Refresh every 10 minutes
        const interval = setInterval(fetchWeatherConfig, 600000);
        return () => clearInterval(interval);
    }, []);

    return weatherData;
}
