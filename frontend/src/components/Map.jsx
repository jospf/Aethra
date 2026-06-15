import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTerminator } from '../hooks/useTerminator';
import { useWeather } from '../hooks/useWeather';
import { useAurora } from '../hooks/useAurora';
import { useFlights } from '../hooks/useFlights';
import { useShips } from '../hooks/useShips';
// import { useSatellites } from '../hooks/useSatellites'; // Temporarily disabled - network issues
import dateLineGeoJson from '../data/dateLine.json';
import cablesGeoJson from '../data/cables.json';

const MILITARY_TZ_NAMES = {
    'Z': 'Zulu',
    'A': 'Alpha',
    'B': 'Bravo',
    'C': 'Charlie',
    'D': 'Delta',
    'E': 'Echo',
    'F': 'Foxtrot',
    'G': 'Golf',
    'H': 'Hotel',
    'I': 'India',
    'K': 'Kilo',
    'L': 'Lima',
    'M': 'Mike',
    'N': 'November',
    'O': 'Oscar',
    'P': 'Papa',
    'Q': 'Quebec',
    'R': 'Romeo',
    'S': 'Sierra',
    'T': 'Tango',
    'U': 'Uniform',
    'V': 'Victor',
    'W': 'Whiskey',
    'X': 'X-ray',
    'Y': 'Yankee'
};

const getMilitaryTzInfo = (offsetHours) => {
    let letter = '';
    if (offsetHours === 0) {
        letter = 'Z';
    } else if (offsetHours > 0) {
        const code = offsetHours <= 9 ? 64 + offsetHours : 65 + offsetHours;
        letter = String.fromCharCode(code);
    } else {
        const code = 77 - offsetHours;
        letter = String.fromCharCode(code);
    }
    
    return {
        letter,
        name: MILITARY_TZ_NAMES[letter] || ''
    };
};

