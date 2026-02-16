# Operator Activation Event Contract

This is the single analytics contract for onboarding and activation in the operator dashboard.

## Required Event Fields

Every activation event must include:

- `operator_id`
- `facility_id`
- `session_id`
- `plan_tier`
- `activation_score`
- `source_screen`
- `timestamp` (generated client-side if omitted)

Optional event-specific details should be added in extra properties.

## Canonical Event Names

- `operator_claim_completed`
- `operator_activation_screen_viewed`
- `checklist_step_started`
- `checklist_step_completed`
- `checklist_completed`
- `quickwin_clicked`
- `field_updated`
- `autosave_triggered`
- `benchmark_module_viewed`
- `benchmark_tooltip_opened`
- `roi_module_viewed`
- `roi_tooltip_opened`
- `premium_cta_viewed`
- `premium_cta_clicked`
- `premium_trial_started`
- `empty_state_viewed`
- `empty_state_action_clicked`
- `methodology_viewed`
- `confidence_label_hovered`
- `activation_score_viewed`
- `activation_score_improved`

## Deterministic Gate Conditions

Benchmark visibility threshold:

- `profile_views >= 25`
- `inquiries >= 5`

Contextual premium CTA:

- show when `checklist_completion < 0.8`
- OR `photos < 10`
- OR `benchmark_gap_pct >= 0.03`

## Source of Truth

Type-safe implementation:

- `src/config/activationEvents.ts`

SQL funnel/report pack:

- `supabase/sql/operator_activation_funnel_queries.sql`

