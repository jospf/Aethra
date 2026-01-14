/**
 * Calculate Stardate based on current date
 * Formula derived from legacy code:
 * 1000 * (year - 2323) + yearProgress * 1000
 */
export function calculateStardate(date = new Date()) {
    const year = date.getUTCFullYear();
    const start = Date.UTC(year, 0, 1);
    const end = Date.UTC(year + 1, 0, 1);
    const yearProgress = (date.getTime() - start) / (end - start);

    // Stardate 0.0 corresponds to Jan 1, 2323
    const stardate = (1000 * (year - 2323) + yearProgress * 1000).toFixed(1);
    return stardate;
}
