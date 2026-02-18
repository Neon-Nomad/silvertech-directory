import React from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle,
  LayoutDashboard,
  Mail,
  Phone,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/src/context/AuthProvider';
import {
  BENCHMARK_MIN_INQUIRIES,
  BENCHMARK_MIN_PROFILE_VIEWS,
  trackActivationEvent,
} from '@/src/config/activationEvents';
import { getActivationSessionId } from '@/src/utils/activationSession';
import { formatAsOfLabel } from '@/src/utils/timeFormatting';
import { buildActivationSnapshot } from '@/src/utils/activationSnapshot';
import type { ActivationFunnelStage, ActivationQuickWinId } from '@/src/utils/activationSnapshot';
import { supabase } from '@/src/lib/supabase';

type DashboardOverviewProps = {
  onGoToListings: () => void;
  onGoToLeads: () => void;
  onViewPublicProfile: () => void;
};

const recentLeads = [
  { name: 'Jona Smith', date: '03/22/2023', type: 'Inquiry Form', status: 'New', phone: '(555) 555-0111', email: 'jona@example.com' },
  { name: 'John Anthrena', date: '03/22/2023', type: 'Inquiry Form', status: 'Contacted', phone: '(555) 555-0112', email: 'john@example.com' },
  { name: 'Barky Jason', date: '03/22/2023', type: 'Inquiry Form', status: 'Follow-up', phone: '(555) 555-0113', email: 'barky@example.com' },
];

const leadAttribution = [
  { label: 'Google', value: 18 },
  { label: 'SilverTech', value: 12 },
  { label: 'Direct Link', value: 9 },
  { label: 'Referral', value: 6 },
];

const kpis = [
  { label: 'Profile Views', value: '1,250' },
  { label: 'Leads Received', value: '45' },
  { label: 'Estimated Move-Ins', value: '3' },
  { label: 'Estimated Revenue', value: '$18,000' },
  { label: 'Avg. Response Time', value: '1h 12m' },
];

type ChecklistItem = {
  id: string;
  title: string;
  impact: string;
  actionLabel: string;
  onAction: () => void;
};

type QuickWin = {
  id: ActivationQuickWinId;
  field: string;
  why: string;
  cta: string;
  go: () => void;
};

