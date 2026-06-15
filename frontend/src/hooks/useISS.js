import { useState, useEffect } from 'react';

export function useISS() {
    const [issData, setIssData] = useState(null);
    const [issTrack, setIssTrack] = useState(null);

    useEffect(() => {
        const fetchISS = async () => {
            try {
                const response = await fetch(`/api/iss?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    setIssData(data);
                }
            } catch (error) {
                console.error('Failed to fetch ISS data:', error);
            }
        };

        const fetchTrack = async () => {
            try {
                const response = await fetch(`/api/iss/track?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    setIssTrack(data);
                }
            } catch (error) {
                console.error('Failed to fetch ISS track:', error);
            }
        };

        fetchISS(); // Initial fetch
        fetchTrack(); // Initial track fetch

        const intervalISS = setInterval(fetchISS, 10000); // Poll every 10 seconds
        const intervalTrack = setInterval(fetchTrack, 60000); // Poll track every 60 seconds

        return () => {
            clearInterval(intervalISS);
            clearInterval(intervalTrack);
        };
    }, []);

    return { issData, issTrack };
}
