-- Tour features: virtual tour URL, scheduling URL, and aggregate tour interest tracking.
-- Family email is NEVER stored against a facility. Facilities see aggregate counts only.

alter table public.facilities
  add column if not exists virtual_tour_url  text,
  add column if not exists tour_scheduling_url text;

comment on column public.facilities.virtual_tour_url    is 'Embed URL for 360° / virtual tour (YouTube, Matterport, Tourweaver, etc.)';
comment on column public.facilities.tour_scheduling_url is 'Booking link for in-person tours (Calendly, Acuity, or facility site)';

-- Aggregate tour interest — no PII stored per facility_id.
-- Family email only goes to Brevo for the one-time guide email, never here.
create table if not exists public.facility_tour_interest (
  id              uuid        primary key default gen_random_uuid(),
  facility_id     uuid        not null references public.facilities(id) on delete cascade,
  care_type       text,
  guide_downloaded boolean    not null default true,
  opted_in_contact boolean    not null default false,
  visit_note      text        check (char_length(visit_note) <= 300),
  created_at      timestamptz not null default now()
);

create index if not exists idx_fti_facility_created
  on public.facility_tour_interest (facility_id, created_at desc);

alter table public.facility_tour_interest enable row level security;

-- Public (anonymous) visitors can log tour interest
drop policy if exists fti_public_insert on public.facility_tour_interest;
create policy fti_public_insert
  on public.facility_tour_interest
  for insert
  with check (true);

-- Operators can read aggregate rows for facilities they own — no family contact info is here
drop policy if exists fti_owner_select on public.facility_tour_interest;
create policy fti_owner_select
  on public.facility_tour_interest
  for select
  using (
    exists (
      select 1 from public.facilities f
      where f.id = facility_tour_interest.facility_id
        and f.owner_id = auth.uid()
    )
  );

-- Convenience RPC: returns monthly tour interest stats for a facility
create or replace function public.get_facility_tour_stats(p_facility_id uuid)
returns table (
  total_interest   bigint,
  opted_in         bigint,
  this_month       bigint,
  last_month       bigint
)
language sql
security definer
set search_path = public
as $$
  select
    count(*)                                                                          as total_interest,
    count(*) filter (where opted_in_contact)                                          as opted_in,
    count(*) filter (where created_at >= date_trunc('month', now()))                  as this_month,
    count(*) filter (where created_at >= date_trunc('month', now()) - interval '1 month'
                       and created_at <  date_trunc('month', now()))                  as last_month
  from public.facility_tour_interest
  where facility_id = p_facility_id
    and exists (
      select 1 from public.facilities f
      where f.id = p_facility_id
        and f.owner_id = auth.uid()
    );
$$;

grant execute on function public.get_facility_tour_stats(uuid) to authenticated;
