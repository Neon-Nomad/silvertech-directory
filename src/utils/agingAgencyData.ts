import agingAgenciesData from '../data/aging_agencies.json';

export interface AgingAgency {
    state: string;
    program_name: string;
    description: string;
    services_provided: string[];
    eligibility_criteria: string | string[];
    why_it_matters: string[];
    contact: {
        phone: string;
        website: string;
        find_local_url: string;
    };
}

export const getAgingAgency = (stateIdentifier: string): AgingAgency | null => {
    if (!stateIdentifier) return null;

    const normalizedState = stateIdentifier.toLowerCase().trim();

    // Handle full state names by mapping to abbreviations if needed, 
    // but currently our data uses abbreviations.
    // Simple mapping for now, can be expanded.
    const stateMap: Record<string, string> = {
        'indiana': 'IN',
        'california': 'CA',
        'texas': 'TX',
        'florida': 'FL',
        'arizona': 'AZ'
    };

    const abbr = stateMap[normalizedState] || stateIdentifier.toUpperCase();

    const agency = agingAgenciesData.aging_agencies.find(
        (a) => a.state === abbr
    );

    return agency || null;
};
