import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Calendar, DollarSign, Info, Mail, Phone, Search, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { useOperatorPlan } from '@/src/hooks/useOperatorPlan';
import {
  getMetric,
  getInsufficientDataPlaceholder,
  getMetricConfidenceThreshold,
  getMetricTrustLabel,
  getRoiGuardrailsPercent,
} from '@/src/config/metricsDictionary';
import { formatAsOfLabel, formatRelativeTime } from '@/src/utils/timeFormatting';
import { trackActivationEvent, type PlanTier } from '@/src/config/activationEvents';
import { getActivationSessionId } from '@/src/utils/activationSession';

type FunnelRange = 'week' | 'month' | 'all';

type FunnelData = {
  impressions: number;
  engagement: number;
  intent: number;
  conversions: number;
  prev_impressions: number;
  prev_engagement: number;
  prev_intent: number;
  prev_conversions: number;
  phone_reveals: number;
  tour_requests: number;
  directions: number;
  comparisons: number;
};

type ProfileHealthRow = {
  facility_id: string;
  has_photos: boolean;
  has_care_types: boolean;
  has_phone: boolean;
  has_verified_phone: boolean;
  has_website_url: boolean;
  has_licensing: boolean;
  qa_response_rate: number;
};

type LeadSignal = {
  id: string;
  facility_id: string;
  created_at: string;
  event_type: 'phone_reveal' | 'directions_clicked' | 'comparison_added' | 'faq_viewed' | 'page_view' | 'schedule_tour';
  facilities?: {
    name?: string;
    city?: string;
  } | null;
};

type LeadRow = {
  id: string;
  facility_id: string | null;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  message: string | null;
  move_in_timeframe: string | null;
  created_at: string;
  source?: string;
  requested_location?: string | null;
  care_type?: string | null;
  budget?: string | null;
  facilities?: { name?: string } | null;
};

const eventCopy: Record<LeadSignal['event_type'], string> = {
  phone_reveal: 'A family revealed your phone number',
  directions_clicked: 'A family clicked directions',
  comparison_added: 'A family added you to comparison',
  faq_viewed: 'A family viewed your Q&A',
  page_view: 'A family viewed your listing',
  schedule_tour: 'A family requested a tour',
};

const INTENT_WEIGHTS = {
  schedule_tour: 1.0,
  phone_reveal: 0.35,
  directions_clicked: 0.25,
  comparison_added: 0.20,
};

const ROI_GUARDRAILS = getRoiGuardrailsPercent();
const ROI_AVG_MONTHLY_RATE = 4500;

const KPI_TRUST_LABELS = {
  family_journey: getMetricTrustLabel('family_journey', 'Session-deduped family journey based on verified lead events across your owned facilities.'),
  roi_estimated_impact: getMetricTrustLabel('roi_estimated_impact', 'Based on your custom baseline and average monthly rate.'),
  profile_completeness: getMetricTrustLabel('profile_completeness', 'A measure of how detailed your facility information is for families.'),
} as const;

const METHOD_HELP_ARTICLE_BY_METRIC: Record<string, string> = {
  family_journey: 'leads-conversion-funnel-playbook',
  roi_estimated_impact: 'leads-roi-methodology',
  profile_completeness: 'listings-profile-health-checklist',
};

const MethodologyTrigger: React.FC<{ metricKey: string; fallbackLabel: string; onViewed?: (metricKey: string) => void }> = ({ metricKey, fallbackLabel, onViewed }) => {
  const metric = getMetric(metricKey);
  const displayName = metric?.display_name || 'Methodology';
  const trustLabel = metric?.trust_label || fallbackLabel;
  const helpSlug = METHOD_HELP_ARTICLE_BY_METRIC[metricKey] || 'help-common-fixes-index';

  return (
    <details className="relative group" onToggle={(event) => {
      const target = event.currentTarget as HTMLDetailsElement;
      if (target.open) onViewed?.(metricKey);
    }}>
      <summary className="list-none cursor-pointer text-slate-400 hover:text-slate-600 transition-colors" aria-label="How is this calculated?">
        <Info className="w-3.5 h-3.5" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-slate-200 bg-white p-3 text-left shadow-lg">
        <p className="text-xs font-semibold text-slate-900">{displayName}</p>
        <p className="mt-1 text-xs text-slate-600">{trustLabel}</p>
        <a
          href={`/dashboard/help#${helpSlug}`}
          className="mt-2 inline-flex text-[11px] font-medium text-primary-700 hover:text-primary-800 underline"
        >
          Open full methodology
        </a>
      </div>
    </details>
  );
};

