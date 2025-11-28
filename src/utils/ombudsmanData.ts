import ombudsmanData from '@/src/data/ombudsman.json';

export interface OmbudsmanProgram {
    state: string;
    program_name: string;
    phone: string;
    email: string | null;
    website: string;
    address: string;
}

const ombudsmanMap: Record<string, OmbudsmanProgram> = ombudsmanData as Record<string, OmbudsmanProgram>;

export function getOmbudsman(state: string): OmbudsmanProgram | null {
    if (!state) return null;
    const stateCode = state.toUpperCase();
    return ombudsmanMap[stateCode] || null;
}
