-- Secure facility claims:
-- 1) Operators can only INSERT pending claims.
-- 2) Claim reviewers can list and approve/reject claims via audited RPCs.

-- Tighten insert policy so operators cannot self-approve via direct API calls.
drop policy if exists "Users can create claims" on public.facility_claims;
create policy "Users can create pending claims"
  on public.facility_claims
  for insert
  with check (auth.uid() = user_id and status = 'pending');

-- Reviewer allowlist.
create table if not exists public.claim_reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users(id),
  notes text
);

alter table public.claim_reviewers enable row level security;

drop policy if exists "Reviewers can view own reviewer membership" on public.claim_reviewers;
create policy "Reviewers can view own reviewer membership"
  on public.claim_reviewers
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role manages reviewer membership" on public.claim_reviewers;
create policy "Service role manages reviewer membership"
  on public.claim_reviewers
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.is_claim_reviewer(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.claim_reviewers cr
    where cr.user_id = p_user_id
  );
$$;

create or replace function public.get_pending_facility_claims_for_review()
returns table (
  claim_id uuid,
  facility_id uuid,
  facility_name text,
  claimant_user_id uuid,
  business_email text,
  phone text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_claim_reviewer(v_uid) then
    raise exception 'Not authorized to review claims';
  end if;

  return query
  select
    fc.id as claim_id,
    fc.facility_id,
    coalesce(f.name, 'Unknown Facility') as facility_name,
    fc.user_id as claimant_user_id,
    fc.business_email,
    fc.phone,
    fc.created_at
  from public.facility_claims fc
  left join public.facilities f on f.id = fc.facility_id
  where fc.status = 'pending'
  order by fc.created_at asc;
end;
$$;

create or replace function public.review_facility_claim(
  p_claim_id uuid,
  p_decision text
)
returns table (
  claim_id uuid,
  facility_id uuid,
  claimant_user_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_decision text := lower(coalesce(trim(p_decision), ''));
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_claim_reviewer(v_uid) then
    raise exception 'Not authorized to review claims';
  end if;

  if v_decision not in ('approved', 'rejected') then
    raise exception 'Invalid claim decision. Allowed values: approved, rejected';
  end if;

  return query
  update public.facility_claims fc
  set
    status = v_decision,
    updated_at = now()
  where fc.id = p_claim_id
    and fc.status = 'pending'
  returning fc.id, fc.facility_id, fc.user_id, fc.status;

  if not found then
    raise exception 'Pending claim not found';
  end if;
end;
$$;

grant execute on function public.get_pending_facility_claims_for_review() to authenticated;
grant execute on function public.review_facility_claim(uuid, text) to authenticated;

notify pgrst, 'reload schema';
