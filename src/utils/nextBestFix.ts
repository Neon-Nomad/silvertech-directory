export type FunnelStageId =
  | 'claim'
  | 'view'
  | 'edit'
  | 'checklist'
  | 'benchmark'
  | 'roi'
  | 'cta'
  | 'trial';

export type ActivationComponent = 'photos' | 'pricing' | 'contact' | 'amenities' | 'qna';

export type NextBestFixAction =
  | 'open_quick_wins'
  | 'open_checklist'
  | 'open_benchmark'
  | 'open_roi'
  | 'open_premium_cta'
  | 'start_trial'
  | 'open_pricing'
  | 'open_photos'
  | 'open_contact'
  | 'open_amenities'
  | 'open_qna';

export type NextBestFixRecommendation = {
  fixId: string;
  source: 'dropoff' | 'score_component';
  targetSection: string;
  line: string;
  ctaLabel: string;
  action: NextBestFixAction;
};

type NextBestFixParams = {
  dropOff: { fromId: FunnelStageId; toId: FunnelStageId } | null;
  componentCompletion: Record<ActivationComponent, number>;
};

const DROP_OFF_MAP: Record<string, Omit<NextBestFixRecommendation, 'source'>> = {
  'view->edit': {
    fixId: 'quick_wins',
    targetSection: 'quick-wins-panel',
    line: 'Next best fix: Review quick wins to increase first edits.',
    ctaLabel: 'Review quick wins panel',
    action: 'open_quick_wins',
  },
  'edit->checklist': {
    fixId: 'checklist',
    targetSection: 'guided-setup',
    line: 'Next best fix: Open checklist to convert edits into setup progress.',
    ctaLabel: 'Open checklist',
    action: 'open_checklist',
  },
  'checklist->benchmark': {
    fixId: 'benchmark_visibility',
    targetSection: 'benchmark-gap',
    line: 'Next best fix: Increase benchmark visibility by completing setup essentials.',
    ctaLabel: 'Review benchmark gap',
    action: 'open_benchmark',
  },
  'benchmark->roi': {
    fixId: 'roi_visibility',
    targetSection: 'roi-preview',
    line: 'Next best fix: Unlock ROI visibility by improving benchmark readiness.',
    ctaLabel: 'Open ROI preview',
    action: 'open_roi',
  },
  'roi->cta': {
    fixId: 'cta_copy_or_placement',
    targetSection: 'premium-trial',
    line: 'Next best fix: Improve Premium CTA visibility where operators see ROI context.',
    ctaLabel: 'Review Premium trial section',
    action: 'open_premium_cta',
  },
  'cta->trial': {
    fixId: 'trial_start_friction',
    targetSection: 'premium-trial',
    line: 'Next best fix: Reduce trial friction and start the Premium flow in one click.',
    ctaLabel: 'Start trial',
    action: 'start_trial',
  },
  'claim->view': {
    fixId: 'claim_success_clarity',
    targetSection: 'guided-setup',
    line: 'Next best fix: Clarify claim success handoff with immediate guided setup.',
    ctaLabel: 'Open checklist',
    action: 'open_checklist',
  },
};

const COMPONENT_PRIORITY: ActivationComponent[] = ['pricing', 'photos', 'contact', 'amenities', 'qna'];

const COMPONENT_FIX: Record<ActivationComponent, Omit<NextBestFixRecommendation, 'source'>> = {
  pricing: {
    fixId: 'pricing',
    targetSection: 'guided-setup',
    line: 'Next best fix: Add pricing range (worth +20 score).',
    ctaLabel: 'Update pricing',
    action: 'open_pricing',
  },
  photos: {
    fixId: 'photos',
    targetSection: 'guided-setup',
    line: 'Next best fix: Add photos (worth +30 score).',
    ctaLabel: 'Add photos',
    action: 'open_photos',
  },
  contact: {
    fixId: 'contact',
    targetSection: 'guided-setup',
    line: 'Next best fix: Confirm contact info (worth +15 score).',
    ctaLabel: 'Update contact info',
    action: 'open_contact',
  },
  amenities: {
    fixId: 'amenities',
    targetSection: 'guided-setup',
    line: 'Next best fix: Complete care types and amenities (worth +20 score).',
    ctaLabel: 'Update amenities',
    action: 'open_amenities',
  },
  qna: {
    fixId: 'qna',
    targetSection: 'guided-setup',
    line: 'Next best fix: Answer one question (worth +15 score).',
    ctaLabel: 'Answer a question',
    action: 'open_qna',
  },
};

export const getNextBestFix = ({
  dropOff,
  componentCompletion,
}: NextBestFixParams): NextBestFixRecommendation | null => {
  if (dropOff) {
    const dropOffKey = `${dropOff.fromId}->${dropOff.toId}`;
    const mapped = DROP_OFF_MAP[dropOffKey];
    if (mapped) {
      return { ...mapped, source: 'dropoff' };
    }
  }

  const candidates = COMPONENT_PRIORITY
    .map((component) => ({ component, completion: componentCompletion[component] ?? 0 }))
    .sort((a, b) => {
      if (a.completion !== b.completion) return a.completion - b.completion;
      return COMPONENT_PRIORITY.indexOf(a.component) - COMPONENT_PRIORITY.indexOf(b.component);
    });

  const lowest = candidates[0];
  if (!lowest || lowest.completion >= 1) return null;

  return {
    ...COMPONENT_FIX[lowest.component],
    source: 'score_component',
  };
};

