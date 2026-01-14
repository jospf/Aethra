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

            // ISS Marker Layer
            map.current.addSource('iss', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
            });

            // Glow for ISS
            map.current.addLayer({
                id: 'iss-glow',
                type: 'circle',
                source: 'iss',
                paint: {
                    'circle-radius': 12,
                    'circle-color': '#3b82f6',
                    'circle-opacity': 0.3,
                    'circle-blur': 1
                }
            });

            map.current.addLayer({
                id: 'iss-layer',
                type: 'circle',
                source: 'iss',
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#fff',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#3b82f6'
                }
            });

            if (nightPolygon) {
                map.current.getSource('night').setData({
                    type: 'FeatureCollection',
                    features: [nightPolygon]
                });
            }
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

    // Update ISS position
    useEffect(() => {
        if (map.current && issData && map.current.getSource('iss')) {
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
    }, [issData]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full">
            <div ref={mapContainer} className="map w-full h-full" />
        </div>
    );
}