const computeHealthScore = (row: ProfileHealthRow): number => {
  let score = 0;
  if (row.has_photos) score += 20;
  if (row.has_care_types) score += 15;
  if (row.has_phone) score += 10;
  if (row.has_verified_phone) score += 10;
  if (row.has_website_url) score += 10;
  if (row.has_licensing) score += 10;
  score += Math.round(Number(row.qa_response_rate || 0) * 25);
  return score;
};

export const LeadsView: React.FC = () => {
  const { user } = useAuth();
  const { plan, isPremium, loading: planLoading } = useOperatorPlan();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [noResultsLeads, setNoResultsLeads] = useState<LeadRow[]>([]);
  const [signals, setSignals] = useState<LeadSignal[]>([]);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [funnelRange, setFunnelRange] = useState<FunnelRange>('month');
  const [healthRows, setHealthRows] = useState<ProfileHealthRow[]>([]);
  const [brokerBaselinePercent, setBrokerBaselinePercent] = useState<number>(() => {
    if (typeof window === 'undefined') return ROI_GUARDRAILS.marketDefault;
    const stored = window.localStorage.getItem('std_roi_baseline_pct');
    const parsed = stored ? Number(stored) : ROI_GUARDRAILS.marketDefault;
    return Number.isFinite(parsed)
      ? Math.min(ROI_GUARDRAILS.hardMax, Math.max(ROI_GUARDRAILS.hardMin, parsed))
      : ROI_GUARDRAILS.marketDefault;
  });
  const [benchmark, setBenchmark] = useState<{ your_signals_week: number; peer_avg_week: number } | null>(null);
  const [interestedLeadIds, setInterestedLeadIds] = useState<Set<string>>(new Set());
  const [submittingInterestFor, setSubmittingInterestFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [kpiDataAsOf, setKpiDataAsOf] = useState<string>(new Date().toISOString());
  const trackedEmptyStateViews = React.useRef<Set<string>>(new Set());

  const resolvePlanTier = (): PlanTier => {
    if (plan === 'free') return 'free';
    if (isPremium) return 'premium';
    return 'unknown';
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('std_roi_baseline_pct', String(brokerBaselinePercent));
  }, [brokerBaselinePercent]);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user || planLoading) return;
      try {
        const { data: facilities } = await supabase
          .from('facilities')
          .select('id')
          .eq('owner_id', user.id);

        if (!facilities || facilities.length === 0) {
          setLeads([]);
          setSignals([]);
          setNoResultsLeads([]);
          setFunnel({
            impressions: 0,
            engagement: 0,
            intent: 0,
            conversions: 0,
            prev_impressions: 0,
            prev_engagement: 0,
            prev_intent: 0,
            prev_conversions: 0,
            phone_reveals: 0,
            tour_requests: 0,
            directions: 0,
            comparisons: 0,
          });
          setHealthRows([]);
          setLoading(false);
          return;
        }

        const facilityIds = facilities.map((f) => f.id);

        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*, facilities(name)')
          .in('facility_id', facilityIds)
          .order('created_at', { ascending: false });
        if (leadError) throw leadError;
        setLeads((leadData as LeadRow[]) || []);

        const { data: signalData, error: signalError } = await supabase
          .from('lead_events')
          .select('id, facility_id, created_at, event_type, facilities(name, city)')
          .in('facility_id', facilityIds)
          .order('created_at', { ascending: false })
          .limit(50);
        if (signalError) throw signalError;
        setSignals((signalData as LeadSignal[]) || []);

        const { data: benchmarkData, error: benchmarkError } = await supabase
          .rpc('get_operator_signal_benchmark');
        if (!benchmarkError && benchmarkData && benchmarkData.length > 0) {
          setBenchmark(benchmarkData[0]);
        }

        const { data: funnelData, error: funnelError } = await supabase
          .rpc('get_operator_attribution_funnel', { p_range: funnelRange });
        if (funnelError) throw funnelError;
        setFunnel((funnelData?.[0] as FunnelData) || null);

        const { data: healthData, error: healthError } = await supabase
          .rpc('get_operator_profile_health');
        if (healthError) throw healthError;
        setHealthRows((healthData as ProfileHealthRow[]) || []);

        if (isPremium) {
          const { data: demandLeads, error: demandError } = await supabase
            .from('leads')
            .select('id, facility_id, user_id, name, phone, email, message, move_in_timeframe, created_at, source, requested_location, care_type, budget')
            .eq('source', 'no_results')
            .order('created_at', { ascending: false })
            .limit(50);
          if (demandError) throw demandError;
          setNoResultsLeads((demandLeads as LeadRow[]) || []);

          const demandLeadIds = ((demandLeads as LeadRow[]) || []).map((lead) => lead.id);
          if (demandLeadIds.length > 0) {
            const { data: interests, error: interestsError } = await supabase
              .from('no_results_lead_interests')
              .select('lead_id')
              .eq('operator_user_id', user.id)
              .in('lead_id', demandLeadIds);
            if (interestsError) throw interestsError;
            setInterestedLeadIds(new Set((interests || []).map((row: any) => String(row.lead_id))));
          } else {
            setInterestedLeadIds(new Set());
          }
        } else {
          setNoResultsLeads([]);
          setInterestedLeadIds(new Set());
        }
        setKpiDataAsOf(new Date().toISOString());
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [user, planLoading, isPremium, funnelRange]);

  const handleExpressInterest = async (leadId: string) => {
    if (!user || interestedLeadIds.has(leadId)) return;
    setSubmittingInterestFor(leadId);
    try {
      const { error } = await supabase
        .from('no_results_lead_interests')
        .insert({
          lead_id: leadId,
          operator_user_id: user.id,
          status: 'interested',
        });

      if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
        throw error;
      }

      setInterestedLeadIds((prev) => new Set(prev).add(leadId));
    } catch (err) {
      console.error('Express interest failed:', err);
    } finally {
      setSubmittingInterestFor(null);
    }
  };

  const brokerFreeValue = useMemo(() => {
    if (!funnel) return 0;
    const baselineRate = brokerBaselinePercent / 100;
    return Math.round(
      (funnel.tour_requests * INTENT_WEIGHTS.schedule_tour +
        funnel.phone_reveals * INTENT_WEIGHTS.phone_reveal +
        funnel.directions * INTENT_WEIGHTS.directions_clicked +
        funnel.comparisons * INTENT_WEIGHTS.comparison_added) *
        ROI_AVG_MONTHLY_RATE *
        baselineRate
    );
  }, [funnel, brokerBaselinePercent]);

  const averageHealth = useMemo(() => {
    if (healthRows.length === 0) return 0;
    return Math.round(healthRows.reduce((sum, row) => sum + computeHealthScore(row), 0) / healthRows.length);
  }, [healthRows]);

  const baseContext = useMemo(() => ({
    operator_id: user?.id || 'unknown',
    facility_id: leads[0]?.facility_id || healthRows[0]?.facility_id || 'unknown',
    session_id: getActivationSessionId(),
    plan_tier: resolvePlanTier(),
    activation_score: averageHealth,
    source_screen: 'dashboard_leads',
  }), [user?.id, leads, healthRows, plan, isPremium, averageHealth]);

  const trackMethodologyView = (metricKey: string) => {
    if (!user) return;
    trackActivationEvent('methodology_viewed', baseContext, { metric_key: metricKey });
  };

  const trackEmptyStateViewed = (key: string) => {
    if (!user || trackedEmptyStateViews.current.has(key)) return;
    trackedEmptyStateViews.current.add(key);
    trackActivationEvent('empty_state_viewed', baseContext, { empty_state_key: key });
  };

  const trackEmptyStateAction = (key: string, action: string) => {
    if (!user) return;
    trackActivationEvent('empty_state_action_clicked', baseContext, {
      empty_state_key: key,
      action,
    });
  };

  const goToListings = () => {
    if (typeof window !== 'undefined') window.location.assign('/dashboard/listings');
  };

  useEffect(() => {
    if (!user) return;
    trackActivationEvent('roi_module_viewed', baseContext, {
      baseline_pct: Number(brokerBaselinePercent.toFixed(1)),
      safe_zone_min: ROI_GUARDRAILS.safeMin,
      safe_zone_max: ROI_GUARDRAILS.safeMax,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user || !benchmark) return;
    trackActivationEvent('benchmark_module_viewed', baseContext, {
      your_signals_week: benchmark.your_signals_week,
      peer_avg_week: Number(benchmark.peer_avg_week || 0),
    });
  }, [user, benchmark, baseContext]);

  useEffect(() => {
    if (!user || loading) return;
    if (signals.length === 0) trackEmptyStateViewed('signals_empty');
    if (leads.length === 0) trackEmptyStateViewed('leads_empty');
    if (isPremium && noResultsLeads.length === 0) trackEmptyStateViewed('no_results_demand_empty');
  }, [user, loading, signals.length, leads.length, isPremium, noResultsLeads.length]);

  const roiConfidenceThreshold = getMetricConfidenceThreshold('roi_estimated_impact', 3);
  const roiConfidenceCount = Number(funnel?.tour_requests || 0);
  const roiBelowConfidence = roiConfidenceCount < roiConfidenceThreshold;
  const roiRemaining = Math.max(0, roiConfidenceThreshold - roiConfidenceCount);
  const roiOutsideSafeZone = brokerBaselinePercent < ROI_GUARDRAILS.safeMin || brokerBaselinePercent > ROI_GUARDRAILS.safeMax;
  const insufficientDataPlaceholder = getInsufficientDataPlaceholder();
  const familyJourneyConfidenceThreshold = getMetricConfidenceThreshold('family_journey', 5);
  const familyJourneyCount = Number(funnel?.impressions || 0);
  const familyJourneyBelowConfidence = familyJourneyCount < familyJourneyConfidenceThreshold;
  const familyJourneyRemaining = Math.max(0, familyJourneyConfidenceThreshold - familyJourneyCount);
  const profileConfidenceThreshold = getMetricConfidenceThreshold('profile_completeness', 1);
  const profileCount = healthRows.length;
  const profileBelowConfidence = profileCount < profileConfidenceThreshold;
  const profileRemaining = Math.max(0, profileConfidenceThreshold - profileCount);

  const missingItems = useMemo(() => {
    if (healthRows.length === 0) return [] as string[];
    const items: string[] = [];
    const pushMissing = (label: string, predicate: (row: ProfileHealthRow) => boolean) => {
      const count = healthRows.filter(predicate).length;
      if (count > 0) {
        items.push(`${count} ${count === 1 ? 'facility' : 'facilities'} missing ${label}`);
      }
    };

    pushMissing('photos', (r) => !r.has_photos);
    pushMissing('care types', (r) => !r.has_care_types);
    pushMissing('phone', (r) => !r.has_phone);
    pushMissing('verified phone', (r) => !r.has_verified_phone);
    pushMissing('website URL', (r) => !r.has_website_url);
    pushMissing('licensing', (r) => !r.has_licensing);
    pushMissing('full Q&A response coverage', (r) => Number(r.qa_response_rate || 0) < 1);
    return items.slice(0, 5);
  }, [healthRows]);

  const funnelStages = useMemo(() => {
    const data = funnel || {
      impressions: 0,
      engagement: 0,
      intent: 0,
      conversions: 0,
      prev_impressions: 0,
      prev_engagement: 0,
      prev_intent: 0,
      prev_conversions: 0,
      phone_reveals: 0,
      tour_requests: 0,
      directions: 0,
      comparisons: 0,
    };
    return [
      { key: 'impressions', label: 'Impressions', color: 'bg-slate-500', value: data.impressions, prev: data.prev_impressions },
      { key: 'engagement', label: 'Engagement', color: 'bg-blue-500', value: data.engagement, prev: data.prev_engagement },
      { key: 'intent', label: 'Unique Family Interest', color: 'bg-amber-500', value: data.intent, prev: data.prev_intent },
      { key: 'conversions', label: 'Conversions', color: 'bg-emerald-500', value: data.conversions, prev: data.prev_conversions },
    ];
  }, [funnel]);

  const maxFunnel = Math.max(1, ...funnelStages.map((stage) => stage.value));
  const healthCircumference = 2 * Math.PI * 42;
  const healthStrokeOffset = healthCircumference - (averageHealth / 100) * healthCircumference;

  if (loading || planLoading) {
    return <div className="text-center py-10">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Inquiries & Leads</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-semibold text-slate-900">Family Journey</h3>
                  <MethodologyTrigger metricKey="family_journey" fallbackLabel={KPI_TRUST_LABELS.family_journey} onViewed={trackMethodologyView} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{formatAsOfLabel(kpiDataAsOf, 'relative')}</p>
            </div>
            <select
              value={funnelRange}
              onChange={(e) => setFunnelRange(e.target.value as FunnelRange)}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="all">All time</option>
            </select>
          </div>
          <p
            className="text-xs text-slate-600 mb-4"
            title="Honest counting: if one family clicks your phone several times in a short window, SilverTech counts one family showing interest."
          >
            Verified Unique Interest uses honest counting so repeated clicks from one family are not inflated.
          </p>
          {familyJourneyBelowConfidence ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
              <p
                className="text-sm font-semibold text-slate-900"
                onMouseEnter={() => user && trackActivationEvent('confidence_label_hovered', baseContext, { metric_key: 'family_journey' })}
              >
                {insufficientDataPlaceholder.title}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                {insufficientDataPlaceholder.body
                  .replace('{remaining}', String(familyJourneyRemaining))
                  .replace('{unit}', `verified impression${familyJourneyRemaining === 1 ? '' : 's'}`)}
              </p>
              <p className="text-xs text-primary-700 mt-2 font-medium">{insufficientDataPlaceholder.cta}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {funnelStages.map((stage) => {
                const widthPercent = Math.max(4, Math.round((stage.value / maxFunnel) * 100));
                const delta = stage.value - stage.prev;
                const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '0';
                const deltaClass =
                  delta > 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : delta < 0
                      ? 'text-red-700 bg-red-50 border-red-200'
                      : 'text-slate-600 bg-slate-50 border-slate-200';
                return (
                  <div key={stage.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-sm font-medium text-slate-700">{stage.label}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{stage.value.toLocaleString()}</span>
                        <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 ${deltaClass}`}>
                          {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                          {deltaLabel}
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-2.5 ${stage.color} rounded-full`} style={{ width: `${widthPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Estimated</p>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-slate-900">Broker-Free Value</h3>
                  <MethodologyTrigger metricKey="roi_estimated_impact" fallbackLabel={KPI_TRUST_LABELS.roi_estimated_impact} onViewed={trackMethodologyView} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{formatAsOfLabel(kpiDataAsOf, 'absolute')}</p>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            {roiBelowConfidence ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <p
                  className="text-sm font-semibold text-slate-900"
                  onMouseEnter={() => user && trackActivationEvent('confidence_label_hovered', baseContext, { metric_key: 'roi_estimated_impact' })}
                >
                  {insufficientDataPlaceholder.title}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {insufficientDataPlaceholder.body
                    .replace('{remaining}', String(roiRemaining))
                    .replace('{unit}', `verified conversion${roiRemaining === 1 ? '' : 's'}`)}
                </p>
                <p className="text-xs text-primary-700 mt-2 font-medium">{insufficientDataPlaceholder.cta}</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-slate-900">${brokerFreeValue.toLocaleString()}</p>
                <p className="text-xs text-slate-600 mt-1">Estimated impact equivalent for current range.</p>
              </>
            )}
            {benchmark && (
              <p className="text-xs text-slate-500 mt-1">
                Your weekly signals: {benchmark.your_signals_week}; peer avg: {Number(benchmark.peer_avg_week || 0).toFixed(1)}.
              </p>
            )}
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-slate-600">
                  Baseline move-in rate: {brokerBaselinePercent.toFixed(1)}%
                </label>
                {roiOutsideSafeZone && (
                  <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Custom Baseline Applied
                  </span>
                )}
              </div>
              <input
                type="range"
                min={ROI_GUARDRAILS.hardMin}
                max={ROI_GUARDRAILS.hardMax}
                step={0.5}
                value={brokerBaselinePercent}
                onChange={(e) => setBrokerBaselinePercent(Number(e.target.value))}
                className={`w-full mt-2 ${roiOutsideSafeZone ? 'accent-amber-500' : ''}`}
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>{ROI_GUARDRAILS.hardMin}%</span>
                <span>Safe zone: {ROI_GUARDRAILS.safeMin}% - {ROI_GUARDRAILS.safeMax}%</span>
                <span>{ROI_GUARDRAILS.hardMax}%</span>
              </div>
            </div>
            <p
              className="text-xs text-slate-500 mt-3"
              title={`Weights: Tour ${INTENT_WEIGHTS.schedule_tour}x, Phone ${INTENT_WEIGHTS.phone_reveal}x, Directions ${INTENT_WEIGHTS.directions_clicked}x, Compare ${INTENT_WEIGHTS.comparison_added}x`}
            >
              Estimated impact uses weighted lead intent, baseline rate, and average monthly rate.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-semibold text-slate-900">Profile Health</h3>
                  <MethodologyTrigger metricKey="profile_completeness" fallbackLabel={KPI_TRUST_LABELS.profile_completeness} onViewed={trackMethodologyView} />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{formatAsOfLabel(kpiDataAsOf, 'absolute')}</p>
              </div>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-center gap-4">
              {profileBelowConfidence ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 w-full">
                  <p
                    className="text-sm font-semibold text-slate-900"
                    onMouseEnter={() => user && trackActivationEvent('confidence_label_hovered', baseContext, { metric_key: 'profile_completeness' })}
                  >
                    {insufficientDataPlaceholder.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {insufficientDataPlaceholder.body
                      .replace('{remaining}', String(profileRemaining))
                      .replace('{unit}', `facility profile${profileRemaining === 1 ? '' : 's'}`)}
                  </p>
                  <p className="text-xs text-primary-700 mt-2 font-medium">{insufficientDataPlaceholder.cta}</p>
                </div>
              ) : (
                <>
                  <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={healthCircumference}
                      strokeDashoffset={healthStrokeOffset}
                      transform="rotate(-90 50 50)"
                    />
                    <text x="50" y="55" textAnchor="middle" className="fill-slate-900 text-lg font-bold">{averageHealth}%</text>
                  </svg>
                  <div className="text-sm text-slate-700">
                    <p className="font-medium text-slate-900">{healthRows.length} facilities scored</p>
                    <p className="text-slate-600">Completeness + Q&A response coverage.</p>
                  </div>
                </>
              )}
            </div>
            {missingItems.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-slate-600">
                {missingItems.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-900">Recent activity log</h3>
        </div>
        {signals.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">No verified family interest yet.</p>
            <p className="text-xs text-slate-600 mt-1">
              We are still gathering engagement signals for your listing.
            </p>
            <button
              className="mt-3 text-xs font-semibold text-primary-700 hover:text-primary-800 underline"
              onClick={() => {
                trackEmptyStateAction('signals_empty', 'improve_profile');
                goToListings();
              }}
            >
              Improve profile to increase signal volume
            </button>
            <p className="text-[11px] text-slate-500 mt-1">Expected benefit: better visibility into what families care about.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {signals.slice(0, 12).map((signal) => (
              <div key={signal.id} className="flex items-start justify-between gap-4 border border-slate-100 rounded-lg px-3 py-2">
                <div className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{eventCopy[signal.event_type] || 'New engagement event'}</span>
                  {signal.facilities?.name ? ` - ${signal.facilities.name}` : ''}
                </div>
                <div className="text-xs text-slate-500 whitespace-nowrap">
                  {formatRelativeTime(signal.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isPremium && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="text-base font-semibold text-slate-900">No-Results Demand (Anonymous)</h3>
            <p className="text-sm text-slate-600">
              Families searched where no referral-free listing was available. Express interest to claim this demand.
            </p>
          </div>
          {noResultsLeads.length === 0 ? (
            <div className="px-6 py-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">No no-results demand leads yet.</p>
                <p className="text-xs text-slate-600 mt-1">
                  We haven’t detected unmatched demand in your target areas yet.
                </p>
                <button
                  className="mt-3 text-xs font-semibold text-primary-700 hover:text-primary-800 underline"
                  onClick={() => {
                    trackEmptyStateAction('no_results_demand_empty', 'expand_listing_coverage');
                    goToListings();
                  }}
                >
                  Expand listing coverage
                </button>
                <p className="text-[11px] text-slate-500 mt-1">Expected benefit: capture demand where options are currently limited.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-200 md:hidden">
                {noResultsLeads.map((lead) => {
                  const claimed = interestedLeadIds.has(lead.id);
                  const submitting = submittingInterestFor === lead.id;
                  return (
                    <div key={lead.id} className="px-4 py-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{lead.requested_location || '-'}</p>
                        <p className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</p>
                      </div>
                      <p className="text-xs text-slate-600">Care: {lead.care_type || '-'}</p>
                      <p className="text-xs text-slate-600">Budget: {lead.budget || '-'}</p>
                      <div className="flex flex-col gap-1">
                        <a href={`mailto:${lead.email}`} className="inline-flex min-h-11 items-center gap-2 text-slate-600 hover:text-primary-600 text-sm">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="inline-flex min-h-11 items-center gap-2 text-slate-600 hover:text-primary-600 text-sm">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => handleExpressInterest(lead.id)}
                        disabled={claimed || submitting}
                        className={`mt-1 text-sm font-medium min-h-11 px-2 rounded ${claimed ? 'text-slate-400 cursor-default' : 'text-primary-600 hover:text-primary-700'}`}
                      >
                        {claimed ? 'Interested' : submitting ? 'Saving...' : 'Express Interest'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold text-slate-900">Location</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Care Type</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Budget</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Contact</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Date</th>
                      <th className="px-6 py-3 font-semibold text-slate-900">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {noResultsLeads.map((lead) => {
                      const claimed = interestedLeadIds.has(lead.id);
                      const submitting = submittingInterestFor === lead.id;
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-slate-700">{lead.requested_location || '-'}</td>
                          <td className="px-6 py-4 text-slate-700">{lead.care_type || '-'}</td>
                          <td className="px-6 py-4 text-slate-700">{lead.budget || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                                <Mail className="w-3 h-3" /> {lead.email}
                              </a>
                              {lead.phone && (
                                <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                                  <Phone className="w-3 h-3" /> {lead.phone}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleExpressInterest(lead.id)}
                              disabled={claimed || submitting}
                              className={`font-medium ${claimed ? 'text-slate-400 cursor-default' : 'text-primary-600 hover:text-primary-700'}`}
                            >
                              {claimed ? 'Interested' : submitting ? 'Saving...' : 'Express Interest'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No leads yet</h3>
          <p className="text-slate-500">Families have not submitted direct inquiries yet.</p>
          <button
            className="mt-4 text-sm font-semibold text-primary-700 hover:text-primary-800 underline"
            onClick={() => {
              trackEmptyStateAction('leads_empty', 'complete_listing');
              goToListings();
            }}
          >
            Complete your listing profile
          </button>
          <p className="mt-2 text-xs text-slate-500">Expected benefit: more qualified inquiries from families actively searching.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-200 md:hidden">
            {leads.map((lead) => (
              <div key={lead.id} className="px-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{lead.name}</p>
                  <p className="text-xs text-slate-500">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-slate-600">{lead.facilities?.name || 'Facility'}</p>
                <div className="flex flex-col gap-1">
                  <a href={`mailto:${lead.email}`} className="inline-flex min-h-11 items-center gap-2 text-slate-600 hover:text-primary-600 text-sm">
                    <Mail className="w-3 h-3" /> {lead.email}
                  </a>
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="inline-flex min-h-11 items-center gap-2 text-slate-600 hover:text-primary-600 text-sm">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </a>
                  )}
                </div>
                <p className="text-sm text-slate-700">{lead.message || '-'}</p>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium min-h-11 px-2 rounded">View Details</button>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Contact Info</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Facility</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Message</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{lead.facilities?.name}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={lead.message || ''}>
                      {lead.message || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary-600 hover:text-primary-700 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
