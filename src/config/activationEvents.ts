import { trackEvent } from '@/src/utils/analytics';

export const ACTIVATION_EVENT_NAMES = [
  'operator_claim_completed',
  'operator_activation_screen_viewed',
  'checklist_step_started',
  'checklist_step_completed',
  'checklist_completed',
  'quickwin_clicked',
  'field_updated',
  'autosave_triggered',
  'benchmark_module_viewed',
  'benchmark_tooltip_opened',
  'roi_module_viewed',
  'roi_tooltip_opened',
  'premium_cta_viewed',
  'premium_cta_clicked',
  'premium_trial_started',
  'empty_state_viewed',
  'empty_state_action_clicked',
  'methodology_viewed',
  'confidence_label_hovered',
  'activation_score_viewed',
  'activation_score_improved',
] as const;

export type ActivationEventName = (typeof ACTIVATION_EVENT_NAMES)[number];

export type PlanTier = 'free' | 'premium' | 'enterprise' | 'unknown';

export type ActivationEventContext = {
  operator_id: string;
  facility_id: string;
  session_id: string;
  plan_tier: PlanTier;
  activation_score: number;
  source_screen: string;
  timestamp?: string;
};

export type ActivationEventPayload = ActivationEventContext & Record<string, string | number | boolean | null | undefined>;

export const ACTIVATION_REQUIRED_KEYS: ReadonlyArray<keyof ActivationEventContext> = [
  'operator_id',
  'facility_id',
  'session_id',
  'plan_tier',
  'activation_score',
  'source_screen',
];

export const BENCHMARK_MIN_PROFILE_VIEWS = 25;
export const BENCHMARK_MIN_INQUIRIES = 5;

export const isBenchmarkEligible = (profileViews: number, inquiries: number): boolean =>
  profileViews >= BENCHMARK_MIN_PROFILE_VIEWS && inquiries >= BENCHMARK_MIN_INQUIRIES;

export type PremiumCtaGateInput = {
  checklistCompletion: number;
  photos: number;
  benchmarkGapPct: number;
};

// Deterministic gate for contextual premium CTA visibility.
export const shouldShowPremiumCta = (input: PremiumCtaGateInput): boolean =>
  input.checklistCompletion < 0.8 || input.photos < 10 || input.benchmarkGapPct >= 0.03;

export const sanitizeActivationScore = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

export const buildActivationEventPayload = (
  context: ActivationEventContext,
  extra: Record<string, string | number | boolean | null | undefined> = {},
): ActivationEventPayload => ({
  ...context,
  activation_score: sanitizeActivationScore(context.activation_score),
  timestamp: context.timestamp || new Date().toISOString(),
  ...extra,
});

export const trackActivationEvent = (
  name: ActivationEventName,
  context: ActivationEventContext,
  extra: Record<string, string | number | boolean | null | undefined> = {},
): void => {
  const payload = buildActivationEventPayload(context, extra);
  trackEvent(name, payload);
};

