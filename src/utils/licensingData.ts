import licensingData from '@/src/data/licensing.json';

export interface LicensingAuthority {
    state: string;
    agency_name: string;
    website_url: string;
    phone: string;
    complaint_intake_url: string;
    verify_license_url?: string;
}

// Create a map for faster lookup
const licensingMap = new Map<string, LicensingAuthority>();
(licensingData as LicensingAuthority[]).forEach(auth => {
    // Map full state name to authority
    licensingMap.set(auth.state.toLowerCase(), auth);

    // We also need a way to look up by abbreviation if possible, 
    // but the JSON only has full state names. 
    // We'll rely on the caller to provide the full state name or we can add a helper here.
});

// Helper to map abbreviation to full name (basic map for now, or import from states.ts)
import { ALL_STATES } from '@/src/data/states';

export function getLicensingAuthority(stateIdentifier: string): LicensingAuthority | null {
    if (!stateIdentifier) return null;

    let searchKey = stateIdentifier.toLowerCase();

    // If it's 2 chars, assume abbreviation and find full name
    if (stateIdentifier.length === 2) {
        const stateDef = ALL_STATES.find(s => s.abbreviation.toLowerCase() === searchKey);
        if (stateDef) {
            searchKey = stateDef.name.toLowerCase();
        }
    }

    return licensingMap.get(searchKey) || null;
}
