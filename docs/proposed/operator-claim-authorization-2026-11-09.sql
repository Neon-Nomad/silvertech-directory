-- Operator claim and billing authorization fixes. Proposed for owner review. NOT applied to production.
--
-- Fixes three verified problems, each reproduced on the local test stack before this change:
--   1. An operator could set their own plan and billing_status on user_profiles (PostgREST PATCH).
--   2. An owner could set their own listing_tier on facilities (and could change owner_id).
--   3. Approving a pending claim on a facility that already has an owner silently replaced the owner.
--
-- Scope: column-level privileges for the anon and authenticated roles, and one guard in review_facility_claim.
-- Row-level policies are unchanged. The service role (webhooks, server functions) keeps full access, and the
-- triggers and security definer functions that set these columns are unaffected.
--
-- Run in the Supabase SQL Editor after review. Not part of supabase db push.

begin;

-- 1. user_profiles: clients may not insert or update any column.
--    Supabase also grants column-level privileges, and those survive a table-level revoke, so each column is revoked
--    explicitly. The app never writes user_profiles directly (checked in the repo), so no client write path is removed.
revoke insert, update on public.user_profiles from anon, authenticated;
do $$
declare r record;
begin
  for r in select a.attname from pg_attribute a
           where a.attrelid = 'public.user_profiles'::regclass and a.attnum > 0 and not a.attisdropped loop
    execute format('revoke insert (%I), update (%I) on public.user_profiles from anon, authenticated', r.attname, r.attname);
  end loop;
end $$;

-- 2. facilities: clients may update only the editable profile fields.
--    Protected: id, created_at, owner_id, listing_tier, claimed_at, plan_updated_at, public_route_id, public_slug,
--    primary_care_type_slug, assigned_plan_owner_id. Ownership changes go through the claim review; tiers come from the
--    billing triggers; plan-slot assignment is server-controlled. Column-level privileges are revoked for every column
--    first, then the editable columns are granted back to authenticated.
revoke update on public.facilities from anon, authenticated;
do $$
declare r record;
begin
  for r in select a.attname from pg_attribute a
           where a.attrelid = 'public.facilities'::regclass and a.attnum > 0 and not a.attisdropped loop
    execute format('revoke update (%I) on public.facilities from anon, authenticated', r.attname);
  end loop;
end $$;
grant update (
  name, address_line1, address_line2, city, state, postal_code, latitude, longitude, phone,
  website_url, google_maps_url, verified_phone, business_status, online_presence_updated_at,
  description, website, email, min_price, max_price, updated_at,
  state_license_number, cms_certification_number, county, beds, ownership_type, license_type,
  issuing_agency, last_verified_date, data_source, virtual_tour_url, tour_scheduling_url
) on public.facilities to authenticated;

-- 2b. facilities: clients do not insert facilities (RLS already denies it; the app inserts claims, not facilities). Revoked
--     at both table and column level for defense in depth.
revoke insert on public.facilities from anon, authenticated;
do $$
declare r record;
begin
  for r in select a.attname from pg_attribute a
           where a.attrelid = 'public.facilities'::regclass and a.attnum > 0 and not a.attisdropped loop
    execute format('revoke insert (%I) on public.facilities from anon, authenticated', r.attname);
  end loop;
end $$;

-- 3. review_facility_claim: an approval may not replace an existing, different owner.
create or replace function public.review_facility_claim(p_claim_id uuid, p_decision text)
returns table (claim_id uuid, facility_id uuid, claimant_user_id uuid, status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
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

  if v_decision = 'approved' and exists (
    select 1
    from public.facility_claims fc
    join public.facilities f on f.id = fc.facility_id
    where fc.id = p_claim_id
      and fc.status = 'pending'
      and f.owner_id is not null
      and f.owner_id <> fc.user_id
  ) then
    raise exception 'Facility already has an owner; the claim cannot be approved';
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
$function$;

-- 4. Ownership trigger: an approval may not replace an existing, different owner on any path (review RPC, service role).
--    Body is the live definition with one guard added at the top of the approval branch.
CREATE OR REPLACE FUNCTION public.sync_facility_ownership_from_claim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_has_assigned_plan_owner boolean := false;
  v_has_claimed_at boolean := false;
  v_should_sync boolean := false;
begin
  if tg_op = 'INSERT' then
    v_should_sync := new.status = 'approved';
  elsif tg_op = 'UPDATE' then
    v_should_sync := new.status = 'approved'
      and (
        old.status is distinct from new.status
        or old.user_id is distinct from new.user_id
      );
  end if;

  if v_should_sync and exists (
    select 1 from public.facilities f
    where f.id = new.facility_id
      and f.owner_id is not null
      and f.owner_id <> new.user_id
  ) then
    raise exception 'Facility already has an owner; the claim cannot be approved';
  end if;

  if v_should_sync then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'facilities'
        and column_name = 'assigned_plan_owner_id'
    ) into v_has_assigned_plan_owner;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'facilities'
        and column_name = 'claimed_at'
    ) into v_has_claimed_at;

    if v_has_assigned_plan_owner and v_has_claimed_at then
      update public.facilities
      set
        owner_id = new.user_id,
        assigned_plan_owner_id = case
          when exists (select 1 from public.user_profiles up where up.id = new.user_id)
          then new.user_id
          else null
        end,
        claimed_at = coalesce(claimed_at, now())
      where id = new.facility_id;
    elsif v_has_assigned_plan_owner then
      update public.facilities
      set
        owner_id = new.user_id,
        assigned_plan_owner_id = case
          when exists (select 1 from public.user_profiles up where up.id = new.user_id)
          then new.user_id
          else null
        end
      where id = new.facility_id;
    elsif v_has_claimed_at then
      update public.facilities
      set
        owner_id = new.user_id,
        claimed_at = coalesce(claimed_at, now())
      where id = new.facility_id;
    else
      update public.facilities
      set owner_id = new.user_id
      where id = new.facility_id;
    end if;

    update public.facility_claims
    set
      status = 'rejected',
      updated_at = now()
    where facility_id = new.facility_id
      and id <> new.id
      and status = 'pending';
  end if;

  new.updated_at = now();
  return new;
end;
$function$;


commit;
