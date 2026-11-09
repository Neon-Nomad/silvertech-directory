-- Operator profile draft and publish fix. Proposed for owner review. NOT applied to production.
--
-- Defect: save_operator_facility_profile_draft and publish_operator_facility_profile fail with error 42702
-- ("column reference ... is ambiguous"). Their RETURNS TABLE output names (version_no, status) match table column
-- names used in RETURNING and SELECT clauses. Reproduced on the local test stack; the production definitions have no
-- directive (checked read-only).
--
-- Fix: add "#variable_conflict use_column" to both function bodies. The bodies are otherwise unchanged; they are the
-- live definitions from the local stack, which match migration 20260215153000.
--
-- Run in the Supabase SQL Editor after review. Not part of supabase db push.

begin;

CREATE OR REPLACE FUNCTION public.save_operator_facility_profile_draft(p_facility_id uuid, p_payload jsonb)
 RETURNS TABLE(version_id uuid, version_no integer, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
  v_owner uuid;
  v_existing_draft_id uuid;
  v_existing_draft_no integer;
  v_next_no integer;
begin
  select f.owner_id
  into v_owner
  from public.facilities f
  where f.id = p_facility_id;

  if v_owner is null or v_owner <> auth.uid() then
    return;
  end if;

  select fpv.id, fpv.version_no
  into v_existing_draft_id, v_existing_draft_no
  from public.facility_profile_versions fpv
  where fpv.facility_id = p_facility_id
    and fpv.status = 'draft'
  order by fpv.updated_at desc
  limit 1;

  if v_existing_draft_id is not null then
    update public.facility_profile_versions
    set payload = coalesce(p_payload, '{}'::jsonb),
        updated_at = now()
    where id = v_existing_draft_id;

    return query
    select v_existing_draft_id, v_existing_draft_no, 'draft'::text;
    return;
  end if;

  select coalesce(max(fpv.version_no), 0) + 1
  into v_next_no
  from public.facility_profile_versions fpv
  where fpv.facility_id = p_facility_id;

  insert into public.facility_profile_versions (
    facility_id,
    version_no,
    status,
    payload,
    created_by
  )
  values (
    p_facility_id,
    v_next_no,
    'draft',
    coalesce(p_payload, '{}'::jsonb),
    auth.uid()
  )
  returning id, version_no, status
  into version_id, version_no, status;

  return next;
end;
$function$;

CREATE OR REPLACE FUNCTION public.publish_operator_facility_profile(p_facility_id uuid)
 RETURNS TABLE(version_id uuid, version_no integer, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
#variable_conflict use_column
declare
  v_owner uuid;
  v_draft_id uuid;
  v_draft_no integer;
  v_payload jsonb;
  v_next_no integer;
begin
  select f.owner_id
  into v_owner
  from public.facilities f
  where f.id = p_facility_id;

  if v_owner is null or v_owner <> auth.uid() then
    return;
  end if;

  select fpv.id, fpv.version_no, fpv.payload
  into v_draft_id, v_draft_no, v_payload
  from public.facility_profile_versions fpv
  where fpv.facility_id = p_facility_id
    and fpv.status = 'draft'
  order by fpv.updated_at desc
  limit 1;

  if v_draft_id is null then
    select coalesce(max(fpv.version_no), 0) + 1
    into v_next_no
    from public.facility_profile_versions fpv
    where fpv.facility_id = p_facility_id;

    select jsonb_build_object(
      'name', f.name,
      'description', coalesce(f.description, ''),
      'phone', coalesce(f.phone, ''),
      'website', coalesce(f.website, ''),
      'email', coalesce(f.email, ''),
      'address_line1', coalesce(f.address_line1, ''),
      'city', coalesce(f.city, ''),
      'state', coalesce(f.state, ''),
      'postal_code', coalesce(f.postal_code, ''),
      'min_price', f.min_price,
      'max_price', f.max_price,
      'listing_tier', coalesce(f.listing_tier, 'free'),
      'plan',
        case
          when coalesce(f.listing_tier, 'free') = 'free' then 'basic'
          else coalesce(f.listing_tier, 'free')
        end
    )
    into v_payload
    from public.facilities f
    where f.id = p_facility_id;

    insert into public.facility_profile_versions (
      facility_id,
      version_no,
      status,
      payload,
      created_by
    )
    values (
      p_facility_id,
      v_next_no,
      'draft',
      coalesce(v_payload, '{}'::jsonb),
      auth.uid()
    )
    returning id, version_no
    into v_draft_id, v_draft_no;
  end if;

  update public.facility_profile_versions
  set status = 'archived',
      updated_at = now()
  where facility_id = p_facility_id
    and status = 'published';

  update public.facility_profile_versions
  set status = 'published',
      published_at = now(),
      updated_at = now()
  where id = v_draft_id;

  select fpv.payload
  into v_payload
  from public.facility_profile_versions fpv
  where fpv.id = v_draft_id;

  update public.facilities f
  set
    name = coalesce(v_payload->>'name', f.name),
    description = coalesce(v_payload->>'description', ''),
    phone = nullif(v_payload->>'phone', ''),
    website = nullif(v_payload->>'website', ''),
    email = nullif(v_payload->>'email', ''),
    min_price = case
      when nullif(v_payload->>'min_price', '') is null then null
      else (v_payload->>'min_price')::numeric
    end,
    max_price = case
      when nullif(v_payload->>'max_price', '') is null then null
      else (v_payload->>'max_price')::numeric
    end,
    updated_at = now()
  where f.id = p_facility_id;

  return query
  select v_draft_id, v_draft_no, 'published'::text;
end;
$function$;

commit;
