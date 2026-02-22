-- Fix claim review RPC return type mismatch:
-- facility_claims.created_at is timestamp without time zone.
-- RPC declared timestamptz, which caused runtime 400.

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
    (fc.created_at at time zone 'utc') as created_at
  from public.facility_claims fc
  left join public.facilities f on f.id = fc.facility_id
  where fc.status = 'pending'
  order by fc.created_at asc;
end;
$$;

notify pgrst, 'reload schema';
