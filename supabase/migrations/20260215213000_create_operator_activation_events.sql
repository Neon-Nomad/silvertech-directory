-- Operator activation analytics foundation
-- Supports activation funnel tracking with strict role/facility ownership constraints.

create table if not exists public.operator_activation_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (
    event_name in (
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
      'activation_score_improved'
    )
  ),
  operator_id uuid not null references auth.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  session_id uuid not null,
  plan_tier text not null default 'unknown' check (plan_tier in ('free', 'premium', 'enterprise', 'unknown')),
  activation_score integer not null default 0 check (activation_score >= 0 and activation_score <= 100),
  source_screen text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (jsonb_typeof(properties) = 'object')
);

create index if not exists idx_operator_activation_events_event_name_occurred_at
  on public.operator_activation_events (event_name, occurred_at desc);

create index if not exists idx_operator_activation_events_session_occurred_at
  on public.operator_activation_events (session_id, occurred_at desc);

create index if not exists idx_operator_activation_events_operator_occurred_at
  on public.operator_activation_events (operator_id, occurred_at desc);

create index if not exists idx_operator_activation_events_facility_occurred_at
  on public.operator_activation_events (facility_id, occurred_at desc);

alter table public.operator_activation_events enable row level security;

drop policy if exists "Operators can insert own activation events" on public.operator_activation_events;
create policy "Operators can insert own activation events"
  on public.operator_activation_events
  for insert
  with check (
    operator_id = auth.uid()
    and facility_id in (
      select f.id
      from public.facilities f
      where f.owner_id = auth.uid()
    )
  );

drop policy if exists "Operators can view own activation events" on public.operator_activation_events;
create policy "Operators can view own activation events"
  on public.operator_activation_events
  for select
  using (operator_id = auth.uid());

drop policy if exists "Service role manages operator activation events" on public.operator_activation_events;
create policy "Service role manages operator activation events"
  on public.operator_activation_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.track_operator_activation_event(
  p_event_name text,
  p_facility_id uuid,
  p_session_id uuid,
  p_plan_tier text default 'unknown',
  p_activation_score integer default 0,
  p_source_screen text default 'dashboard',
  p_properties jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if p_properties is null or jsonb_typeof(p_properties) <> 'object' then
    raise exception 'Event properties must be a JSON object';
  end if;

  if not exists (
    select 1
    from public.facilities f
    where f.id = p_facility_id
      and f.owner_id = v_uid
  ) then
    raise exception 'Facility is not owned by the current operator';
  end if;

  insert into public.operator_activation_events (
    event_name,
    operator_id,
    facility_id,
    session_id,
    plan_tier,
    activation_score,
    source_screen,
    properties,
    occurred_at
  )
  values (
    p_event_name,
    v_uid,
    p_facility_id,
    p_session_id,
    coalesce(nullif(trim(p_plan_tier), ''), 'unknown'),
    greatest(0, least(coalesce(p_activation_score, 0), 100)),
    coalesce(nullif(trim(p_source_screen), ''), 'dashboard'),
    p_properties,
    coalesce(p_occurred_at, now())
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.track_operator_activation_event(
  text,
  uuid,
  uuid,
  text,
  integer,
  text,
  jsonb,
  timestamptz
) from public;

grant execute on function public.track_operator_activation_event(
  text,
  uuid,
  uuid,
  text,
  integer,
  text,
  jsonb,
  timestamptz
) to authenticated;

revoke all on table public.operator_activation_events from public;
grant select, insert on table public.operator_activation_events to authenticated;
