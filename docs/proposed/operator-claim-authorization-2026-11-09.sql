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

-- 1. user_profiles: clients may not write plan, billing, or slot columns, and may not create profile rows with them.
--    The app never writes user_profiles directly (checked in the repo), so no client write path is removed.
revoke insert, update on public.user_profiles from anon, authenticated;

-- 2. facilities: clients may update only the editable profile fields.
--    Protected: id, created_at, owner_id, listing_tier, claimed_at, plan_updated_at, public_route_id, public_slug,
--    primary_care_type_slug. Ownership changes go through the claim review; tiers come from the billing triggers.
revoke update on public.facilities from anon, authenticated;
grant update (
  name, address_line1, address_line2, city, state, postal_code, latitude, longitude, phone,
  website_url, google_maps_url, verified_phone, business_status, online_presence_updated_at,
  assigned_plan_owner_id, description, website, email, min_price, max_price, updated_at,
  state_license_number, cms_certification_number, county, beds, ownership_type, license_type,
  issuing_agency, last_verified_date, data_source, virtual_tour_url, tour_scheduling_url
) on public.facilities to authenticated;

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

commit;
