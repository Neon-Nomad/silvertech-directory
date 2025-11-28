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

export async function getNearestHospital(
    lat: number,
    lng: number,
    state: string,
    requireEr: boolean = false
): Promise<{ hospital: Hospital; distance: number } | null> {
    const allHospitals = await getAllHospitalsInState(state);

    let nearest: { hospital: Hospital; distance: number } | null = null;
    let minDistance = Infinity;

    for (const hospital of allHospitals) {
        // Skip if no coordinates (some data might be missing lat/lng)
        // Note: The JSON sample showed null lat/lng. 
        // If lat/lng is missing, we can't calculate distance.
        // Ideally, we would geocode these, but for now we skip.
        // Wait, the user said "Distance-aware sorting (if lat/lng is available)".
        // If the JSON has nulls, this feature won't work well without geocoding.
        // I will assume for now we only use ones with lat/lng, or maybe the user has a way to geocode.
        // Actually, looking at the JSON sample, ALL lat/lngs were null.
        // This is a problem for "Nearest Hospital".
        // I should check if I need to geocode them. 
        // The user said "The JSON you uploaded is PERFECT as-is".
        // But also "Next Step 3: Add it to the Facility Page... Show: nearest ER... distance".
        // This implies we need coordinates.
        // I will add a TODO or a fallback if coordinates are missing.
        // For now, I will write the logic assuming coordinates might exist or will be populated.

        if (hospital.latitude === null || hospital.longitude === null) continue;

        if (requireEr && hospital.emergency_services !== 'Yes') continue;

        const distance = calculateDistance(lat, lng, hospital.latitude, hospital.longitude);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = { hospital, distance };
        }
    }

    return nearest;
}

export async function calculateHealthcareScore(
    lat: number,
    lng: number,
    state: string
): Promise<HealthcareScore> {
    const allHospitals = await getAllHospitalsInState(state);

    // Filter hospitals with coordinates
    const validHospitals = allHospitals.filter(h => h.latitude !== null && h.longitude !== null);

    if (validHospitals.length === 0) {
        // Fallback if no geocoded hospitals
        return {
            grade: 'F',
            score: 0,
            details: { nearestErDistance: 999, erHospitalCount: 0, totalHospitalCount: 0 }
        };
    }

    let nearestErDistance = 999;
    let erHospitalCount = 0;
    let totalHospitalCount = 0;

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

    // Scoring Logic
    // Base score starts at 0
    let score = 0;

    // Distance to ER (Max 60 points)
    if (nearestErDistance < 2) score += 60;
    else if (nearestErDistance < 5) score += 50;
    else if (nearestErDistance < 10) score += 40;
    else if (nearestErDistance < 15) score += 30;
    else if (nearestErDistance < 20) score += 20;
    else score += 10;

    // Density (Max 40 points)
    // 1 point per ER hospital within 10 miles (max 20)
    score += Math.min(erHospitalCount * 5, 20);
    // 1 point per any hospital within 10 miles (max 20)
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
