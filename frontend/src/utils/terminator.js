import SunCalc from 'suncalc';

/**
 * Find the latitude where the sun is at the horizon for a given longitude
 */
function findTerminatorLatitude(lng, date, wrapViaNorth) {
    let minLat = -85; // Clamped for Mercator
    let maxLat = 85;

    const minAlt = SunCalc.getPosition(date, minLat, lng).altitude;
    const maxAlt = SunCalc.getPosition(date, maxLat, lng).altitude;

    // Handle cases where the longitude is entirely in day or night
    if ((minAlt < 0 && maxAlt < 0)) return wrapViaNorth ? -85 : 85;
    if ((minAlt > 0 && maxAlt > 0)) return wrapViaNorth ? 85 : -85;

    // Binary search for the zero crossing
    for (let i = 0; i < 20; i++) {
        const midLat = (minLat + maxLat) / 2;
        const altitude = SunCalc.getPosition(date, midLat, lng).altitude;

        if (Math.abs(altitude) < 0.0001) return midLat;

        const currentMinAlt = SunCalc.getPosition(date, minLat, lng).altitude;
        if ((currentMinAlt < 0 && altitude > 0) || (currentMinAlt > 0 && altitude < 0)) {
            maxLat = midLat;
        } else {
            minLat = midLat;
        }
    }

    return (minLat + maxLat) / 2;
}

/**
 * Calculate terminator line coordinates
 */
export function calculateTerminator(date = new Date(), wrapViaNorth) {
    const points = [];
    const step = 2; // High resolution (181 points)

    for (let lng = -180; lng <= 180; lng += step) {
        const lat = findTerminatorLatitude(lng, date, wrapViaNorth);
        points.push([lng, lat]);
    }

    return points;
}

/**
 * Create a GeoJSON polygon representing the night side of Earth
 */
export function createNightPolygon(date = new Date()) {
    // Check illumination at the North Pole to determine wrapping direction
    const northPoleSun = SunCalc.getPosition(date, 89.9, 0);
    const wrapViaNorth = northPoleSun.altitude < 0;

    // 1. Calculate terminator line
    const terminator = calculateTerminator(date, wrapViaNorth);

    // 2. Wrap via the pole that is in night
    const wrapLat = wrapViaNorth ? 85 : -85;

    // 3. Construct the polygon: Left Edge -> Terminator Path -> Right Edge -> Pole Path
    // MapLibre handle -180 to 180 transitions better with distinct edge points
    const polygon = [
        ...terminator,
        [180, wrapLat],
        [-180, wrapLat],
        terminator[0] // Close the loop
    ];

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [polygon]
        },
        properties: {
            timestamp: date.toISOString(),
            wrapViaNorth
        }
    };
}

/**
 * Create a GeoJSON polygon representing the day side of Earth (inverse of night)
 */
export function createDayPolygon(date = new Date()) {
    // Check illumination at the North Pole to determine wrapping direction
    const northPoleSun = SunCalc.getPosition(date, 89.9, 0);
    const wrapViaNorth = northPoleSun.altitude < 0;

    // 1. Calculate terminator line
    const terminator = calculateTerminator(date, wrapViaNorth);

    // 2. Wrap via the pole that is in DAYLIGHT (opposite of night)
    const wrapLat = wrapViaNorth ? -85 : 85;

    // 3. Construct the polygon for the day side
    const polygon = [
        ...terminator,
        [180, wrapLat],
        [-180, wrapLat],
        terminator[0] // Close the loop
    ];

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [polygon]
        },
        properties: {
            timestamp: date.toISOString(),
            wrapViaNorth
        }
    };
}
