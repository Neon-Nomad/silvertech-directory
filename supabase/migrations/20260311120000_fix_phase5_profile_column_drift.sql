-- Drift fix: facilities profile columns + phase5 RPC compatibility.
-- This repairs environments where phase5 RPCs reference columns that were never present.

alter table public.facilities
  add column if not exists description text,
  add column if not exists website text,
  add column if not exists email text,
  add column if not exists min_price numeric,
  add column if not exists max_price numeric;

create or replace function public.get_operator_facility_profile_state(p_facility_id uuid)
returns table (
  facility_id uuid,
  draft_version_id uuid,
  draft_version_no integer,
  published_version_id uuid,
  published_version_no integer,
  payload jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_draft record;
  v_published record;
  v_base_payload jsonb;
  v_payload jsonb;
begin
  select f.owner_id
  into v_owner
  from public.facilities f
  where f.id = p_facility_id;

  if v_owner is null or v_owner <> auth.uid() then
    return;
  end if;

  select fpv.id, fpv.version_no, fpv.payload
  into v_draft
  from public.facility_profile_versions fpv
  where fpv.facility_id = p_facility_id
    and fpv.status = 'draft'
  order by fpv.updated_at desc
  limit 1;

  select fpv.id, fpv.version_no, fpv.payload
  into v_published
  from public.facility_profile_versions fpv
  where fpv.facility_id = p_facility_id
    and fpv.status = 'published'
  order by fpv.published_at desc nulls last, fpv.updated_at desc
  limit 1;

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
  into v_base_payload
  from public.facilities f
  where f.id = p_facility_id;

  v_payload := coalesce(v_draft.payload, v_published.payload, v_base_payload, '{}'::jsonb);

  return query
  select
    p_facility_id,
    v_draft.id,
    v_draft.version_no,
    v_published.id,
    v_published.version_no,
    v_payload;
end;
$$;

create or replace function public.publish_operator_facility_profile(
  p_facility_id uuid
)
returns table (
  version_id uuid,
  version_no integer,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

grant execute on function public.get_operator_facility_profile_state(uuid) to authenticated;
grant execute on function public.publish_operator_facility_profile(uuid) to authenticated;
