import { useState, useEffect } from 'react';

export function useISS() {
    const [issData, setIssData] = useState(null);

    useEffect(() => {
        const fetchISS = async () => {
            try {
                const response = await fetch('/api/iss');
                if (response.ok) {
                    const data = await response.json();
                    setIssData(data);
                }
            } catch (error) {
                console.error('Failed to fetch ISS data:', error);
            }
        };

        fetchISS(); // Initial fetch
        const interval = setInterval(fetchISS, 10000); // Poll every 10 seconds

        return () => clearInterval(interval);
    }, []);

    return issData;
}
