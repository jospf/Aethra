import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTerminator } from '../hooks/useTerminator';
import { useWeather } from '../hooks/useWeather';
import { useAurora } from '../hooks/useAurora';
import { useEarthquakes } from '../hooks/useEarthquakes';
import { useVolcanoes } from '../hooks/useVolcanoes';
import dateLineGeoJson from '../data/dateLine.json';

export default function Map({
    mapStyle = 'satellite',
    layers = { night: true, moon: true, iss: true },
    showDateLine = true,
    weatherLayers = { precipitation: false, clouds: false, temperature: false },
    moonData,
    issData,
    focusLocation,
    dayNightMode = false
}) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = useState(0);
    const [lat] = useState(0);
    const [zoom] = useState(1.5); // Start zoomed out for global view
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const { nightPolygon, dayPolygon } = useTerminator();
    const { radarPath } = useWeather();
    const { auroraData } = useAurora();
    const { earthquakeData } = useEarthquakes();
    const { volcanoData } = useVolcanoes();

    // Handle FlyTo Focus
    useEffect(() => {
        if (map.current && focusLocation) {
            map.current.flyTo({
                center: [focusLocation.lon, focusLocation.lat],
                zoom: 4,
                speed: 1.5,
                curve: 1
            });
        }
    }, [focusLocation]);

    useEffect(() => {
        if (map.current) return;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: {
                version: 8,
                glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
                sources: {
                    'satellite': {
                        type: 'raster',
                        tiles: [
                            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        ],
                        tileSize: 256,
                        attribution: '© Esri, © USGS, © NOAA'
                    },
                    'dark': {
                        type: 'raster',
                        tiles: [
                            'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'light': {
                        type: 'raster',
                        tiles: [
                            'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'grey': {
                        type: 'raster',
                        tiles: [
                            'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
                        ],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'city-lights': {
                        type: 'raster',
                        tiles: [
                            // NASA Black Marble / Earth at Night composite
                            'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'
                        ],
                        tileSize: 256,
                        attribution: 'NASA Earth Observatory'
                    }
                },
                layers: [
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: 'visible' }
                    },
                    {
                        id: 'dark-layer',
                        type: 'raster',
                        source: 'dark',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: 'none' }
                    },
                    {
                        id: 'light-layer',
                        type: 'raster',
                        source: 'light',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: 'none' }
                    },
                    {
                        id: 'grey-layer',
                        type: 'raster',
                        source: 'grey',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: 'none' }
                    }
                ]
            },
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false
        });

        map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
            // 1. NIGHT LAYER - Solid black mask covering night areas
            map.current.addSource('night', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'night-layer',
                type: 'fill',
                source: 'night',
                paint: {
                    'fill-color': '#000000',
                    'fill-opacity': 0.5
                }
            });

            // 2. CITY LIGHTS LAYER - Rendered ON TOP of night layer
            // In Day/Night Mode: night becomes solid black, city lights show on top
            map.current.addLayer({
                id: 'city-lights-layer',
                type: 'raster',
                source: 'city-lights',
                paint: {
                    'raster-opacity': 0.8
                },
                layout: {
                    'visibility': 'none'
                }
            });

            // 3. DAY MASK LAYER - Covers city lights in daylit areas
            // Only visible in Day/Night Mode to hide city lights where it's daytime
            map.current.addSource('day-mask', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'day-mask-layer',
                type: 'fill',
                source: 'day-mask',
                paint: {
                    'fill-color': '#000000',  // Will match base map in Day/Night Mode
                    'fill-opacity': 0  // Hidden by default
                }
            });

            // 5. AURORA LAYER (Heatmap)
            map.current.addSource('aurora', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            map.current.addLayer({
                id: 'aurora-layer',
                type: 'heatmap',
                source: 'aurora',
                maxzoom: 9,
                paint: {
                    // Start low weight
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0, 0,
                        100, 1
                    ],
                    // Increase intensity as zoom level increases
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        9, 3
                    ],
                    // Color ramp for aurora (Green -> Teal -> Purple -> Red)
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(0,0,0,0)',
                        0.2, 'rgba(0, 255, 128, 0.5)', // Green
                        0.4, 'rgba(0, 255, 255, 0.6)', // Cyan
                        0.6, 'rgba(0, 128, 255, 0.7)', // Blue
                        0.8, 'rgba(128, 0, 255, 0.8)', // Purple
                        1, 'rgba(255, 0, 128, 0.9)'  // Red/Pink
                    ],
                    // Adjust radius by zoom level
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 5,
                        9, 20
                    ],
                    // Transition from heatmap to circle layer by zoom level
                    'heatmap-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        7, 1,
                        9, 0
                    ],
                },
                layout: {
                    'visibility': 'none'
                }
            });

            // 6. EARTHQUAKES LAYER
            map.current.addSource('earthquakes', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Add pulsing glow for recent earthquakes (last 24 hours only)
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

            map.current.addLayer({
                id: 'earthquakes-pulse',
                type: 'circle',
                source: 'earthquakes',
                filter: ['>=', ['get', 'time'], twentyFourHoursAgo],
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        2, 15,   // Much larger for visibility
                        6, 30,
                        8, 50
                    ],
                    'circle-color': '#ff0000', // Bright red for maximum visibility
                    'circle-opacity': 0.6,
                    'circle-blur': 1.5  // More blur for glow effect
                },
                layout: {
                    'visibility': 'none'
                }
            });

            map.current.addLayer({
                id: 'earthquakes-layer',
                type: 'circle',
                source: 'earthquakes',
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        2, 3,
                        6, 10,
                        8, 18
                    ],
                    'circle-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        2, '#fb923c', // Orange-400
                        5, '#ef4444', // Red-500
                        7, '#b91c1c'  // Red-700
                    ],
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#fff',
                    'circle-stroke-opacity': 0.9
                },
                layout: {
                    'visibility': 'none'
                }
            });

            // 7. VOLCANOES LAYER
            map.current.addSource('volcanoes', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Generate Triangle Icons with different colors
            const createTriangleIcon = (fillColor, borderColor, iconName) => {
                const width = 24;
                const height = 24;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Draw Triangle
                ctx.fillStyle = fillColor;
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(width / 2, 2); // Top
                ctx.lineTo(width - 2, height - 2); // Bottom Right
                ctx.lineTo(2, height - 2); // Bottom Left
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                const imageData = ctx.getImageData(0, 0, width, height);
                if (!map.current.hasImage(iconName)) {
                    map.current.addImage(iconName, imageData);
                }
            };

            // Create icons for different alert levels
            createTriangleIcon('#dc2626', '#7f1d1d', 'volcano-high');    // Red - High alert (Erupting)
            createTriangleIcon('#f97316', '#c2410c', 'volcano-medium');  // Orange - Medium alert (Active/Restless)
            createTriangleIcon('#9ca3af', '#6b7280', 'volcano-low');     // Gray - Low alert (Monitored)

            map.current.addLayer({
                id: 'volcanoes-layer',
                type: 'symbol',
                source: 'volcanoes',
                layout: {
                    // Use data-driven icon selection based on alert_level
                    'icon-image': [
                        'match',
                        ['get', 'alert_level'],
                        'high', 'volcano-high',
                        'medium', 'volcano-medium',
                        'volcano-low'  // default
                    ],
                    // Slightly larger icons for high alert
                    'icon-size': [
                        'match',
                        ['get', 'alert_level'],
                        'high', 1.0,
                        'medium', 0.85,
                        0.7  // default (low)
                    ],
                    'icon-allow-overlap': true,
                    'visibility': 'none'
                }
            });

            // 8. INTERNATIONAL DATE LINE
            map.current.addSource('date-line', {
                type: 'geojson',
                data: dateLineGeoJson
            });

            map.current.addLayer({
                id: 'date-line-layer',
                type: 'line',
                source: 'date-line',
                paint: {
                    'line-color': '#f0abfc', // Fuchsia-300 (Magenta-ish)
                    'line-width': 2,
                    'line-dasharray': [2, 4]
                },
                layout: {
                    'visibility': 'none'
                }
            });



            // 2. MOON LAYER
            map.current.addSource('moon', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Add Moon Glow (Circle) - Enlarged
            map.current.addLayer({
                id: 'moon-glow',
                type: 'circle',
                source: 'moon',
                paint: {
                    'circle-radius': 40,
                    'circle-color': '#ffffff',
                    'circle-opacity': 0.4,
                    'circle-blur': 0.5
                },
                layout: {
                    'visibility': layers.moon ? 'visible' : 'none'
                }
            });

            // Load Moon Phase Images properly
            const loadMoonImages = async () => {
                console.log("Starting loadMoonImages with native Image API...");
                const phases = [
                    "moon-new-moon", "moon-waxing-crescent", "moon-first-quarter", "moon-waxing-gibbous",
                    "moon-full-moon", "moon-waning-gibbous", "moon-last-quarter", "moon-waning-crescent"
                ];

                const loadPromises = phases.map(phase => {
                    return new Promise((resolve) => {
                        if (map.current.hasImage(phase)) {
                            console.log(`Image ${phase} already exists.`);
                            resolve();
                            return;
                        }

                        const img = new Image();
                        const url = `/assets/moon_phases/${phase}.png`;

                        img.onload = () => {
                            if (!map.current.hasImage(phase)) {
                                map.current.addImage(phase, img);
                                console.log(`Successfully added image: ${phase}`);
                            }
                            resolve();
                        };

                        img.onerror = (err) => {
                            console.error(`Error loading image ${phase} from ${url}`, err);
                            resolve(); // Resolve anyway to not block
                        };

                        img.crossOrigin = "Anonymous";
                        img.src = url;
                    });
                });

                // Force resolution if it takes too long (safety net)
                const timeoutPromise = new Promise(resolve => setTimeout(() => {
                    console.warn("Image loading timed out (native), proceeding to render layer.");
                    resolve();
                }, 3000));

                await Promise.race([Promise.all(loadPromises), timeoutPromise]);

                console.log("All images loaded (or timed out). Adding moon-layer.");

                // Add layer ONLY after images are loaded
                if (!map.current.getLayer('moon-layer')) {
                    try {
                        map.current.addLayer({
                            id: 'moon-layer',
                            type: 'symbol',
                            source: 'moon',
                            layout: {
                                'icon-image': ['get', 'icon'],
                                'icon-size': 0.5,
                                'icon-allow-overlap': true,
                                'icon-offset': [15, 15],
                                'visibility': layers.moon ? 'visible' : 'none'
                            }
                        });
                        console.log("moon-layer added successfully.");
                    } catch (err) {
                        console.error("Error adding moon-layer:", err);
                    }
                }
            };



            // 4. ISS LAYER
            map.current.addSource('iss', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            loadMoonImages();

            // Load ISS Image (Native API)
            const loadISSImage = () => {
                const img = new Image();
                const url = '/assets/iss.png';
                img.onload = () => {
                    if (!map.current.hasImage('iss-icon')) {
                        map.current.addImage('iss-icon', img);
                    }
                    // Add ISS Layer once image is ready
                    if (!map.current.getLayer('iss-layer')) {
                        map.current.addLayer({
                            id: 'iss-layer',
                            type: 'symbol',
                            source: 'iss',
                            layout: {
                                'icon-image': 'iss-icon',
                                'icon-size': 0.6,
                                'icon-allow-overlap': true,
                                'visibility': layers.iss ? 'visible' : 'none'
                            }
                        });
                    }
                };
                img.onerror = (err) => console.error("Error loading ISS image", err);
                img.crossOrigin = "Anonymous";
                img.src = url;
            };
            loadISSImage();

            setIsMapLoaded(true);
        });

    }, [lng, lat, zoom]);

    // Update Night Layer Data
    useEffect(() => {
        if (map.current && nightPolygon && map.current.getSource('night')) {
            map.current.getSource('night').setData({
                type: 'FeatureCollection',
                features: [nightPolygon]
            });
        }

        // Also update day mask layer
        if (map.current && dayPolygon && map.current.getSource('day-mask')) {
            map.current.getSource('day-mask').setData({
                type: 'FeatureCollection',
                features: [dayPolygon]
            });
        }
    }, [nightPolygon, dayPolygon, isMapLoaded]);

    // Update Moon Data
    useEffect(() => {
        if (map.current && moonData && map.current.getSource('moon')) {
            map.current.getSource('moon').setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [moonData.longitude, moonData.latitude]
                    },
                    properties: {
                        icon: moonData.phase_name
                    }
                }]
            });
        }
    }, [moonData, isMapLoaded]);

    // Update RainViewer Data (Precipitation)
    useEffect(() => {
        if (map.current && radarPath && isMapLoaded) {
            const tileUrl = `https://tilecache.rainviewer.com${radarPath}/512/{z}/{x}/{y}/2/1_1.png`;

            if (map.current.getSource('rainviewer')) {
                // Update existing source tiles
                // MapLibre doesn't support updating raster tiles directly easily without removing/adding or custom implementation
                // Alternatively, we can use setStyle or similar, but removing/adding source is safer for dynamic raster URLs
                if (map.current.getLayer('rain-layer')) map.current.removeLayer('rain-layer');
                map.current.removeSource('rainviewer');
            }

            map.current.addSource('rainviewer', {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256
            });

            map.current.addLayer({
                id: 'rain-layer',
                type: 'raster',
                source: 'rainviewer',
                minzoom: 0,
                maxzoom: 18,
                layout: { visibility: 'none' }, // Default to none, let main effect handle it
                paint: { 'raster-opacity': 0.8 }
            }, 'moon-glow'); // Place before moon/iss but after base map
        }
    }, [radarPath, isMapLoaded]); // Only re-run if path changes

    // Update ISS Data
    useEffect(() => {
        if (map.current && issData && map.current.getSource('iss')) {
            map.current.getSource('iss').setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [issData.longitude, issData.latitude]
                    },
                    properties: {}
                }]
            });
        }
    }, [issData, isMapLoaded]);

    // Update Aurora Data
    useEffect(() => {
        if (map.current && auroraData && map.current.getSource('aurora')) {
            map.current.getSource('aurora').setData(auroraData);
        }
    }, [auroraData, isMapLoaded]);

    // Update Earthquake Data
    useEffect(() => {
        if (map.current && earthquakeData && map.current.getSource('earthquakes')) {
            map.current.getSource('earthquakes').setData(earthquakeData);
        }
    }, [earthquakeData, isMapLoaded]);

    // Animate earthquake pulse layer
    useEffect(() => {
        if (!map.current || !map.current.getLayer('earthquakes-pulse') || !weatherLayers.earthquakes) return;

        console.log('Starting earthquake pulse animation...');
        let animationId;
        let pulseFrame = 0;

        const animatePulse = () => {
            if (!map.current || !map.current.getLayer('earthquakes-pulse')) return;

            pulseFrame += 0.05; // Faster animation
            const opacity = (Math.sin(pulseFrame) + 1) / 2 * 0.7; // Oscillate between 0 and 0.7

            try {
                map.current.setPaintProperty('earthquakes-pulse', 'circle-opacity', opacity);
            } catch (e) {
                console.error('Error setting pulse opacity:', e);
            }

            animationId = requestAnimationFrame(animatePulse);
        };

        animatePulse();

        return () => {
            console.log('Stopping earthquake pulse animation');
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [isMapLoaded, weatherLayers.earthquakes]);

    // Update Volcano Data
    useEffect(() => {
        if (map.current && volcanoData && map.current.getSource('volcanoes')) {
            map.current.getSource('volcanoes').setData(volcanoData);
        }
    }, [volcanoData, isMapLoaded]);



    // Handle Layer Toggles
    useEffect(() => {
        if (!map.current) return;

        const setVisibility = (id, visible) => {
            if (map.current.getLayer(id)) {
                map.current.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
            }
        };

        // Base Map Styles
        setVisibility('satellite-layer', mapStyle === 'satellite');
        setVisibility('dark-layer', mapStyle === 'dark');
        setVisibility('light-layer', mapStyle === 'light');
        setVisibility('grey-layer', mapStyle === 'grey');

        // Overlays
        setVisibility('night-layer', layers.night);
        setVisibility('city-lights-layer', layers.cityLights);
        setVisibility('moon-layer', layers.moon);
        setVisibility('moon-glow', layers.moon);
        setVisibility('iss-layer', layers.iss);

        // Weather
        if (map.current.getLayer('rain-layer')) {
            setVisibility('rain-layer', weatherLayers.precipitation);
        }

        // Space Weather
        if (map.current.getLayer('aurora-layer')) {
            setVisibility('aurora-layer', weatherLayers.aurora);
        }

        // Geological
        if (map.current.getLayer('earthquakes-layer')) {
            setVisibility('earthquakes-layer', weatherLayers.earthquakes);
            setVisibility('earthquakes-pulse', weatherLayers.earthquakes);
        }
        if (map.current.getLayer('volcanoes-layer')) {
            setVisibility('volcanoes-layer', weatherLayers.volcanoes);
        }

        // Date Line
        if (map.current.getLayer('date-line-layer')) {
            setVisibility('date-line-layer', showDateLine);
        }

    }, [layers, mapStyle, moonData, isMapLoaded, weatherLayers, showDateLine]);

    // Adjust night layer opacity for Day/Night Mode
    useEffect(() => {
        if (!map.current || !isMapLoaded) return;

        if (map.current.getLayer('night-layer')) {
            if (dayNightMode) {
                // Dark overlay in night areas (0.85 = mostly dark but not pure black)
                map.current.setPaintProperty('night-layer', 'fill-opacity', 0.60);
            } else {
                // Semi-transparent overlay for normal terminator view
                map.current.setPaintProperty('night-layer', 'fill-opacity', 0.5);
            }
        }

        // Adjust city lights opacity - lower so base map shows through
        if (map.current.getLayer('city-lights-layer')) {
            // In Day/Night mode: low opacity so day areas show base map
            // City lights will still be visible in night areas (against black background)
            const cityLightsOpacity = dayNightMode ? 0.4 : 0.8;
            map.current.setPaintProperty('city-lights-layer', 'raster-opacity', cityLightsOpacity);
        }
    }, [dayNightMode, isMapLoaded]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full bg-[#0b0e14]">
            <div ref={mapContainer} className="map w-full h-full" />
        </div>
    );
}
