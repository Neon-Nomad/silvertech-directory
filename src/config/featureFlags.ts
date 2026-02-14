export const FEATURE_FLAGS = {
  qa_waiting_badges: true,
  qa_shadow_dashboard: true,
  qa_answer_premium_gate: true,
  qa_operator_alerts_email: false,
  qa_premium_faq_schema: false,
  qa_priority_verified_ordering: false,
  qa_unverified_staleness_labels: false,
  qa_free_tier_limited_clarification: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

