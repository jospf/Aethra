import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTerminator } from '../hooks/useTerminator';

export default function Map({ issData }) {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = useState(0);
    const [lat] = useState(0);
    const [zoom] = useState(1.5); // Start zoomed out for global view
    const nightPolygon = useTerminator();

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
            // Night layer
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
                    'fill-opacity': 0.4
                }
            });

            // ISS Orbital Path Source (MultiLineString for segments)
            map.current.addSource('iss-path', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // ISS Orbital Path Layer (Glow)
            map.current.addLayer({
                id: 'iss-path-glow',
                type: 'line',
                source: 'iss-path',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 4,
                    'line-opacity': 0.2,
                    'line-blur': 2
                }
            });

            // ISS Orbital Path Layer
            map.current.addLayer({
                id: 'iss-path-layer',
                type: 'line',
                source: 'iss-path',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 2,
                    'line-dasharray': [2, 1],
                    'line-opacity': 0.8
                }
            });

            // ISS Marker Layer
            map.current.addSource('iss', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Load ISS Icon
            map.current.loadImage('/assets/iss.png', (error, image) => {
                if (error) {
                    console.error('Error loading ISS icon:', error);
                    return;
                }
                if (!map.current.hasImage('iss-icon')) {
                    map.current.addImage('iss-icon', image);
                }

                // Add ISS symbol layer AFTER icon is loaded
                if (!map.current.getLayer('iss-layer')) {
                    map.current.addLayer({
                        id: 'iss-layer',
                        type: 'symbol',
                        source: 'iss',
                        layout: {
                            'icon-image': 'iss-icon',
                            'icon-size': 0.6,
                            'icon-allow-overlap': true
                        }
                    });
                }
            });

            // Glow for ISS
            map.current.addLayer({
                id: 'iss-glow',
                type: 'circle',
                source: 'iss',
                paint: {
                    'circle-radius': 15,
                    'circle-color': '#3b82f6',
                    'circle-opacity': 0.4,
                    'circle-blur': 1
                }
            });
        });

    }, [lng, lat, zoom]);

    useEffect(() => {
        if (map.current && nightPolygon && map.current.getSource('night')) {
            map.current.getSource('night').setData({
                type: 'FeatureCollection',
                features: [nightPolygon]
            });
        }
    }, [nightPolygon]);

    // Update ISS position and path
    useEffect(() => {
        if (map.current && issData) {
            // Update Position
            if (map.current.getSource('iss')) {
                map.current.getSource('iss').setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [issData.longitude, issData.latitude]
                        }
                    }]
                });
            }

            // Update Orbital Path
            if (map.current.getSource('iss-path') && issData.path) {
                map.current.getSource('iss-path').setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'MultiLineString',
                            coordinates: issData.path
                        },
                        properties: {}
                    }]
                });
            }
        }
    }, [issData]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full bg-[#0b0e14]">
            <div ref={mapContainer} className="map w-full h-full" />
        </div>
    );
}