type ActivationEventRow = {
  session_id: string;
  event_name: string;
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onGoToListings,
  onGoToLeads,
  onViewPublicProfile,
}) => {
  const { user } = useAuth();
  const [startedSteps, setStartedSteps] = React.useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set(['contact_info']));
  const hasTrackedChecklistComplete = React.useRef(false);
  const hasTrackedBenchmarkView = React.useRef(false);
  const hasTrackedBenchmarkTooltip = React.useRef(false);
  const hasTrackedRoiView = React.useRef(false);
  const hasTrackedRoiTooltip = React.useRef(false);
  const hasTrackedPremiumCtaView = React.useRef(false);
  const hasTrackedActivationScoreView = React.useRef(false);
  const previousActivationScoreRef = React.useRef<number | null>(null);
  const [dataAsOf] = React.useState<string>(new Date().toISOString());
  const [funnelStages, setFunnelStages] = React.useState<ActivationFunnelStage[]>([]);
  const [funnelLoading, setFunnelLoading] = React.useState(false);
  const insightsRef = React.useRef<HTMLDetailsElement | null>(null);

  const onboardingViews = 32;
  const onboardingInquiries = 4;
  const marketMedianConversion = 0.19;

  const checklistItems: ChecklistItem[] = React.useMemo(() => ([
    {
      id: 'photos',
      title: 'Add 5+ photos',
      impact: 'Profiles with photos receive 2-3x more engagement.',
      actionLabel: 'Open Photos',
      onAction: onGoToListings,
    },
    {
      id: 'pricing',
      title: 'Verify pricing range',
      impact: 'Clear pricing improves inquiry quality.',
      actionLabel: 'Update Pricing',
      onAction: onGoToListings,
    },
    {
      id: 'contact_info',
      title: 'Confirm contact info',
      impact: 'Accurate contact details reduce lost leads.',
      actionLabel: 'Check Details',
      onAction: onGoToListings,
    },
    {
      id: 'amenities',
      title: 'Complete care types and amenities',
      impact: 'Complete profiles rank better in local search.',
      actionLabel: 'Edit Amenities',
      onAction: onGoToListings,
    },
    {
      id: 'answer_question',
      title: 'Answer 1 question',
      impact: 'Fast answers increase trust and conversions.',
      actionLabel: 'View Inquiries',
      onAction: onGoToLeads,
    },
  ]), [onGoToListings, onGoToLeads]);

  const snapshot = React.useMemo(() => buildActivationSnapshot({
    asOf: dataAsOf,
    completedStepIds: completedSteps,
    funnelStages,
    onboardingViews,
    onboardingInquiries,
    marketMedianConversion,
  }), [completedSteps, dataAsOf, funnelStages]);

  const activationScore = snapshot.score.value;
  const completionPct = snapshot.checklist.completionPct;
  const benchmarkReady = snapshot.benchmark.ready;
  const benchmarkConfidenceLabel = snapshot.benchmark.confidenceLabel;
  const yourConversion = snapshot.benchmark.yourConversion;
  const conversionGap = snapshot.benchmark.gapPct;
  const roiReady = snapshot.roi.ready;
  const roiConfidenceLabel = snapshot.roi.confidenceLabel;
  const roiRemaining = snapshot.roi.remainingInquiries;
  const estimatedExtraInquiriesLow = snapshot.roi.low;
  const estimatedExtraInquiriesMid = snapshot.roi.mid;
  const showPremiumCta = snapshot.showPremiumCta;
  const topDropOffInsight = snapshot.funnel.topDrop;
  const nextBestFix = snapshot.nextFix;
  const minimumFunnelSessions = snapshot.funnel.minimumFunnelSessions;
  const checklistCompletion = snapshot.checklist.completedCount / snapshot.checklist.totalCount;
  const photoCount = snapshot.score.breakdown.photos > 0 ? 10 : 2;

  const quickWinTemplates: Record<ActivationQuickWinId, Omit<QuickWin, 'id'>> = React.useMemo(() => ({
    photos_missing: {
      field: 'Photo gallery',
      why: 'Families engage more when they can see rooms and common areas.',
      cta: 'Fix now',
      go: onGoToListings,
    },
    pricing_missing: {
      field: 'Pricing range',
      why: 'Transparent pricing improves lead quality and reduces drop-off.',
      cta: 'Fix now',
      go: onGoToListings,
    },
    qa_pending: {
      field: 'Pending Q&A response',
      why: 'Fast answers build trust and improve conversion intent.',
      cta: 'Fix now',
      go: onGoToLeads,
    },
  }), [onGoToLeads, onGoToListings]);

  const quickWins: QuickWin[] = React.useMemo(
    () =>
      snapshot.quickWins.items
        .map((id) => (quickWinTemplates[id] ? { id, ...quickWinTemplates[id] } : null))
        .filter((item): item is QuickWin => item !== null),
    [quickWinTemplates, snapshot.quickWins.items],
  );
  const isDoneForNow = checklistCompletion >= 0.8 && quickWins.length === 0 && activationScore >= 75;

  React.useEffect(() => {
    if (!user || hasTrackedActivationScoreView.current) return;
    hasTrackedActivationScoreView.current = true;
    trackActivationEvent('activation_score_viewed', {
      operator_id: user.id,
      facility_id: 'unknown',
      session_id: getActivationSessionId(),
      plan_tier: 'unknown',
      activation_score: activationScore,
      source_screen: 'dashboard_overview',
    });
  }, [activationScore, user]);

  React.useEffect(() => {
    const loadFunnel = async () => {
      if (!user) return;
      setFunnelLoading(true);
      try {
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const { data, error } = await supabase
          .from('operator_activation_events')
          .select('session_id,event_name')
          .eq('operator_id', user.id)
          .gte('occurred_at', since.toISOString());
        if (error) throw error;

        const rows = (data || []) as ActivationEventRow[];
        const bySession = new Map<string, Set<string>>();
        rows.forEach((row) => {
          const bucket = bySession.get(row.session_id) || new Set<string>();
          bucket.add(row.event_name);
          bySession.set(row.session_id, bucket);
        });

        const totalSessions = Math.max(0, bySession.size);
        const countStage = (eventName: string) =>
          Array.from(bySession.values()).filter((events) => events.has(eventName)).length;

        const stages = ([
          { id: 'claim', label: 'Claim completed', count: countStage('operator_claim_completed'), rate: 0 },
          { id: 'view', label: 'Dashboard viewed', count: countStage('operator_activation_screen_viewed'), rate: 0 },
          { id: 'edit', label: 'First edit made', count: countStage('field_updated'), rate: 0 },
          { id: 'checklist', label: 'Checklist step completed', count: countStage('checklist_step_completed'), rate: 0 },
          { id: 'benchmark', label: 'Benchmark shown', count: countStage('benchmark_module_viewed'), rate: 0 },
          { id: 'roi', label: 'ROI viewed', count: countStage('roi_module_viewed'), rate: 0 },
          { id: 'cta', label: 'Premium CTA clicked', count: countStage('premium_cta_clicked'), rate: 0 },
          { id: 'trial', label: 'Trial started', count: countStage('premium_trial_started'), rate: 0 },
        ] satisfies ActivationFunnelStage[]).map((stage) => ({
          ...stage,
          rate: totalSessions > 0 ? stage.count / totalSessions : 0,
        }));

        setFunnelStages(stages);
      } catch (err) {
        console.error('Failed to load activation funnel', err);
        setFunnelStages([]);
      } finally {
        setFunnelLoading(false);
      }
    };

    loadFunnel();
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const previous = previousActivationScoreRef.current;
    if (previous === null) {
      previousActivationScoreRef.current = activationScore;
      return;
    }
    if (activationScore > previous) {
      trackActivationEvent('activation_score_improved', {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      }, {
        previous_score: previous,
        current_score: activationScore,
        score_delta: activationScore - previous,
      });
    }
    previousActivationScoreRef.current = activationScore;
  }, [activationScore, user]);

  React.useEffect(() => {
    if (!user || hasTrackedBenchmarkView.current) return;
    hasTrackedBenchmarkView.current = true;
    trackActivationEvent(
      'benchmark_module_viewed',
      {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      },
      {
        profile_views: onboardingViews,
        inquiries: onboardingInquiries,
        benchmark_ready: benchmarkReady,
      },
    );
  }, [benchmarkReady, onboardingInquiries, onboardingViews, user]);

  React.useEffect(() => {
    if (!user || hasTrackedRoiView.current) return;
    hasTrackedRoiView.current = true;
    trackActivationEvent(
      'roi_module_viewed',
      {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      },
      {
        estimate_low: estimatedExtraInquiriesLow,
        estimate_mid: estimatedExtraInquiriesMid,
        confidence: roiConfidenceLabel,
      },
    );
  }, [estimatedExtraInquiriesLow, estimatedExtraInquiriesMid, roiConfidenceLabel, user]);

  React.useEffect(() => {
    if (!user || !showPremiumCta || hasTrackedPremiumCtaView.current) return;
    hasTrackedPremiumCtaView.current = true;
    trackActivationEvent(
      'premium_cta_viewed',
      {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      },
      {
        reason_checklist_incomplete: checklistCompletion < 0.8,
        reason_low_photos: photoCount < 10,
        reason_benchmark_gap: conversionGap >= 0.03,
      },
    );
  }, [checklistCompletion, conversionGap, photoCount, showPremiumCta, user]);

  React.useEffect(() => {
    if (!user) return;
    if (completedSteps.size !== checklistItems.length) return;
    if (hasTrackedChecklistComplete.current) return;

    hasTrackedChecklistComplete.current = true;
    trackActivationEvent('checklist_completed', {
      operator_id: user.id,
      facility_id: 'unknown',
      session_id: getActivationSessionId(),
      plan_tier: 'unknown',
      activation_score: activationScore,
      source_screen: 'dashboard_overview',
    });
  }, [checklistItems.length, completedSteps.size, user]);

  const trackQuickWin = (action: string) => {
    if (!user) return;
    trackActivationEvent(
      'quickwin_clicked',
      {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      },
      { action },
    );
  };

  const startChecklistStep = (stepId: string) => {
    if (!user || startedSteps.has(stepId)) return;
    setStartedSteps((prev) => new Set(prev).add(stepId));
    trackActivationEvent(
      'checklist_step_started',
      {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      },
      { step_id: stepId },
    );
  };

  const completeChecklistStep = (stepId: string) => {
    if (!user || completedSteps.has(stepId)) return;
    setCompletedSteps((prev) => new Set(prev).add(stepId));
    trackActivationEvent(
      'checklist_step_completed',
      {
        operator_id: user.id,
        facility_id: 'unknown',
        session_id: getActivationSessionId(),
        plan_tier: 'unknown',
        activation_score: activationScore,
        source_screen: 'dashboard_overview',
      },
      { step_id: stepId },
    );
  };

  const handlePremiumTrialStart = () => {
    if (!user) return;
    trackActivationEvent('premium_cta_clicked', {
      operator_id: user.id,
      facility_id: 'unknown',
      session_id: getActivationSessionId(),
      plan_tier: 'unknown',
      activation_score: activationScore,
      source_screen: 'dashboard_overview',
    });
    trackActivationEvent('premium_trial_started', {
      operator_id: user.id,
      facility_id: 'unknown',
      session_id: getActivationSessionId(),
      plan_tier: 'unknown',
      activation_score: activationScore,
      source_screen: 'dashboard_overview',
    });
    onGoToListings();
  };

  const trackConfidenceHover = (module: 'benchmark' | 'roi') => {
    if (!user) return;
    trackActivationEvent('confidence_label_hovered', {
      operator_id: user.id,
      facility_id: 'unknown',
      session_id: getActivationSessionId(),
      plan_tier: 'unknown',
      activation_score: activationScore,
      source_screen: 'dashboard_overview',
    }, { module });
  };

  const scrollToSection = (sectionId: string) => {
    if (typeof window === 'undefined') return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNextBestFixClick = () => {
    if (!nextBestFix) return;

    switch (nextBestFix.action) {
      case 'open_qna':
        onGoToLeads();
        return;
      case 'start_trial':
        handlePremiumTrialStart();
        return;
      case 'open_pricing':
      case 'open_photos':
      case 'open_contact':
      case 'open_amenities':
        onGoToListings();
        return;
      case 'open_quick_wins':
      case 'open_checklist':
        scrollToSection(nextBestFix.targetSection);
        return;
      case 'open_benchmark':
      case 'open_roi':
      case 'open_premium_cta':
        if (insightsRef.current && !insightsRef.current.open) {
          insightsRef.current.open = true;
        }
        window.setTimeout(() => scrollToSection(nextBestFix.targetSection), 0);
        return;
      default:
        scrollToSection(nextBestFix.targetSection);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <section className="space-y-6 lg:col-span-4">
        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Next Best Fix</h2>
          </div>
          {isDoneForNow ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-800">Done for now</p>
              <p className="mt-1 text-xs text-emerald-700">
                Your setup is in a healthy range. Check back for new inquiries and Q&A activity.
              </p>
            </div>
          ) : nextBestFix ? (
            <div className="rounded-xl border border-charcoal/15 bg-warm-white p-3">
              <p className="text-sm font-medium text-charcoal">{nextBestFix.line}</p>
              <button
                onClick={handleNextBestFixClick}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-charcoal px-4 py-2 text-xs font-semibold text-white"
              >
                {nextBestFix.ctaLabel}
              </button>
            </div>
          ) : (
            <p className="text-xs text-charcoal/70">No high-priority fix detected right now.</p>
          )}
        </div>

        <div id="guided-setup" className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Guided Setup</h2>
            <div className="text-right">
              <p className="text-xs font-semibold text-charcoal/70">
                {completedSteps.size}/{checklistItems.length} complete
              </p>
              <p className="text-[11px] font-bold text-charcoal">{activationScore}/100 score</p>
            </div>
          </div>
          <div className="mb-4 h-2 rounded-full bg-warm-gray">
            <div className="h-2 rounded-full bg-charcoal" style={{ width: `${completionPct}%` }} />
          </div>
          <ul className="space-y-3">
            {checklistItems.map((item) => {
              const complete = completedSteps.has(item.id);
              return (
                <li key={item.id} className="rounded-xl border border-warm-gray p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{item.title}</p>
                      <p className="mt-1 text-xs text-charcoal/60">{item.impact}</p>
                    </div>
                    {complete ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Done</span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="text-xs font-semibold text-charcoal hover:underline"
                      onClick={() => {
                        startChecklistStep(item.id);
                        item.onAction();
                      }}
                    >
                      {item.actionLabel}
                    </button>
                    {!complete ? (
                      <button
                        className="text-xs font-semibold text-charcoal/70 hover:text-charcoal"
                        onClick={() => completeChecklistStep(item.id)}
                      >
                        Mark Complete
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <details ref={insightsRef} className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <summary className="cursor-pointer text-lg font-semibold text-charcoal">Insights</summary>
          <div className="mt-4 space-y-6">
            <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-charcoal">Quick Actions</h2>
              <div className="space-y-3">
            <button
              onClick={() => {
                trackQuickWin('view_public_profile');
                onViewPublicProfile();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3 font-medium text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              View Public Profile
            </button>
            <button
              onClick={() => {
                trackQuickWin('edit_listing');
                onGoToListings();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal/80 py-3 font-medium text-white"
            >
              <Building2 className="h-4 w-4" />
              Edit Listing
            </button>
              </div>
            </div>
          </div>
        

        <div id="quick-wins-panel" className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-charcoal">Quick Wins</h2>
          {isDoneForNow ? (
            <p className="text-sm text-charcoal/70">Done for now. No immediate fixes required.</p>
          ) : quickWins.length === 0 ? (
            <p className="text-sm text-charcoal/70">No urgent profile gaps detected. Keep momentum by answering new inquiries.</p>
          ) : (
            <div className="space-y-3">
              {quickWins.map((win) => (
                <div key={win.id} className="rounded-xl border border-warm-gray p-3">
                  <p className="text-sm font-medium text-charcoal">{win.field}</p>
                  <p className="mt-1 text-xs text-charcoal/60">{win.why}</p>
                  <button
                    className="mt-2 text-xs font-semibold text-charcoal hover:underline"
                    onClick={() => {
                      trackQuickWin(win.id);
                      win.go();
                    }}
                  >
                    {win.cta}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Premium Benefits</h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3 text-sm text-charcoal/70">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold" />
              Featured placement in results
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold" />
              Enhanced visibility across the directory
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold" />
              Priority support for family inquiries
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Lead Attribution</h2>
            <span className="text-xs text-charcoal/40">Last 30 days</span>
          </div>
          <div className="space-y-3">
            {leadAttribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm text-charcoal/70">
                  <span>{item.label}</span>
                  <span className="font-semibold text-charcoal">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-warm-gray">
                  <div className="h-2 rounded-full bg-charcoal/90" style={{ width: `${(item.value / 20) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="benchmark-gap" className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Benchmark Gap</h2>
              <p className="text-[11px] text-charcoal/60">{formatAsOfLabel(dataAsOf, 'absolute')}</p>
            </div>
            <details
              onToggle={(event) => {
                const target = event.currentTarget as HTMLDetailsElement;
                if (target.open && user && !hasTrackedBenchmarkTooltip.current) {
                  hasTrackedBenchmarkTooltip.current = true;
                  trackActivationEvent('benchmark_tooltip_opened', {
                    operator_id: user.id,
                    facility_id: 'unknown',
                    session_id: getActivationSessionId(),
                    plan_tier: 'unknown',
                    activation_score: activationScore,
                    source_screen: 'dashboard_overview',
                  });
                }
              }}
              className="relative"
            >
              <summary className="cursor-pointer list-none text-xs font-medium text-charcoal/60 hover:text-charcoal">
                Methodology
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-warm-gray bg-white p-3 text-xs text-charcoal/70 shadow-lg">
                Benchmarks use verified local facilities with similar profile completeness and care type mix.
              </div>
            </details>
          </div>
          <div className="mb-3">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${benchmarkReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
              onMouseEnter={() => trackConfidenceHover('benchmark')}
              title="Confidence level is based on whether minimum benchmark thresholds are met."
            >
              {benchmarkConfidenceLabel}
            </span>
          </div>
          {!benchmarkReady ? (
            <div className="rounded-xl border border-warm-gray p-3">
              <p className="text-sm font-medium text-charcoal">Gathering Data</p>
              <p className="mt-1 text-xs text-charcoal/60">
                Benchmarks appear after {BENCHMARK_MIN_PROFILE_VIEWS} profile views and {BENCHMARK_MIN_INQUIRIES} inquiries.
              </p>
              <p className="mt-2 text-xs text-charcoal/70">
                Current: {onboardingViews} views, {onboardingInquiries} inquiries.
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-warm-gray p-3">
              <p className="text-sm text-charcoal/70">
                Your conversion: <span className="font-semibold text-charcoal">{(yourConversion * 100).toFixed(1)}%</span>
              </p>
              <p className="text-sm text-charcoal/70">
                Market median: <span className="font-semibold text-charcoal">{(marketMedianConversion * 100).toFixed(1)}%</span>
              </p>
              <p className="text-xs text-charcoal/60">
                Gap: {((yourConversion - marketMedianConversion) * 100).toFixed(1)} percentage points
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">ROI Preview</h2>
              <p className="text-[11px] text-charcoal/60">{formatAsOfLabel(dataAsOf, 'absolute')}</p>
            </div>
            <details
              onToggle={(event) => {
                const target = event.currentTarget as HTMLDetailsElement;
                if (target.open && user && !hasTrackedRoiTooltip.current) {
                  hasTrackedRoiTooltip.current = true;
                  trackActivationEvent('roi_tooltip_opened', {
                    operator_id: user.id,
                    facility_id: 'unknown',
                    session_id: getActivationSessionId(),
                    plan_tier: 'unknown',
                    activation_score: activationScore,
                    source_screen: 'dashboard_overview',
                  });
                }
              }}
              className="relative"
            >
              <summary className="cursor-pointer list-none text-xs font-medium text-charcoal/60 hover:text-charcoal">
                Methodology
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-warm-gray bg-white p-3 text-xs text-charcoal/70 shadow-lg">
                Estimates are based on your current conversion gap vs market median and current profile view volume. Results vary by market and response quality.
              </div>
            </details>
          </div>
          <div className="mb-3">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${roiReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
              onMouseEnter={() => trackConfidenceHover('roi')}
              title="Confidence level is based on verified inquiry volume."
            >
              {roiConfidenceLabel}
            </span>
          </div>
          {!roiReady ? (
            <div className="rounded-xl border border-warm-gray p-3">
              <p className="text-sm font-medium text-charcoal">Gathering Insights</p>
              <p className="mt-1 text-xs text-charcoal/60">
                We need {roiRemaining} more verified {roiRemaining === 1 ? 'inquiry' : 'inquiries'} to generate a confident estimate.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-warm-gray p-3">
              <p className="text-xs text-charcoal/60">Estimated additional inquiries per month</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-warm-white p-2">
                  <p className="text-[11px] text-charcoal/60">Low</p>
                  <p className="text-lg font-semibold text-charcoal">+{estimatedExtraInquiriesLow}</p>
                </div>
                <div className="rounded-lg bg-warm-white p-2">
                  <p className="text-[11px] text-charcoal/60">Mid</p>
                  <p className="text-lg font-semibold text-charcoal">+{estimatedExtraInquiriesMid}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-charcoal/70">
                Confidence: <span className="font-medium">{roiConfidenceLabel}</span>
              </p>
            </div>
          )}
        </div>

        {showPremiumCta && (
          <div id="premium-trial" className="rounded-2xl border border-primary-300 bg-primary-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-charcoal">Premium Trial</h2>
            <p className="mt-1 text-sm text-charcoal/80">
              Enable Premium trial to improve response speed and listing visibility.
            </p>
            <p className="mt-2 text-xs text-charcoal/70">
              Facilities with 10+ photos and faster response times typically see stronger engagement.
            </p>
            <button
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-white"
              onClick={handlePremiumTrialStart}
            >
              Start Premium Trial
            </button>
          </div>
        )}
        </details>
      </section>

      <section className="space-y-6 lg:col-span-8">
        <div id="activation-funnel" className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Activation Funnel (Last 30 Days)</h2>
              <p className="text-[11px] text-charcoal/60">Claim -&gt; View -&gt; Edit -&gt; Checklist -&gt; Benchmark -&gt; ROI -&gt; CTA -&gt; Trial</p>
            </div>
            <span className="text-[11px] text-charcoal/50">{formatAsOfLabel(dataAsOf, 'absolute')}</span>
          </div>
          {funnelLoading ? (
            <p className="text-sm text-charcoal/60">Loading activation funnel...</p>
          ) : funnelStages.length === 0 || (funnelStages[0]?.count || 0) < minimumFunnelSessions ? (
            <div className="rounded-xl border border-warm-gray p-4">
              <p className="text-sm font-medium text-charcoal">Gathering Data</p>
              <p className="mt-1 text-xs text-charcoal/60">
                We need at least {minimumFunnelSessions} claim sessions in the last 30 days to show stable funnel rates.
              </p>
              <p className="mt-2 text-xs text-charcoal/70">
                Keep driving claim and activation flow to unlock drop-off insights.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {funnelStages.map((stage) => (
                <div key={stage.id} className="rounded-xl border border-warm-gray p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-sm font-medium text-charcoal">{stage.label}</p>
                    <p className="text-xs text-charcoal/70">
                      {stage.count} sessions ({(stage.rate * 100).toFixed(1)}%)
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-warm-gray">
                    <div className="h-2 rounded-full bg-charcoal" style={{ width: `${Math.max(0, Math.min(100, stage.rate * 100))}%` }} />
                  </div>
                </div>
              ))}
              {topDropOffInsight && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-800">Top drop-off stage</p>
                  <p className="mt-1 text-xs text-amber-900">
                    Biggest leak is from "{topDropOffInsight.from}" to "{topDropOffInsight.to}":
                    {' '}lost {topDropOffInsight.lost} sessions ({(topDropOffInsight.dropRate * 100).toFixed(1)}%).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60">
                Your listing is performing better than 68% of homes in your area.
              </p>
              <h2 className="mt-1 text-lg font-semibold text-charcoal">Performance Overview</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-charcoal/60">
              <TrendingUp className="h-4 w-4" />
              Updated today
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-warm-gray p-4 text-center">
                <p className="text-xs uppercase text-charcoal/60">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-charcoal">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Recent Leads</h2>
            <button
              onClick={() => {
                trackQuickWin('view_all_leads');
                onGoToLeads();
              }}
              className="text-sm text-charcoal/60 hover:text-charcoal"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-gray text-left text-charcoal/60">
                  <th className="py-2">Name</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Inquiry Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-charcoal">
                {recentLeads.map((lead) => (
                  <tr key={lead.name} className="border-b border-warm-gray">
                    <td className="py-3 font-medium">{lead.name}</td>
                    <td className="py-3">{lead.date}</td>
                    <td className="py-3">{lead.type}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-warm-gray px-2 py-1 text-xs font-medium text-charcoal">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-white"
                          aria-label={`Call ${lead.name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/80 text-white"
                          aria-label={`Email ${lead.name}`}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="rounded-full bg-charcoal px-4 py-1 text-xs font-medium text-white"
                        >
                          Call
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-charcoal/60" />
              <h2 className="text-lg font-semibold text-charcoal">Analytics</h2>
            </div>
            <select className="rounded-full border border-warm-gray px-3 py-1 text-sm text-charcoal/70">
              <option>Past month</option>
              <option>Past 3 months</option>
              <option>Past year</option>
            </select>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl border border-dashed border-warm-gray bg-warm-white">
            <svg viewBox="0 0 600 200" className="absolute inset-0 h-full w-full">
              <path
                d="M0 160 C80 120, 140 120, 200 140 C260 160, 320 60, 380 80 C440 100, 520 40, 600 70"
                fill="none"
                stroke="#2D2D2D"
                strokeWidth="3"
              />
              <path
                d="M0 160 C80 120, 140 120, 200 140 C260 160, 320 60, 380 80 C440 100, 520 40, 600 70 L600 200 L0 200 Z"
                fill="rgba(45, 45, 45, 0.08)"
              />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};
