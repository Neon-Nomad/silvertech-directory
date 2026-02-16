import {
  BENCHMARK_MIN_INQUIRIES,
  BENCHMARK_MIN_PROFILE_VIEWS,
  isBenchmarkEligible,
  shouldShowPremiumCta,
} from '@/src/config/activationEvents';
import { getNextBestFix, type FunnelStageId, type NextBestFixRecommendation } from '@/src/utils/nextBestFix';

export type ActivationChecklistStepId =
  | 'photos'
  | 'pricing'
  | 'contact_info'
  | 'amenities'
  | 'answer_question';

export type ActivationChecklistStep = {
  id: ActivationChecklistStepId;
  complete: boolean;
};

export type ActivationFunnelStage = {
  id: FunnelStageId;
  label: string;
  count: number;
  rate: number;
};

export type ActivationQuickWinId = 'photos_missing' | 'pricing_missing' | 'qa_pending';

export type ActivationSnapshot = {
  asOf: string;
  checklist: {
    completionPct: number;
    completedCount: number;
    totalCount: number;
    steps: ActivationChecklistStep[];
  };
  quickWins: {
    items: ActivationQuickWinId[];
  };
  benchmark: {
    ready: boolean;
    confidenceLabel: 'Low confidence' | 'Medium confidence';
    yourConversion: number;
    marketMedianConversion: number;
    gapPct: number;
    remainingViews: number;
    remainingInquiries: number;
  };
  roi: {
    ready: boolean;
    confidenceLabel: 'Low confidence' | 'Medium confidence';
    low: number;
    mid: number;
    remainingInquiries: number;
    assumptionsVersion: string;
  };
  score: {
    value: number;
    breakdown: {
      photos: number;
      pricing: number;
      contact: number;
      amenities: number;
      qna: number;
    };
  };
  funnel: {
    stages: ActivationFunnelStage[];
    minimumFunnelSessions: number;
    topDrop: {
      fromId: FunnelStageId;
      toId: FunnelStageId;
      from: string;
      to: string;
      lost: number;
      dropRate: number;
    } | null;
  };
  nextFix: NextBestFixRecommendation | null;
  showPremiumCta: boolean;
};

type BuildActivationSnapshotParams = {
  asOf: string;
  completedStepIds: Set<string>;
  funnelStages: ActivationFunnelStage[];
  onboardingViews: number;
  onboardingInquiries: number;
  marketMedianConversion: number;
  minimumFunnelSessions?: number;
};

const SCORE_WEIGHTS = {
  photos: 30,
  pricing: 20,
  contact: 15,
  amenities: 20,
  qna: 15,
} as const;

const DEFAULT_MINIMUM_FUNNEL_SESSIONS = 5;

