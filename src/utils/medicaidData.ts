import medicaidData from '../data/medicaid_waivers.json';

export interface MedicaidWaiver {
    state: string;
    program_name: string;
    type: string;
    description: string;
    status: 'Open' | 'Waitlist' | 'Closed';
    care_services: string[];
    financial_eligibility: {
        income_limit: string;
        asset_limit: string;
        notes?: string;
    };
    functional_eligibility: string[];
    application_process: string[];
    contact: {
        phone: string;
        website: string;
    };
}

export const getMedicaidWaiver = (stateIdentifier: string): MedicaidWaiver | null => {
    if (!stateIdentifier) return null;

    const normalizedState = stateIdentifier.toLowerCase().trim();

    // Simple state mapping
    const stateMap: Record<string, string> = {
        'indiana': 'IN',
        'california': 'CA',
        'texas': 'TX',
        'florida': 'FL',
        'arizona': 'AZ'
    };

    const abbr = stateMap[normalizedState] || stateIdentifier.toUpperCase();

    const waiver = medicaidData.medicaid_waivers.find(
        (w) => w.state === abbr
    );

    return waiver ? (waiver as MedicaidWaiver) : null;
};
