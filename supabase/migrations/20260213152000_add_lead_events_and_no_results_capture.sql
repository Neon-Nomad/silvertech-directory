-- Attribution events for operator lead intelligence
create table if not exists lead_events (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references facilities(id) on delete cascade not null,
  session_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (
    event_type in (
      'phone_reveal',
      'directions_clicked',
      'comparison_added',
      'faq_viewed',
      'page_view',
      'schedule_tour'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_events_facility_created_at
  on lead_events (facility_id, created_at desc);

create index if not exists idx_lead_events_session_created_at
  on lead_events (session_id, created_at desc);

create index if not exists idx_lead_events_event_type_created_at
  on lead_events (event_type, created_at desc);

alter table lead_events enable row level security;

drop policy if exists "Operators can view own facility events" on lead_events;
create policy "Operators can view own facility events"
  on lead_events
  for select
  using (
    facility_id in (
      select id from facilities where owner_id = auth.uid()
    )
  );

drop policy if exists "Anyone can insert lead events" on lead_events;
create policy "Anyone can insert lead events"
  on lead_events
  for insert
  with check (true);

-- Extend existing leads table for no-results demand capture
alter table leads
  add column if not exists source text not null default 'facility_inquiry',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists care_type text,
  add column if not exists budget text,
  add column if not exists requested_location text,
  add column if not exists session_id uuid;

create index if not exists idx_leads_source_created_at
  on leads (source, created_at desc);

create index if not exists idx_leads_requested_location
  on leads (requested_location);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_source_check'
  ) then
    alter table leads
      add constraint leads_source_check
      check (source in ('facility_inquiry', 'no_results'));
  end if;
end $$;

-- Benchmark helper for operator dashboard (security definer, aggregated only)
create or replace function public.get_operator_signal_benchmark()
returns table (
  your_signals_week bigint,
  peer_avg_week numeric
)
language sql
security definer
set search_path = public
as $$
  with owned as (
    select id, city
    from facilities
    where owner_id = auth.uid()
  ),
  owned_cities as (
    select distinct city
    from owned
    where city is not null and city <> ''
  ),
  your as (
    select count(*)::bigint as c
    from lead_events le
    join owned o on o.id = le.facility_id
    where le.created_at >= now() - interval '7 days'
  ),
  peer_facilities as (
    select f.id
    from facilities f
    join owned_cities oc on oc.city = f.city
    where f.owner_id is not null and f.owner_id <> auth.uid()
  ),
  peer_counts as (
    select le.facility_id, count(*)::numeric as c
    from lead_events le
    join peer_facilities pf on pf.id = le.facility_id
    where le.created_at >= now() - interval '7 days'
    group by le.facility_id
  )
  select
    coalesce((select c from your), 0) as your_signals_week,
    coalesce((select avg(c) from peer_counts), 0)::numeric(10, 2) as peer_avg_week;
$$;

revoke all on function public.get_operator_signal_benchmark() from public;
grant execute on function public.get_operator_signal_benchmark() to authenticated;
