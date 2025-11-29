import { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface RegulatoryContent {
    state_slug: string;
    medicaid_content: string;
    licensing_content: string;
    ombudsman_content: string;
    complaints_content: string;
    veterans_content: string;
    contacts_json: {
        licensing?: { name: string; phone: string; website?: string };
        ombudsman?: { name: string; phone: string; website?: string };
        medicaid?: { name: string; phone: string; website?: string };
        elderAbuse?: { name: string; phone: string };
        veterans?: { name: string; phone: string; website?: string };
    };
}

export function useRegulatoryContent(stateSlug: string | undefined) {
    const [data, setData] = useState<RegulatoryContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!stateSlug) {
            setLoading(false);
            return;
        }

        async function fetchContent() {
            try {
                setLoading(true);
                // Convert kebab-case slug (new-jersey) to snake_case (new_jersey) for DB matching
                const dbSlug = stateSlug.replace(/-/g, '_');

                const { data, error } = await supabase
                    .from('regulatory_content')
                    .select('*')
                    .eq('state_slug', dbSlug)
                    .single();

                if (error) throw error;
                setData(data);
            } catch (err) {
                console.error('Error fetching regulatory content:', err);
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }

        fetchContent();
    }, [stateSlug]);

    return { data, loading, error };
}