export default function Map({
    mapStyle = 'satellite',
    layers = { night: true, moon: true, iss: true },
    showDateLine = true,
    weatherLayers = { precipitation: false, clouds: false, temperature: false },
    moonData,
    issData,
    issTrack,
    earthquakeData,
    volcanoData,
    focusLocation,
    dayNightMode = false,
    showTimezones = false
}) {
    const { nightPolygon, dayPolygon } = useTerminator();
    const { radarPath } = useWeather();
    const { auroraData } = useAurora();
    // const { flightData } = useFlights(); // Temporarily disabled - OpenSky rate limiting
    const { shipData } = useShips();
    // const { data: gpsData } = useSatellites('gps'); // Temporarily disabled - network issues
    // const { data: iridiumData } = useSatellites('iridium'); // Temporarily disabled - network issues

    const mapBottomContainer = useRef(null);
    const mapTopContainer = useRef(null);
    const mapBottom = useRef(null);
    const mapTop = useRef(null);
    const layersRef = useRef(layers);
    const dayNightModeRef = useRef(dayNightMode);
    const nightPolygonRef = useRef(null);
    const updateClipPathRef = useRef(null);

    useEffect(() => {
        layersRef.current = layers;
    }, [layers]);

    useEffect(() => {
        dayNightModeRef.current = dayNightMode;
    }, [dayNightMode]);

    useEffect(() => {
        nightPolygonRef.current = nightPolygon;
    }, [nightPolygon]);

    const [lng] = useState(0);
    const [lat] = useState(0);
    const [zoom] = useState(1.5); // Start zoomed out for global view
    const [isBottomMapLoaded, setIsBottomMapLoaded] = useState(false);
    const [isTopMapLoaded, setIsTopMapLoaded] = useState(false);

    // Helper functions to safely update layers/sources on both maps
    const setSourceData = (sourceId, data) => {
        if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getSource(sourceId)) {
            mapBottom.current.getSource(sourceId).setData(data);
        }
        if (mapTop.current && isTopMapLoaded && mapTop.current.getSource(sourceId)) {
            mapTop.current.getSource(sourceId).setData(data);
        }
    };

    const setLayerVisibility = (layerId, visible) => {
        const value = visible ? 'visible' : 'none';
        if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getLayer(layerId)) {
            mapBottom.current.setLayoutProperty(layerId, 'visibility', value);
        }
        if (mapTop.current && isTopMapLoaded && mapTop.current.getLayer(layerId)) {
            mapTop.current.setLayoutProperty(layerId, 'visibility', value);
        }
    };

    const setLayerPaintProperty = (layerId, prop, value) => {
        if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getLayer(layerId)) {
            mapBottom.current.setPaintProperty(layerId, prop, value);
        }
        if (mapTop.current && isTopMapLoaded && mapTop.current.getLayer(layerId)) {
            mapTop.current.setPaintProperty(layerId, prop, value);
        }
    };

    const setLayerLayoutProperty = (layerId, prop, value) => {
        if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getLayer(layerId)) {
            mapBottom.current.setLayoutProperty(layerId, prop, value);
        }
        if (mapTop.current && isTopMapLoaded && mapTop.current.getLayer(layerId)) {
            mapTop.current.setLayoutProperty(layerId, prop, value);
        }
    };

    // Update clip-path for day/night mode
    const updateClipPath = () => {
        if (!mapBottom.current || !mapTop.current || !mapTopContainer.current) {
            return;
        }

        const activeMode = dayNightModeRef.current;
        const currentPolygon = nightPolygonRef.current;

        if (!activeMode) {
            mapTopContainer.current.style.clipPath = 'none';
            mapTopContainer.current.style.webkitClipPath = 'none';
            return;
        }

        if (!currentPolygon) {
            mapTopContainer.current.style.clipPath = 'none';
            mapTopContainer.current.style.webkitClipPath = 'none';
            return;
        }

        try {
            const centerLng = mapBottom.current.getCenter().lng;
            const offset = Math.round(centerLng / 360) * 360;
            const coords = currentPolygon.geometry.coordinates[0];
            
            // Extract the active terminator points (all except the wrapping points)
            const terminatorPoints = coords.slice(0, -3);
            const leftTerminator = terminatorPoints.map(p => [p[0] - 360, p[1]]);
            const rightTerminator = terminatorPoints.map(p => [p[0] + 360, p[1]]);
            
            const combinedTerminator = [
                ...leftTerminator,
                ...terminatorPoints,
                ...rightTerminator
            ];
            
            const wrapViaNorth = currentPolygon.properties?.wrapViaNorth !== false;
            const wrapLat = wrapViaNorth ? 85 : -85;
            
            const combinedPolygon = [
                ...combinedTerminator,
                [540, wrapLat],
                [-540, wrapLat],
                combinedTerminator[0]
            ];

            let hasInvalid = false;
            const points = combinedPolygon.map(coord => {
                const projected = mapBottom.current.project([coord[0] + offset, coord[1]]);
                if (!projected || !isFinite(projected.x) || !isFinite(projected.y)) {
                    hasInvalid = true;
                    return '';
                }
                return `${projected.x.toFixed(1)}px ${projected.y.toFixed(1)}px`;
            });

            if (hasInvalid) {
                requestAnimationFrame(() => {
                    if (updateClipPathRef.current) updateClipPathRef.current();
                });
                return;
            }

            const clipPathVal = `polygon(${points.join(', ')})`;
            mapTopContainer.current.style.clipPath = clipPathVal;
            mapTopContainer.current.style.webkitClipPath = clipPathVal;
        } catch (err) {
            console.error('Error updating clip-path:', err);
        }
    };

    updateClipPathRef.current = updateClipPath;

    // Setup function for vector icons
    const setupVolcanoIcons = (map) => {
        const createTriangleIcon = (fillColor, borderColor, iconName) => {
            if (map.hasImage(iconName)) return;
            const width = 24;
            const height = 24;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = fillColor;
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 2);
            ctx.lineTo(width - 2, height - 2);
            ctx.lineTo(2, height - 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const imageData = ctx.getImageData(0, 0, width, height);
            map.addImage(iconName, imageData);
        };

        createTriangleIcon('#dc2626', '#7f1d1d', 'volcano-high');
        createTriangleIcon('#f97316', '#c2410c', 'volcano-medium');
        createTriangleIcon('#9ca3af', '#6b7280', 'volcano-low');
    };

    const setupFlightIcons = (map) => {
        if (map.hasImage('plane-icon')) return;
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(12, 2);
        ctx.lineTo(16, 10);
        ctx.lineTo(22, 14);
        ctx.lineTo(12, 12);
        ctx.lineTo(2, 14);
        ctx.lineTo(8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(12, 12);
        ctx.lineTo(15, 20);
        ctx.lineTo(9, 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const imageData = ctx.getImageData(0, 0, size, size);
        map.addImage('plane-icon', imageData, { pixelRatio: 2 });
    };

    const setupShipIcons = (map) => {
        if (map.hasImage('ship-icon')) return;
        const size = 20;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#06b6d4';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(10, 2);
        ctx.lineTo(16, 18);
        ctx.lineTo(10, 16);
        ctx.lineTo(4, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const imageData = ctx.getImageData(0, 0, size, size);
        map.addImage('ship-icon', imageData, { pixelRatio: 2 });
    };

    // Load moon images using Canvas API
    const loadMoonImagesForMap = async (map) => {
        const phases = [
            "moon-new-moon", "moon-waxing-crescent", "moon-first-quarter", "moon-waxing-gibbous",
            "moon-full-moon", "moon-waning-gibbous", "moon-last-quarter", "moon-waning-crescent"
        ];

        let timeoutId;
        const loadPromises = phases.map(phase => {
            return new Promise((resolve) => {
                if (map.hasImage(phase)) {
                    resolve();
                    return;
                }

                const img = new Image();
                const url = `/assets/moon_phases/${phase}.png?v=2`;

                img.onload = () => {
                    if (!map.hasImage(phase)) {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth || img.width || 128;
                            canvas.height = img.naturalHeight || img.height || 128;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            map.addImage(phase, imageData);
                        } catch (e) {
                            console.error(`Error adding image ${phase}:`, e);
                        }
                    }
                    resolve();
                };

                img.onerror = () => {
                    resolve();
                };

                img.src = url;
            });
        });

        const timeoutPromise = new Promise(resolve => {
            timeoutId = setTimeout(resolve, 3000);
        });

        await Promise.race([Promise.all(loadPromises), timeoutPromise]);
        if (timeoutId) clearTimeout(timeoutId);

        if (!map.getLayer('moon-layer')) {
            try {
                map.addLayer({
                    id: 'moon-layer',
                    type: 'symbol',
                    source: 'moon',
                    layout: {
                        'icon-image': moonData ? moonData.phase_name : 'moon-new-moon',
                        'icon-size': 0.6,
                        'icon-allow-overlap': true,
                        'icon-anchor': 'center',
                        'icon-offset': [0, 0],
                        'visibility': layersRef.current.moon ? 'visible' : 'none'
                    }
                });
            } catch (err) {
                console.error("Error adding moon-layer:", err);
            }
        }
    };

    // Load ISS icon
    const loadISSImageForMap = (map) => {
        const img = new Image();
        const url = '/assets/iss.png?v=2';
        img.onload = () => {
            if (!map.hasImage('iss-icon')) {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth || img.width || 32;
                    canvas.height = img.naturalHeight || img.height || 32;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    map.addImage('iss-icon', imageData);
                } catch (e) {
                    console.error("Error adding iss-icon:", e);
                }
            }
            if (!map.getLayer('iss-layer')) {
                try {
                    map.addLayer({
                        id: 'iss-layer',
                        type: 'symbol',
                        source: 'iss',
                        layout: {
                            'icon-image': 'iss-icon',
                            'icon-size': 0.6,
                            'icon-allow-overlap': true,
                            'visibility': layersRef.current.iss ? 'visible' : 'none'
                        }
                    });
                } catch (err) {
                    console.error("Error adding iss-layer:", err);
                }
            }
        };
        img.src = url;
    };

    // Setup sources and layers on a given map
    const setupMapLayers = (map) => {
        // Night layer
        if (!map.getSource('night')) {
            map.addSource('night', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('night-layer')) {
            map.addLayer({
                id: 'night-layer',
                type: 'fill',
                source: 'night',
                paint: {
                    'fill-color': '#000000',
                    'fill-opacity': 0.5
                }
            });
        }

        // City lights layer
        if (!map.getLayer('city-lights-layer')) {
            map.addLayer({
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
        }

        // Day mask layer
        if (!map.getSource('day-mask')) {
            map.addSource('day-mask', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('day-mask-layer')) {
            map.addLayer({
                id: 'day-mask-layer',
                type: 'fill',
                source: 'day-mask',
                paint: {
                    'fill-color': '#000000',
                    'fill-opacity': 0
                }
            });
        }

        // Aurora
        if (!map.getSource('aurora')) {
            map.addSource('aurora', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('aurora-layer')) {
            map.addLayer({
                id: 'aurora-layer',
                type: 'heatmap',
                source: 'aurora',
                maxzoom: 9,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'intensity'],
                        0, 0,
                        100, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        9, 3
                    ],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(0,0,0,0)',
                        0.2, 'rgba(0, 255, 128, 0.5)',
                        0.4, 'rgba(0, 255, 255, 0.6)',
                        0.6, 'rgba(0, 128, 255, 0.7)',
                        0.8, 'rgba(128, 0, 255, 0.8)',
                        1, 'rgba(255, 0, 128, 0.9)'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 5,
                        9, 20
                    ],
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
        }

        // Earthquakes
        if (!map.getSource('earthquakes')) {
            map.addSource('earthquakes', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        if (!map.getLayer('earthquakes-pulse')) {
            map.addLayer({
                id: 'earthquakes-pulse',
                type: 'circle',
                source: 'earthquakes',
                filter: ['>=', ['get', 'time'], twentyFourHoursAgo],
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['get', 'mag'],
                        2, 15,
                        6, 30,
                        8, 50
                    ],
                    'circle-color': '#ff0000',
                    'circle-opacity': 0.6,
                    'circle-blur': 1.5
                },
                layout: {
                    'visibility': 'none'
                }
            });
        }
        if (!map.getLayer('earthquakes-layer')) {
            map.addLayer({
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
                        2, '#fb923c',
                        5, '#ef4444',
                        7, '#b91c1c'
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
        }

        // Volcanoes
        if (!map.getSource('volcanoes')) {
            map.addSource('volcanoes', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        setupVolcanoIcons(map);
        if (!map.getLayer('volcanoes-layer')) {
            map.addLayer({
                id: 'volcanoes-layer',
                type: 'symbol',
                source: 'volcanoes',
                layout: {
                    'icon-image': [
                        'match',
                        ['get', 'alert_level'],
                        'high', 'volcano-high',
                        'medium', 'volcano-medium',
                        'volcano-low'
                    ],
                    'icon-size': [
                        'match',
                        ['get', 'alert_level'],
                        'high', 1.0,
                        'medium', 0.85,
                        0.7
                    ],
                    'icon-allow-overlap': true,
                    'visibility': 'none'
                }
            });
        }

        // Flights
        if (!map.getSource('flights')) {
            map.addSource('flights', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        setupFlightIcons(map);
        if (!map.getLayer('flights-layer')) {
            map.addLayer({
                id: 'flights-layer',
                type: 'symbol',
                source: 'flights',
                layout: {
                    'icon-image': 'plane-icon',
                    'icon-size': 0.8,
                    'icon-rotate': ['get', 'heading'],
                    'icon-allow-overlap': true,
                    'icon-rotation-alignment': 'map',
                    'visibility': 'none'
                }
            });
        }

        // Ships
        if (!map.getSource('ships')) {
            map.addSource('ships', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        setupShipIcons(map);
        if (!map.getLayer('ships-layer')) {
            map.addLayer({
                id: 'ships-layer',
                type: 'symbol',
                source: 'ships',
                layout: {
                    'icon-image': 'ship-icon',
                    'icon-size': 0.7,
                    'icon-rotate': ['get', 'heading'],
                    'icon-allow-overlap': true,
                    'icon-rotation-alignment': 'map',
                    'visibility': 'none'
                }
            });
        }

        // Cables
        if (!map.getSource('cables')) {
            map.addSource('cables', {
                type: 'geojson',
                data: cablesGeoJson
            });
        }
        if (!map.getLayer('cables-layer')) {
            map.addLayer({
                id: 'cables-layer',
                type: 'line',
                source: 'cables',
                paint: {
                    'line-color': '#10b981',
                    'line-width': 1,
                    'line-opacity': 0.7
                },
                layout: {
                    'visibility': 'none'
                }
            });
        }

        // Satellites (GPS / Iridium)
        if (!map.getSource('gps')) {
            map.addSource('gps', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('gps-layer')) {
            map.addLayer({
                id: 'gps-layer',
                type: 'circle',
                source: 'gps',
                paint: {
                    'circle-radius': 3.5,
                    'circle-color': '#facc15',
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#ffffff'
                },
                layout: {
                    'visibility': 'none'
                }
            });
        }

        if (!map.getSource('iridium')) {
            map.addSource('iridium', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('iridium-layer')) {
            map.addLayer({
                id: 'iridium-layer',
                type: 'circle',
                source: 'iridium',
                paint: {
                    'circle-radius': 2.5,
                    'circle-color': '#ec4899',
                    'circle-stroke-width': 0,
                    'circle-opacity': 0.8
                },
                layout: {
                    'visibility': 'none'
                }
            });
        }

        // Date line
        if (!map.getSource('date-line')) {
            map.addSource('date-line', {
                type: 'geojson',
                data: dateLineGeoJson
            });
        }
        if (!map.getLayer('date-line-layer')) {
            map.addLayer({
                id: 'date-line-layer',
                type: 'line',
                source: 'date-line',
                paint: {
                    'line-color': '#f0abfc',
                    'line-width': 2,
                    'line-dasharray': [2, 4]
                },
                layout: {
                    'visibility': 'none'
                }
            });
        }

        // Timezone boundaries
        if (!map.getSource('timezone-boundaries')) {
            map.addSource('timezone-boundaries', {
                type: 'geojson',
                data: '/assets/timezones.json'
            });
        }
        if (!map.getLayer('timezone-boundaries-layer')) {
            map.addLayer({
                id: 'timezone-boundaries-layer',
                type: 'line',
                source: 'timezone-boundaries',
                paint: {
                    'line-color': '#06b6d4',
                    'line-width': 1.2,
                    'line-opacity': 0.35
                },
                layout: {
                    'visibility': 'none'
                }
            });
        }

        // Moon
        if (!map.getSource('moon')) {
            map.addSource('moon', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('moon-glow')) {
            map.addLayer({
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
                    'visibility': layersRef.current.moon ? 'visible' : 'none'
                }
            });
        }

        // ISS
        if (!map.getSource('iss')) {
            map.addSource('iss', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getSource('iss-track')) {
            map.addSource('iss-track', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });
        }
        if (!map.getLayer('iss-track-layer')) {
            map.addLayer({
                id: 'iss-track-layer',
                type: 'line',
                source: 'iss-track',
                paint: {
                    'line-color': '#06b6d4',
                    'line-width': 2,
                    'line-opacity': 0.5,
                    'line-dasharray': [4, 4]
                },
                layout: {
                    'visibility': layersRef.current.iss ? 'visible' : 'none'
                }
            });
        }

        // Load images
        loadMoonImagesForMap(map);
        loadISSImageForMap(map);
    };

    // Initialize maps
    useEffect(() => {
        if (mapBottom.current || mapTop.current) return;

        // Bottom Map (Base + Vector overlays)
        mapBottom.current = new maplibregl.Map({
            container: mapBottomContainer.current,
            renderWorldCopies: true,
            style: {
                version: 8,
                glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
                sources: {
                    'satellite': {
                        type: 'raster',
                        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                        tileSize: 256,
                        attribution: '© Esri, © USGS, © NOAA'
                    },
                    'dark': {
                        type: 'raster',
                        tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'light': {
                        type: 'raster',
                        tiles: ['https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'grey': {
                        type: 'raster',
                        tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
                        tileSize: 256,
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    },
                    'city-lights': {
                        type: 'raster',
                        tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'],
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
                        layout: { visibility: mapStyle === 'satellite' ? 'visible' : 'none' }
                    },
                    {
                        id: 'dark-layer',
                        type: 'raster',
                        source: 'dark',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: mapStyle === 'dark' ? 'visible' : 'none' }
                    },
                    {
                        id: 'light-layer',
                        type: 'raster',
                        source: 'light',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: mapStyle === 'light' ? 'visible' : 'none' }
                    },
                    {
                        id: 'grey-layer',
                        type: 'raster',
                        source: 'grey',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: mapStyle === 'grey' ? 'visible' : 'none' }
                    }
                ]
            },
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false
        });

        mapBottom.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');
        mapBottom.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Top Map (City Lights / Night background + Vector overlays)
        mapTop.current = new maplibregl.Map({
            container: mapTopContainer.current,
            renderWorldCopies: true,
            style: {
                version: 8,
                glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
                sources: {
                    'city-lights': {
                        type: 'raster',
                        tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'],
                        tileSize: 256,
                        attribution: 'NASA Earth Observatory'
                    }
                },
                layers: [
                    {
                        id: 'city-lights-layer',
                        type: 'raster',
                        source: 'city-lights',
                        minzoom: 0,
                        maxzoom: 19,
                        layout: { visibility: 'visible' }
                    }
                ]
            },
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false,
            interactive: false
        });

        // Event listener to sync top map to bottom map
        const onBottomMapMove = () => {
            if (mapTop.current) {
                mapTop.current.jumpTo({
                    center: mapBottom.current.getCenter(),
                    zoom: mapBottom.current.getZoom(),
                    bearing: mapBottom.current.getBearing(),
                    pitch: mapBottom.current.getPitch()
                });
            }
            if (updateClipPathRef.current) {
                updateClipPathRef.current();
            }
        };

        mapBottom.current.on('move', onBottomMapMove);
        mapBottom.current.on('zoom', onBottomMapMove);
        mapBottom.current.on('rotate', onBottomMapMove);
        mapBottom.current.on('pitch', onBottomMapMove);
        mapBottom.current.on('render', () => {
            if (updateClipPathRef.current) {
                updateClipPathRef.current();
            }
        });

        mapBottom.current.on('load', () => {
            setupMapLayers(mapBottom.current);
            setIsBottomMapLoaded(true);
        });

        mapTop.current.on('load', () => {
            setupMapLayers(mapTop.current);
            setIsTopMapLoaded(true);
        });

        return () => {
            if (mapBottom.current) {
                mapBottom.current.remove();
                mapBottom.current = null;
            }
            if (mapTop.current) {
                mapTop.current.remove();
                mapTop.current = null;
            }
        };
    }, [lng, lat, zoom]);

    // Handle FlyTo Focus Location
    useEffect(() => {
        if (mapBottom.current && focusLocation) {
            mapBottom.current.flyTo({
                center: [focusLocation.lon, focusLocation.lat],
                zoom: 4,
                speed: 1.5,
                curve: 1
            });
        }
    }, [focusLocation]);

    // Update Night Layer & Day Mask Data
    useEffect(() => {
        if (nightPolygon) {
            setSourceData('night', {
                type: 'FeatureCollection',
                features: [nightPolygon]
            });
        }
        if (dayPolygon) {
            setSourceData('day-mask', {
                type: 'FeatureCollection',
                features: [dayPolygon]
            });
        }
    }, [nightPolygon, dayPolygon, isBottomMapLoaded, isTopMapLoaded]);

    // Update Ship Data
    useEffect(() => {
        if (shipData) {
            setSourceData('ships', shipData);
        }
    }, [shipData, isBottomMapLoaded, isTopMapLoaded]);

    // Update Moon Data
    useEffect(() => {
        if (moonData) {
            setSourceData('moon', {
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [moonData.longitude, moonData.latitude]
                    },
                    properties: {}
                }]
            });
            setLayerLayoutProperty('moon-layer', 'icon-image', moonData.phase_name);
        }
    }, [moonData, isBottomMapLoaded, isTopMapLoaded]);

    // Update RainViewer Data
    useEffect(() => {
        if (radarPath && isBottomMapLoaded && isTopMapLoaded) {
            const tileUrl = `https://tilecache.rainviewer.com${radarPath}/512/{z}/{x}/{y}/2/1_1.png`;

            const updateRainviewer = (map) => {
                if (map.getSource('rainviewer')) {
                    if (map.getLayer('rain-layer')) map.removeLayer('rain-layer');
                    map.removeSource('rainviewer');
                }
                map.addSource('rainviewer', {
                    type: 'raster',
                    tiles: [tileUrl],
                    tileSize: 256
                });
                map.addLayer({
                    id: 'rain-layer',
                    type: 'raster',
                    source: 'rainviewer',
                    minzoom: 0,
                    maxzoom: 18,
                    layout: { visibility: weatherLayers.precipitation ? 'visible' : 'none' },
                    paint: { 'raster-opacity': 0.8 }
                }, 'moon-glow');
            };

            if (mapBottom.current) updateRainviewer(mapBottom.current);
            if (mapTop.current) updateRainviewer(mapTop.current);
        }
    }, [radarPath, weatherLayers.precipitation, isBottomMapLoaded, isTopMapLoaded]);

    // Update ISS Data
    useEffect(() => {
        if (issData) {
            setSourceData('iss', {
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
    }, [issData, isBottomMapLoaded, isTopMapLoaded]);

    // Update ISS Track Data
    useEffect(() => {
        if (issTrack) {
            setSourceData('iss-track', issTrack);
        }
    }, [issTrack, isBottomMapLoaded, isTopMapLoaded]);

    // Update Aurora Data
    useEffect(() => {
        if (auroraData) {
            setSourceData('aurora', auroraData);
        }
    }, [auroraData, isBottomMapLoaded, isTopMapLoaded]);

    // Update Earthquake Data
    useEffect(() => {
        if (earthquakeData) {
            setSourceData('earthquakes', earthquakeData);
        }
    }, [earthquakeData, isBottomMapLoaded, isTopMapLoaded]);

    // Earthquake pulse animation
    useEffect(() => {
        if (!weatherLayers.earthquakes) return;

        let animationId;
        let pulseFrame = 0;

        const animatePulse = () => {
            pulseFrame += 0.05;
            const opacity = (Math.sin(pulseFrame) + 1) / 2 * 0.7;
            setLayerPaintProperty('earthquakes-pulse', 'circle-opacity', opacity);
            animationId = requestAnimationFrame(animatePulse);
        };

        animatePulse();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [isBottomMapLoaded, isTopMapLoaded, weatherLayers.earthquakes]);

    // Update Volcano Data
    useEffect(() => {
        if (volcanoData) {
            setSourceData('volcanoes', volcanoData);
        }
    }, [volcanoData, isBottomMapLoaded, isTopMapLoaded]);

    // Layer Visibilities & Style adjustments
    useEffect(() => {
        // Base maps
        setLayerVisibility('satellite-layer', mapStyle === 'satellite');
        setLayerVisibility('dark-layer', mapStyle === 'dark');
        setLayerVisibility('light-layer', mapStyle === 'light');
        setLayerVisibility('grey-layer', mapStyle === 'grey');

        // City Lights layer visibility logic
        if (dayNightMode) {
            // Hide city lights on bottom map (daylit side)
            if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getLayer('city-lights-layer')) {
                mapBottom.current.setLayoutProperty('city-lights-layer', 'visibility', 'none');
            }
            // Show city lights on top map (night side)
            if (mapTop.current && isTopMapLoaded && mapTop.current.getLayer('city-lights-layer')) {
                mapTop.current.setLayoutProperty('city-lights-layer', 'visibility', 'visible');
                mapTop.current.setPaintProperty('city-lights-layer', 'raster-opacity', 0.95);
            }
        } else {
            // Standard mode: show on bottom map based on toggle
            if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getLayer('city-lights-layer')) {
                mapBottom.current.setLayoutProperty('city-lights-layer', 'visibility', layers.cityLights ? 'visible' : 'none');
                mapBottom.current.setPaintProperty('city-lights-layer', 'raster-opacity', 0.95);
            }
        }

        // Night layer (terminator) visibility logic
        if (dayNightMode) {
            // Day/Night mode replacement: mask takes care of day/night visual splitting.
            // We don't want the flat dark terminator overlay shading our beautiful city lights.
            setLayerVisibility('night-layer', false);
        } else {
            // Standard mode: show night layer on bottom map based on toggle
            if (mapBottom.current && isBottomMapLoaded && mapBottom.current.getLayer('night-layer')) {
                mapBottom.current.setLayoutProperty('night-layer', 'visibility', layers.night ? 'visible' : 'none');
                mapBottom.current.setPaintProperty('night-layer', 'fill-opacity', 0.5);
            }
        }

        // Overlays
        setLayerVisibility('moon-layer', layers.moon);
        setLayerVisibility('moon-glow', layers.moon);
        setLayerVisibility('iss-layer', layers.iss);
        setLayerVisibility('iss-track-layer', layers.iss);
        setLayerVisibility('gps-layer', weatherLayers.gps);
        setLayerVisibility('iridium-layer', weatherLayers.iridium);
        setLayerVisibility('rain-layer', weatherLayers.precipitation);
        setLayerVisibility('aurora-layer', weatherLayers.aurora);
        setLayerVisibility('earthquakes-layer', weatherLayers.earthquakes);
        setLayerVisibility('earthquakes-pulse', weatherLayers.earthquakes);
        setLayerVisibility('volcanoes-layer', weatherLayers.volcanoes);
        setLayerVisibility('flights-layer', weatherLayers.flights);
        setLayerVisibility('ships-layer', weatherLayers.ships);
        setLayerVisibility('cables-layer', weatherLayers.cables);
        setLayerVisibility('date-line-layer', showDateLine);
        setLayerVisibility('timezone-boundaries-layer', showTimezones);

    }, [layers, mapStyle, dayNightMode, isBottomMapLoaded, isTopMapLoaded, weatherLayers, showDateLine, showTimezones]);

    // Force update clip-path when mode or terminator changes
    useEffect(() => {
        if (mapTopContainer.current) {
            mapTopContainer.current.style.pointerEvents = 'none';
            mapTopContainer.current.style.opacity = dayNightMode ? '1' : '0';
        }
        updateClipPath();
    }, [dayNightMode, nightPolygon, isBottomMapLoaded, isTopMapLoaded]);

    const [visibleClocks, setVisibleClocks] = useState([]);
    const updateClocksRef = useRef(null);

    const updateClocks = () => {
        if (!mapBottom.current || !showTimezones) {
            setVisibleClocks([]);
            return;
        }

        try {
            const bounds = mapBottom.current.getBounds();
            const west = bounds.getWest();
            const east = bounds.getEast();
            const mapCenter = mapBottom.current.getCenter();
            
            const minN = Math.ceil(west / 15);
            const maxN = Math.floor(east / 15);
            
            const clocks = [];
            const now = new Date();
            const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

            for (let n = minN; n <= maxN; n++) {
                const lng = 15 * n;
                const projected = mapBottom.current.project([lng, mapCenter.lat]);
                
                if (projected && projected.x >= 0 && projected.x <= window.innerWidth) {
                    // Calculate wrapped offset
                    let offsetHours = n;
                    offsetHours = ((offsetHours + 12) % 24 + 24) % 24 - 12;
                    
                    // Format time (hours only)
                    const tzTime = new Date(utcTime + (offsetHours * 3600000));
                    const hrs = String(tzTime.getHours()).padStart(2, '0');
                    
                    const { letter } = getMilitaryTzInfo(offsetHours);
                    
                    clocks.push({
                        id: `tz-${n}`,
                        x: projected.x,
                        time: hrs,
                        letter
                    });
                }
            }
            
            setVisibleClocks(clocks);
        } catch (err) {
            console.error('Error updating timezone clocks:', err);
        }
    };

    updateClocksRef.current = updateClocks;

    // Update timezone clocks on map interaction and time passage
    useEffect(() => {
        if (!isBottomMapLoaded || !showTimezones) {
            setVisibleClocks([]);
            return;
        }

        const handleUpdate = () => {
            if (updateClocksRef.current) {
                updateClocksRef.current();
            }
        };

        handleUpdate();

        const map = mapBottom.current;
        if (map) {
            map.on('move', handleUpdate);
            map.on('zoom', handleUpdate);
            map.on('render', handleUpdate);
        }

        // Ticking interval
        const interval = setInterval(handleUpdate, 1000);

        return () => {
            if (map) {
                map.off('move', handleUpdate);
                map.off('zoom', handleUpdate);
                map.off('render', handleUpdate);
            }
            clearInterval(interval);
        };
    }, [showTimezones, isBottomMapLoaded]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full bg-[#0b0e14]">
            {/* Bottom Map */}
            <div ref={mapBottomContainer} className="map w-full h-full absolute inset-0" />
            
            {/* Top Map (City lights map representing night) */}
            <div 
                ref={mapTopContainer} 
                className="map w-full h-full absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 top-map-container"
            />

            {/* Timezone Floating Clocks */}
            {showTimezones && (
                <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                    {visibleClocks.map(clock => (
                        <div
                            key={clock.id}
                            style={{
                                position: 'absolute',
                                left: `${clock.x}px`,
                                top: '80px',
                                transform: 'translateX(-50%)',
                            }}
                            className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-md border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col items-center gap-0.5 min-w-[54px]"
                        >
                            <span className="text-[18px] font-mono font-bold text-white tracking-widest drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]">
                                {clock.time}
                            </span>
                            <span className="text-[13px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                                {clock.letter}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
