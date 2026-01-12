import SunCalc from 'suncalc';

/**
 * Find the latitude where the sun is at the horizon for a given longitude
 */
function findTerminatorLatitude(lng, date) {
    let minLat = -90;
    let maxLat = 90;

    // Get sun altitude at both extremes
    const minAlt = SunCalc.getPosition(date, minLat, lng).altitude;
    const maxAlt = SunCalc.getPosition(date, maxLat, lng).altitude;

    // If sun is below horizon at both poles, or above at both poles, 
    // this longitude is entirely in night or day
    if ((minAlt < 0 && maxAlt < 0) || (minAlt > 0 && maxAlt > 0)) {
        // Return the latitude closest to zero altitude
        return Math.abs(minAlt) < Math.abs(maxAlt) ? minLat : maxLat;
    }

    // Binary search for the zero crossing
    for (let i = 0; i < 25; i++) {
        const midLat = (minLat + maxLat) / 2;
        const altitude = SunCalc.getPosition(date, midLat, lng).altitude;

        if (Math.abs(altitude) < 0.0001) {
            return midLat;
        }

        // Check which half contains the zero crossing
        const minAltCurrent = SunCalc.getPosition(date, minLat, lng).altitude;
        if ((minAltCurrent < 0 && altitude > 0) || (minAltCurrent > 0 && altitude < 0)) {
            // Zero crossing is in the lower half
            maxLat = midLat;
        } else {
            // Zero crossing is in the upper half
            minLat = midLat;
        }
    }

    return (minLat + maxLat) / 2;
}

/**
 * Calculate terminator line coordinates
 */
export function calculateTerminator(date = new Date()) {
    const points = [];
    const step = 2; // degrees

    for (let lng = -180; lng <= 180; lng += step) {
        const lat = findTerminatorLatitude(lng, date);
        points.push([lng, lat]);
    }

    return points;
}

/**
 * Create a GeoJSON polygon representing the night side of Earth
 */
export function createNightPolygon(date = new Date()) {
    const terminator = calculateTerminator(date);

    if (terminator.length < 2) return null;

    // Check which hemisphere is in night
    // Test at the equator, middle of the Atlantic (0°, 0°)
    const testSunPos = SunCalc.getPosition(date, 0, 0);
    const atlanticIsDay = testSunPos.altitude > 0;

    // Build the night polygon by following world edges
    // The polygon should: follow terminator → follow world edge to pole → cross pole → follow other edge back → close
    const polygon = [...terminator];

    const lastPoint = terminator[terminator.length - 1]; // At lng=180
    const firstPoint = terminator[0]; // At lng=-180

    // Add points along the world edges to prevent straight lines
    const edgeStep = 10; // degrees of latitude between edge points

    if (atlanticIsDay) {
        // Atlantic is day, so night is in Americas (west) - wrap via SOUTH pole (was north)
        // Add points going DOWN the eastern edge from terminator to south pole
        for (let lat = Math.floor(lastPoint[1] / edgeStep) * edgeStep; lat > -90; lat -= edgeStep) {
            polygon.push([180, lat]);
        }
        polygon.push([180, -90]);     // South-east corner
        polygon.push([-180, -90]);    // Cross to south-west corner

        // Add points going UP the western edge from south pole to terminator
        for (let lat = -90 + edgeStep; lat < firstPoint[1]; lat += edgeStep) {
            polygon.push([-180, lat]);
        }
        polygon.push(firstPoint);     // Close to start
    } else {
        // Atlantic is night, so night is in Europe/Asia (east) - wrap via NORTH pole (was south)
        // Add points going UP the eastern edge from terminator to north pole
        for (let lat = Math.ceil(lastPoint[1] / edgeStep) * edgeStep; lat < 90; lat += edgeStep) {
            polygon.push([180, lat]);
        }
        polygon.push([180, 90]);      // North-east corner
        polygon.push([-180, 90]);     // Cross to north-west corner

        // Add points going DOWN the western edge from north pole to terminator
        for (let lat = 90 - edgeStep; lat > firstPoint[1]; lat -= edgeStep) {
            polygon.push([-180, lat]);
        }
        polygon.push(firstPoint);     // Close to start
    }

    return {
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [polygon]
        },
        properties: {
            timestamp: date.toISOString(),
            atlanticIsDay: atlanticIsDay
        }
    };
}
