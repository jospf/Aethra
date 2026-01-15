import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTerminator } from '../hooks/useTerminator';

export default function Map({
    layers = { satellite: true, night: true, moon: true },
    moonData,
    focusLocation
}) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = useState(0);
    const [lat] = useState(0);
    const [zoom] = useState(1.5); // Start zoomed out for global view
    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const nightPolygon = useTerminator();

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
                sources: {
                    'satellite': {
                        type: 'raster',
                        tiles: [
                            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                        ],
                        tileSize: 256,
                        attribution: '© Esri, © USGS, © NOAA'
                    }
                },
                layers: [
                    {
                        id: 'satellite-layer',
                        type: 'raster',
                        source: 'satellite',
                        minzoom: 0,
                        maxzoom: 19
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
            // 1. NIGHT LAYER
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
                } else {
                    console.log("moon-layer already exists.");
                }
            };

            loadMoonImages();
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
    }, [nightPolygon, isMapLoaded]);

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

    // Handle Layer Toggles
    useEffect(() => {
        if (!map.current) return;

        const setVisibility = (id, visible) => {
            if (map.current.getLayer(id)) {
                map.current.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
            }
        };

        setVisibility('satellite-layer', layers.satellite);
        setVisibility('night-layer', layers.night);
        setVisibility('moon-layer', layers.moon);
        setVisibility('moon-glow', layers.moon);

    }, [layers, moonData, isMapLoaded]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full bg-[#0b0e14]">
            <div ref={mapContainer} className="map w-full h-full" />
        </div>
    );
}
