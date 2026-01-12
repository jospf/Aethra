import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTerminator } from '../hooks/useTerminator';

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = useState(-122.6784); // Portland, OR default
    const [lat] = useState(45.5152);
    const [zoom] = useState(3);
    const nightPolygon = useTerminator();

    useEffect(() => {
        if (map.current) return; // initialize map only once

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
            center: [lng, lat],
            zoom: zoom,
            attributionControl: false
        });

        map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');
        map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

        // Wait for map to load before adding terminator layer
        map.current.on('load', () => {
            // Add terminator source
            map.current.addSource('night', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Add terminator layer
            map.current.addLayer({
                id: 'night-layer',
                type: 'fill',
                source: 'night',
                paint: {
                    'fill-color': '#000000',
                    'fill-opacity': 0.3
                }
            });
        });

    }, [lng, lat, zoom]);

    // Update terminator when nightPolygon changes
    useEffect(() => {
        if (map.current && nightPolygon && map.current.getSource('night')) {
            map.current.getSource('night').setData({
                type: 'FeatureCollection',
                features: [nightPolygon]
            });
        }
    }, [nightPolygon]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full">
            <div ref={mapContainer} className="map w-full h-full" />
        </div>
    );
}
