import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';

export interface FacilityFaq {
  id: string;
  facility_id: string;
  question_text: string;
  answer_text: string;
  is_published: boolean;
  updated_at: string;
}

interface UseFacilityFaqsResult {
  faqs: FacilityFaq[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFacilityFaqs = (facilityId: string): UseFacilityFaqsResult => {
  const [faqs, setFaqs] = useState<FacilityFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFaqs = useCallback(async () => {
    if (!facilityId) {
      setFaqs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('facility_faqs')
        .select('id,facility_id,question_text,answer_text,is_published,updated_at')
        .eq('facility_id', facilityId)
        .eq('is_published', true)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFaqs((data || []) as FacilityFaq[]);
    } catch (err: any) {
      setError(err?.message || 'Unable to load official FAQs right now.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchFaqs();
  }, [fetchFaqs]);

  return { faqs, loading, error, refetch: fetchFaqs };
};

