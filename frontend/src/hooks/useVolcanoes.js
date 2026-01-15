import { useState, useEffect } from 'react';

// Fallback/MVP list of continuously active or significant erupting volcanoes
// Coordinates approximate.
const ACTIVE_VOLCANOES = {
    type: "FeatureCollection",
    features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [-155.6027, 19.4217] }, properties: { name: "Mauna Loa", location: "Hawaii", status: "Active" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [-155.287, 19.407] }, properties: { name: "Kilauea", location: "Hawaii", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [14.994, 37.751] }, properties: { name: "Etna", location: "Italy", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [15.213, 38.789] }, properties: { name: "Stromboli", location: "Italy", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [-19.62, 63.63] }, properties: { name: "Katla", location: "Iceland", status: "Restless" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [-22.17, 63.90] }, properties: { name: "Fagradalsfjall", location: "Iceland", status: "Active" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [110.446, -7.541] }, properties: { name: "Merapi", location: "Indonesia", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [123.956, 13.257] }, properties: { name: "Mayon", location: "Philippines", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [130.657, 31.593] }, properties: { name: "Sakurajima", location: "Japan", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [-98.62, 19.02] }, properties: { name: "Popocatépetl", location: "Mexico", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [-78.446, -0.677] }, properties: { name: "Cotopaxi", location: "Ecuador", status: "Restless" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [169.444, -19.527] }, properties: { name: "Yasur", location: "Vanuatu", status: "Erupting" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [3.9, -77.53] }, properties: { name: "Erebus", location: "Antarctica", status: "Erupting" } }
    ]
};

export function useVolcanoes() {
    // For MVP/V1 we are using a curated static list derived from GVP major active volcanoes.
    // A future enhancement would be to fetch from a live GVP/USGS feed if one becomes easily available without CORS/Auth complexities.
    const [volcanoData, setVolcanoData] = useState(ACTIVE_VOLCANOES);

    return { volcanoData, loading: false, error: null };
}
