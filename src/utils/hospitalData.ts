export interface Hospital {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    type: string;
    ownership: string;
    emergency_services: string; // "Yes" or "No"
    latitude: number | null;
    longitude: number | null;
}

export interface HealthcareScore {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    score: number; // 0-100
    details: {
        nearestErDistance: number; // in miles
        erHospitalCount: number; // within 10 miles
        totalHospitalCount: number; // within 10 miles
    };
}

// Cache for loaded state data to avoid re-fetching
const hospitalCache: Record<string, Record<string, Hospital[]>> = {};

export async function fetchHospitalsForState(state: string): Promise<Record<string, Hospital[]> | null> {
    const stateCode = state.toUpperCase();
    if (hospitalCache[stateCode]) {
        return hospitalCache[stateCode];
    }

    try {
        const response = await fetch(`/data/hospitals/${stateCode}.json`);
        if (!response.ok) {
            console.warn(`Failed to load hospitals for state: ${stateCode}`);
            return null;
        }
        const data = await response.json();
        hospitalCache[stateCode] = data;
        return data;
    } catch (error) {
        console.error(`Error fetching hospitals for ${stateCode}:`, error);
        return null;
    }
}

export async function getHospitalsByCity(state: string, city: string): Promise<Hospital[]> {
    const stateData = await fetchHospitalsForState(state);
    if (!stateData) return [];

    // Case-insensitive match for city
    const cityKey = Object.keys(stateData).find(k => k.toLowerCase() === city.toLowerCase());
    return cityKey ? stateData[cityKey] : [];
}

export async function getAllHospitalsInState(state: string): Promise<Hospital[]> {
    const stateData = await fetchHospitalsForState(state);
    if (!stateData) return [];
    return Object.values(stateData).flat();
}

// Haversine formula to calculate distance in miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ... (previous code)

export async function getNearestHospital(
    lat: number,
    lng: number,
    state: string,
    city?: string, // Added city parameter
    requireEr: boolean = false
): Promise<{ hospital: Hospital; distance: number } | null> {
    const allHospitals = await getAllHospitalsInState(state);

    let nearest: { hospital: Hospital; distance: number } | null = null;
    let minDistance = Infinity;

    // 1. Try distance-based search if coordinates exist
    for (const hospital of allHospitals) {
        if (hospital.latitude !== null && hospital.longitude !== null) {
            if (requireEr && hospital.emergency_services !== 'Yes') continue;

            const distance = calculateDistance(lat, lng, hospital.latitude, hospital.longitude);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = { hospital, distance };
            }
        }
    }

    // 2. Fallback: If no nearest found (or data lacks coords), look for hospital in the same city
    if (!nearest && city) {
        const cityHospital = allHospitals.find(h =>
            h.city.toLowerCase() === city.toLowerCase() &&
            (!requireEr || h.emergency_services === 'Yes')
        );

        if (cityHospital) {
            // We don't know exact distance, but it's in the same city. 
            // Return a proxy distance (e.g., 3 miles) to ensure it shows up.
            return { hospital: cityHospital, distance: 3.0 };
        }
    }

    return nearest;
}

export async function calculateHealthcareScore(
    lat: number,
    lng: number,
    state: string,
    city?: string // Added city parameter
): Promise<HealthcareScore> {
    const allHospitals = await getAllHospitalsInState(state);

    // 1. Filter hospitals with coordinates
    const validHospitals = allHospitals.filter(h => h.latitude !== null && h.longitude !== null);

    let nearestErDistance = 999;
    let erHospitalCount = 0;
    let totalHospitalCount = 0;

    // 2. Calculate based on coordinates
    for (const h of validHospitals) {
        const dist = calculateDistance(lat, lng, h.latitude!, h.longitude!);

        if (dist <= 10) {
            totalHospitalCount++;
            if (h.emergency_services === 'Yes') {
                erHospitalCount++;
            }
        }

        if (h.emergency_services === 'Yes' && dist < nearestErDistance) {
            nearestErDistance = dist;
        }
    }

    // 3. Fallback: If no coordinate data found, check for hospitals in the same city
    if (validHospitals.length === 0 && city) {
        const cityHospitals = allHospitals.filter(h => h.city.toLowerCase() === city.toLowerCase());

        if (cityHospitals.length > 0) {
            totalHospitalCount = cityHospitals.length;
            erHospitalCount = cityHospitals.filter(h => h.emergency_services === 'Yes').length;

            // Assume if there is a hospital in the city, it's reasonably close (e.g. < 5 miles)
            if (erHospitalCount > 0) {
                nearestErDistance = 3.0;
            } else if (totalHospitalCount > 0) {
                nearestErDistance = 5.0; // Non-ER hospital
            }
        }
    }

    // Scoring Logic
    let score = 0;

    // Distance to ER (Max 60 points)
    if (nearestErDistance < 2) score += 60;
    else if (nearestErDistance < 5) score += 50;
    else if (nearestErDistance < 10) score += 40;
    else if (nearestErDistance < 15) score += 30;
    else if (nearestErDistance < 20) score += 20;
    else if (nearestErDistance < 999) score += 10; // Any found ER
    else score += 0;

    // Density (Max 40 points)
    score += Math.min(erHospitalCount * 5, 20);
    score += Math.min(totalHospitalCount * 2, 20);

    // Grade
    let grade: HealthcareScore['grade'] = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return {
        grade,
        score,
        details: {
            nearestErDistance,
            erHospitalCount,
            totalHospitalCount
        }
    };
}
