export interface RankedFacility {
    id: string;
    name: string;
    address: string;
    address_line1?: string; // Added to match DB
    city: string;
    state: string;
    postal_code: string;
    phone: string | null;
    capacity: number;
    verified: boolean;
    price: string | null;
    image: string | null;
    score: number;
    type: string;
}

export const rankFacilities = (facilities: any[]): RankedFacility[] => {
    if (!facilities || facilities.length === 0) return [];

    // Map to internal structure and calculate score
    const scored = facilities.map((f) => {
        let score = 0;

        // CRITERIA 1: Verified Status (Huge Boost)
        // Verified facilities should almost always be at the top
        if (f.verified) score += 100;

        // CRITERIA 2: Content Completeness
        // Facilities with images get a boost
        if (f.image) score += 20;
        // Facilities with price get a boost
        if (f.price && f.price !== 'Call for Pricing') score += 10;
        // Facilities with phone number get a small boost
        if (f.phone) score += 5;

        // CRITERIA 3: Capacity (Proxy for established business)
        // Cap the boost at 10 points
        const capacity = f.capacity || 0;
        score += Math.min(capacity, 50) / 5; // Max 10 points for 50+ beds

        // CRITERIA 4: Random Stability (Deterministic Tie-Breaker)
        // We use the char code of the first letter to deterministically break ties
        // so the list doesn't jitter on reload.
        const tieBreaker = f.name.charCodeAt(0) / 1000;
        score += tieBreaker;

        return {
            ...f,
            score
        };
    });

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
};
