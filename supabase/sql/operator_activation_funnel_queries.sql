-- Operator Activation Funnel Query Pack
-- Purpose: Standardize activation reporting across product, ops, and growth teams.
--
-- Assumes an events table with at least:
-- public.operator_activation_events(
--   id uuid primary key,
--   event_name text not null,
--   operator_id uuid not null,
--   facility_id uuid not null,
--   session_id uuid not null,
--   plan_tier text not null,
--   activation_score integer,
--   source_screen text,
--   properties jsonb not null default '{}'::jsonb,
--   occurred_at timestamptz not null default now()
-- )

-- 1) Daily funnel by distinct activation sessions.
with daily_sessions as (
  select
    date_trunc('day', occurred_at)::date as event_day,
    session_id,
    max((event_name = 'operator_claim_completed')::int) as claim_completed,
    max((event_name = 'operator_activation_screen_viewed')::int) as dashboard_viewed,
    max((event_name = 'field_updated')::int) as first_edit_made,
    max((event_name = 'checklist_step_completed')::int) as checklist_step_completed,
    max((event_name = 'benchmark_module_viewed')::int) as benchmark_shown,
    max((event_name = 'roi_module_viewed')::int) as roi_viewed,
    max((event_name = 'premium_cta_clicked')::int) as premium_cta_clicked,
    max((event_name = 'premium_trial_started')::int) as premium_trial_started
  from public.operator_activation_events
  group by 1, 2
)
select
  event_day,
  count(*) as sessions_total,
  sum(claim_completed) as claim_completed_sessions,
  sum(dashboard_viewed) as dashboard_viewed_sessions,
  sum(first_edit_made) as first_edit_sessions,
  sum(checklist_step_completed) as checklist_step_sessions,
  sum(benchmark_shown) as benchmark_sessions,
  sum(roi_viewed) as roi_sessions,
  sum(premium_cta_clicked) as premium_cta_click_sessions,
  sum(premium_trial_started) as trial_start_sessions,
  round(sum(premium_trial_started)::numeric / nullif(sum(claim_completed), 0), 4) as claim_to_trial_rate
from daily_sessions
group by 1
order by 1 desc;

-- 2) Activation quality by checklist completion level.
with checklist_stats as (
  select
    session_id,
    max((properties->>'checklist_completion')::numeric) as checklist_completion,
    max((event_name = 'premium_trial_started')::int) as trial_started
  from public.operator_activation_events
  where event_name in ('checklist_step_completed', 'checklist_completed', 'premium_trial_started')
  group by 1
)
select
  case
    when checklist_completion is null then 'unknown'
    when checklist_completion < 0.4 then '0-39%'
    when checklist_completion < 0.8 then '40-79%'
    else '80-100%'
  end as checklist_band,
  count(*) as sessions,
  sum(trial_started) as trials_started,
  round(sum(trial_started)::numeric / nullif(count(*), 0), 4) as trial_start_rate
from checklist_stats
group by 1
order by 1;

-- 3) Empty-state action effectiveness.
with empty_states as (
  select
    session_id,
    max((event_name = 'empty_state_viewed')::int) as empty_state_seen,
    max((event_name = 'empty_state_action_clicked')::int) as empty_state_action
  from public.operator_activation_events
  where event_name in ('empty_state_viewed', 'empty_state_action_clicked')
  group by 1
)
select
  sum(empty_state_seen) as empty_state_sessions,
  sum(empty_state_action) as action_sessions,
  round(sum(empty_state_action)::numeric / nullif(sum(empty_state_seen), 0), 4) as action_rate
from empty_states;

-- 4) Methodology/Trust interaction rate.
with trust_interactions as (
  select
    session_id,
    max((event_name = 'methodology_viewed')::int) as methodology_viewed,
    max((event_name = 'confidence_label_hovered')::int) as confidence_hovered
  from public.operator_activation_events
  where event_name in ('methodology_viewed', 'confidence_label_hovered')
  group by 1
)
select
  count(*) as sessions_with_trust_events,
  sum(methodology_viewed) as methodology_sessions,
  sum(confidence_hovered) as confidence_hover_sessions
from trust_interactions;

-- 5) Premium CTA performance by observed gap signals.
-- Expected properties on premium_cta_viewed:
-- checklist_completion numeric (0-1), photos integer, benchmark_gap_pct numeric.
select
  case when coalesce((properties->>'checklist_completion')::numeric, 1) < 0.8 then 1 else 0 end as checklist_gap,
  case when coalesce((properties->>'photos')::int, 999) < 10 then 1 else 0 end as photos_gap,
  case when coalesce((properties->>'benchmark_gap_pct')::numeric, 0) >= 0.03 then 1 else 0 end as benchmark_gap,
  count(*) as cta_views,
  count(*) filter (where exists (
    select 1
    from public.operator_activation_events e2
    where e2.session_id = e1.session_id
      and e2.event_name = 'premium_trial_started'
  )) as sessions_with_trial_started
from public.operator_activation_events e1
where e1.event_name = 'premium_cta_viewed'
group by 1, 2, 3
order by cta_views desc;

