-- Claims are allowed only for facilities that are reviewed, unique identities (from data/facility-uuid-map.tsv)
-- and that have no owner yet. Duplicate, conflicting, and unmatched facilities never become claimable.
--
-- Deployment order: apply this migration, then load supabase/seed-data/facility_claim_eligibility.sql,
-- then deploy the frontend. Until the seed is loaded, no facility is claimable and claims fail safely.

create table if not exists public.facility_claim_eligibility (
  facility_id uuid primary key references public.facilities(id) on delete cascade,
  source text not null default 'facility-uuid-map',
  added_at timestamptz not null default now()
);

alter table public.facility_claim_eligibility enable row level security;

-- Clients never read or write this table directly. The functions below expose only the answer to a question.
revoke all on public.facility_claim_eligibility from public, anon, authenticated;
grant select, insert, delete on public.facility_claim_eligibility to service_role;

-- Which of these facility IDs are reviewed identities? Returns IDs only, never other columns.
create or replace function public.reviewed_facility_ids(p_facility_ids uuid[])
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select e.facility_id
  from public.facility_claim_eligibility e
  where e.facility_id = any (p_facility_ids);
$$;

-- Can this facility be claimed right now? Reviewed identity and no owner yet.
create or replace function public.is_claimable_facility(p_facility_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.facility_claim_eligibility e
    join public.facilities f on f.id = e.facility_id
    where e.facility_id = p_facility_id
      and f.owner_id is null
  );
$$;

revoke all on function public.reviewed_facility_ids(uuid[]) from public;
revoke all on function public.is_claimable_facility(uuid) from public;
grant execute on function public.reviewed_facility_ids(uuid[]) to anon, authenticated;
grant execute on function public.is_claimable_facility(uuid) to anon, authenticated;

-- Replaces the insert policy from 20260222124500. Ownership and eligibility are checked by the database,
-- so a direct API call cannot claim a duplicate, conflicting, or already-owned facility.
drop policy if exists "Users can create pending claims" on public.facility_claims;
create policy "Users can create pending claims on claimable facilities"
  on public.facility_claims
  for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and public.is_claimable_facility(facility_id)
  );
