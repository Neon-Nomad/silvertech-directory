import { CITY_COORDINATES } from '@/src/data/city_coordinates';

// Haversine formula to calculate distance between two points
const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
};

export const findNearestCity = (latitude: number, longitude: number): string | null => {
    let nearestCity: string | null = null;
    let minDistance = Infinity;

    Object.entries(CITY_COORDINATES).forEach(([citySlug, [cityLat, cityLng]]) => {
        const distance = getDistanceFromLatLonInKm(latitude, longitude, cityLat, cityLng);
        if (distance < minDistance) {
            minDistance = distance;
            nearestCity = citySlug;
        }
    });

    // Convert slug to readable name (e.g., "san-francisco" -> "San Francisco")
    if (nearestCity) {
        return (nearestCity as string)
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    return null;
};
