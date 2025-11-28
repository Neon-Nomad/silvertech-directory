
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

interface GeocodeResult {
    lat: number;
    lng: number;
}

const CACHE_KEY_PREFIX = 'silvertech_geo_cache_';

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address) return null;

    // Check cache first
    const cacheKey = CACHE_KEY_PREFIX + address.replace(/\s+/g, '_').toLowerCase();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        try {
            const { lat, lng, timestamp } = JSON.parse(cached);
            // Cache for 30 days
            if (Date.now() - timestamp < 30 * 24 * 60 * 60 * 1000) {
                return { lat, lng };
            }
        } catch (e) {
            localStorage.removeItem(cacheKey);
        }
    }

    try {
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
        });

        const response = await fetch(`${NOMINATIM_BASE_URL}?${params.toString()}`, {
            headers: {
                'User-Agent': 'SilverTechDirectory/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };

            // Cache the result
            localStorage.setItem(cacheKey, JSON.stringify({
                ...result,
                timestamp: Date.now()
            }));

            return result;
        }
    } catch (error) {
        console.warn('Geocoding error:', error);
    }

    return null;
}
