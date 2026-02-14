import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';

type OperatorPlan = 'free' | 'featured' | 'priority' | 'lead_suite';

interface UseOperatorPlanResult {
  plan: OperatorPlan;
  isPremium: boolean;
  loading: boolean;
}

export const useOperatorPlan = (): UseOperatorPlanResult => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<OperatorPlan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) {
        if (mounted) {
          setPlan('free');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('user_profiles')
        .select('plan')
        .eq('id', user.id)
        .maybeSingle();

      if (!mounted) return;
      const resolvedPlan = (data?.plan || 'free') as OperatorPlan;
      setPlan(resolvedPlan);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const isPremium = useMemo(
    () => plan === 'featured' || plan === 'priority' || plan === 'lead_suite',
    [plan]
  );

  return { plan, isPremium, loading };
};

