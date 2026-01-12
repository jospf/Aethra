import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function Map() {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const [lng] = useState(-122.6784); // Portland, OR default
    const [lat] = useState(45.5152);
    const [zoom] = useState(3);

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

    }, [lng, lat, zoom]);

    return (
        <div className="map-wrap absolute inset-0 w-full h-full">
            <div ref={mapContainer} className="map w-full h-full" />
        </div>
    );
}