export const buildActivationSnapshot = ({
  asOf,
  completedStepIds,
  funnelStages,
  onboardingViews,
  onboardingInquiries,
  marketMedianConversion,
  minimumFunnelSessions = DEFAULT_MINIMUM_FUNNEL_SESSIONS,
}: BuildActivationSnapshotParams): ActivationSnapshot => {
  const checklistSteps: ActivationChecklistStep[] = [
    { id: 'photos', complete: completedStepIds.has('photos') },
    { id: 'pricing', complete: completedStepIds.has('pricing') },
    { id: 'contact_info', complete: completedStepIds.has('contact_info') },
    { id: 'amenities', complete: completedStepIds.has('amenities') },
    { id: 'answer_question', complete: completedStepIds.has('answer_question') },
  ];

  const completedCount = checklistSteps.filter((step) => step.complete).length;
  const totalCount = checklistSteps.length;
  const completionPct = Math.round((completedCount / totalCount) * 100);

  const scoreBreakdown = {
    photos: checklistSteps.find((s) => s.id === 'photos')?.complete ? SCORE_WEIGHTS.photos : 0,
    pricing: checklistSteps.find((s) => s.id === 'pricing')?.complete ? SCORE_WEIGHTS.pricing : 0,
    contact: checklistSteps.find((s) => s.id === 'contact_info')?.complete ? SCORE_WEIGHTS.contact : 0,
    amenities: checklistSteps.find((s) => s.id === 'amenities')?.complete ? SCORE_WEIGHTS.amenities : 0,
    qna: checklistSteps.find((s) => s.id === 'answer_question')?.complete ? SCORE_WEIGHTS.qna : 0,
  };
  const scoreValue = Math.max(
    0,
    Math.min(
      100,
      scoreBreakdown.photos +
        scoreBreakdown.pricing +
        scoreBreakdown.contact +
        scoreBreakdown.amenities +
        scoreBreakdown.qna,
    ),
  );

  const yourConversion = onboardingViews > 0 ? onboardingInquiries / onboardingViews : 0;
  const benchmarkReady = isBenchmarkEligible(onboardingViews, onboardingInquiries);
  const gapPct = Math.max(0, marketMedianConversion - yourConversion);
  const estimatedExtraInquiriesMid = Math.max(0, Math.round(onboardingViews * gapPct));
  const estimatedExtraInquiriesLow = Math.max(0, Math.round(estimatedExtraInquiriesMid * 0.7));
  const roiReady = onboardingInquiries >= BENCHMARK_MIN_INQUIRIES;
  const photoCount = checklistSteps.find((s) => s.id === 'photos')?.complete ? 10 : 2;

  let topDrop: ActivationSnapshot['funnel']['topDrop'] = null;
  if (funnelStages.length >= 2) {
    for (let i = 1; i < funnelStages.length; i += 1) {
      const prev = funnelStages[i - 1];
      const curr = funnelStages[i];
      if (prev.count <= 0) continue;
      const lost = Math.max(0, prev.count - curr.count);
      const dropRate = lost / prev.count;
      if (!topDrop || dropRate > topDrop.dropRate) {
        topDrop = {
          fromId: prev.id,
          toId: curr.id,
          from: prev.label,
          to: curr.label,
          lost,
          dropRate,
        };
      }
    }
    if (topDrop && topDrop.lost <= 0) {
      topDrop = null;
    }
  }

  const quickWinItems: ActivationQuickWinId[] = [];
  if (!checklistSteps.find((s) => s.id === 'photos')?.complete) quickWinItems.push('photos_missing');
  if (!checklistSteps.find((s) => s.id === 'pricing')?.complete) quickWinItems.push('pricing_missing');
  if (!checklistSteps.find((s) => s.id === 'answer_question')?.complete) quickWinItems.push('qa_pending');

  const nextFix = getNextBestFix({
    dropOff: topDrop ? { fromId: topDrop.fromId, toId: topDrop.toId } : null,
    componentCompletion: {
      photos: checklistSteps.find((s) => s.id === 'photos')?.complete ? 1 : 0,
      pricing: checklistSteps.find((s) => s.id === 'pricing')?.complete ? 1 : 0,
      contact: checklistSteps.find((s) => s.id === 'contact_info')?.complete ? 1 : 0,
      amenities: checklistSteps.find((s) => s.id === 'amenities')?.complete ? 1 : 0,
      qna: checklistSteps.find((s) => s.id === 'answer_question')?.complete ? 1 : 0,
    },
  });

  return {
    asOf,
    checklist: {
      completionPct,
      completedCount,
      totalCount,
      steps: checklistSteps,
    },
    quickWins: {
      items: quickWinItems.slice(0, 3),
    },
    benchmark: {
      ready: benchmarkReady,
      confidenceLabel: benchmarkReady ? 'Medium confidence' : 'Low confidence',
      yourConversion,
      marketMedianConversion,
      gapPct,
      remainingViews: Math.max(0, BENCHMARK_MIN_PROFILE_VIEWS - onboardingViews),
      remainingInquiries: Math.max(0, BENCHMARK_MIN_INQUIRIES - onboardingInquiries),
    },
    roi: {
      ready: roiReady,
      confidenceLabel: roiReady ? 'Medium confidence' : 'Low confidence',
      low: estimatedExtraInquiriesLow,
      mid: estimatedExtraInquiriesMid,
      remainingInquiries: Math.max(0, BENCHMARK_MIN_INQUIRIES - onboardingInquiries),
      assumptionsVersion: 'v1',
    },
    score: {
      value: scoreValue,
      breakdown: scoreBreakdown,
    },
    funnel: {
      stages: funnelStages,
      minimumFunnelSessions,
      topDrop,
    },
    nextFix,
    showPremiumCta: shouldShowPremiumCta({
      checklistCompletion: completedCount / totalCount,
      photos: photoCount,
      benchmarkGapPct: gapPct,
    }),
  };
};

