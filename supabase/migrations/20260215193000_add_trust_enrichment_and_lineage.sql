-- Trust and enrichment layer for canonical facility normalization.
-- Adds:
-- 1) Profile strength scoring (0-100)
-- 2) Zip/state market benchmark injection
-- 3) Internal lineage/audit view for facility normalization traceability

create or replace function public.calculate_profile_strength(
  p_facility_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_description text;
  v_min_price numeric;
  v_max_price numeric;
  v_photo_count integer := 0;
  v_care_type_count integer := 0;
  v_score integer := 0;
begin
  select
    coalesce(nullif(v_payload->>'description', ''), nullif(f.description, ''), ''),
    case
      when nullif(v_payload->>'min_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
        then (v_payload->>'min_price')::numeric
      else f.min_price
    end,
    case
      when nullif(v_payload->>'max_price', '') ~ '^[0-9]+(\.[0-9]+)?$'
        then (v_payload->>'max_price')::numeric
      else f.max_price
    end
  into
    v_description,
    v_min_price,
    v_max_price
  from public.facilities f
  where f.id = p_facility_id;

  if jsonb_typeof(v_payload->'photos') = 'array' then
    v_photo_count := jsonb_array_length(v_payload->'photos');
  else
    select count(*)
    into v_photo_count
    from public.facility_photos fp
    where fp.facility_id = p_facility_id;
  end if;

  if jsonb_typeof(v_payload->'care_types') = 'array' then
    v_care_type_count := jsonb_array_length(v_payload->'care_types');
  else
    select count(*)
    into v_care_type_count
    from public.facility_care_types fct
    where fct.facility_id = p_facility_id;
  end if;

  -- Description (20)
  if nullif(trim(v_description), '') is not null then
    v_score := v_score + 20;
  end if;

  -- Pricing (20)
  if v_min_price is not null and v_max_price is not null then
    v_score := v_score + 20;
  end if;

  -- Photos (30)
  if v_photo_count >= 8 then
    v_score := v_score + 30;
  elsif v_photo_count >= 4 then
    v_score := v_score + 20;
  elsif v_photo_count >= 1 then
    v_score := v_score + 10;
  end if;

  -- Care types (30)
  if v_care_type_count >= 3 then
    v_score := v_score + 30;
  elsif v_care_type_count = 2 then
    v_score := v_score + 20;
  elsif v_care_type_count = 1 then
    v_score := v_score + 10;
  end if;

  return greatest(0, least(v_score, 100));
end;
$$;

create or replace function public.get_zip_market_benchmark(
  p_postal_code text,
  p_state text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_postal text := nullif(trim(coalesce(p_postal_code, '')), '');
  v_state text := nullif(trim(coalesce(p_state, '')), '');
  v_scope text := 'zip';
  v_count integer := 0;
  v_avg_monthly numeric := null;
  v_confidence text := 'insufficient';
begin
  if v_postal is not null then
    select
      count(*)::integer,
      avg(
        case
          when f.min_price is not null and f.max_price is not null then (f.min_price + f.max_price) / 2
          else coalesce(f.min_price, f.max_price)
        end
      )
    into v_count, v_avg_monthly
    from public.facilities f
    where f.postal_code = v_postal
      and (f.min_price is not null or f.max_price is not null);
  end if;

  if coalesce(v_count, 0) = 0 and v_state is not null then
    v_scope := 'state';
    select
      count(*)::integer,
      avg(
        case
          when f.min_price is not null and f.max_price is not null then (f.min_price + f.max_price) / 2
          else coalesce(f.min_price, f.max_price)
        end
      )
    into v_count, v_avg_monthly
    from public.facilities f
    where f.state = v_state
      and (f.min_price is not null or f.max_price is not null);
  end if;

  if coalesce(v_count, 0) >= 10 then
    v_confidence := 'high';
  elsif coalesce(v_count, 0) >= 4 then
    v_confidence := 'medium';
  elsif coalesce(v_count, 0) >= 1 then
    v_confidence := 'low';
  end if;

  return jsonb_build_object(
    'scope', case when coalesce(v_count, 0) = 0 then 'none' else v_scope end,
    'postal_code', v_postal,
    'state', v_state,
    'facility_count', coalesce(v_count, 0),
    'avg_monthly_rate', case when v_avg_monthly is null then null else round(v_avg_monthly, 2) end,
    'confidence', v_confidence
  );
end;
$$;

create or replace function public.enrich_canonical_facility_payload(
  p_facility_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_postal text;
  v_state text;
  v_profile_strength integer;
  v_benchmark jsonb;
begin
  select
    coalesce(nullif(v_payload->>'postal_code', ''), nullif(f.postal_code, '')),
    coalesce(nullif(v_payload->>'state', ''), nullif(f.state, ''))
  into
    v_postal,
    v_state
  from public.facilities f
  where f.id = p_facility_id;

  v_profile_strength := public.calculate_profile_strength(p_facility_id, v_payload);
  v_benchmark := public.get_zip_market_benchmark(v_postal, v_state);

  return v_payload || jsonb_build_object(
    'profile_strength', v_profile_strength,
    'market_benchmark', v_benchmark,
    'enriched_at', now()
  );
end;
$$;

revoke all on function public.calculate_profile_strength(uuid, jsonb) from public;
revoke all on function public.get_zip_market_benchmark(text, text) from public;
revoke all on function public.enrich_canonical_facility_payload(uuid, jsonb) from public;

grant execute on function public.calculate_profile_strength(uuid, jsonb) to authenticated;
grant execute on function public.get_zip_market_benchmark(text, text) to authenticated;
grant execute on function public.enrich_canonical_facility_payload(uuid, jsonb) to authenticated;

drop view if exists public.api_internal_facility_lineage;
create view public.api_internal_facility_lineage as
with facility_normalization as (
  select
    nr.id as normalization_record_id,
    nr.raw_event_id,
    nr.status as normalization_status,
    nr.processing_error,
    nr.attempts,
    nr.first_processed_at,
    nr.last_processed_at,
    nr.dedupe_key as normalization_dedupe_key,
    nr.normalized_record_id as canonical_record_id,
    re.source_system,
    re.schema_version,
    re.occurred_at,
    re.ingested_at,
    re.payload as raw_payload
  from public.normalization_records nr
  inner join public.raw_events re on re.id = nr.raw_event_id
  where nr.canonical_entity = 'facility'
)
select
  fn.normalization_record_id,
  fn.raw_event_id,
  fn.source_system,
  fn.schema_version,
  fn.occurred_at,
  fn.ingested_at,
  fn.normalization_status,
  fn.processing_error,
  fn.attempts,
  fn.first_processed_at,
  fn.last_processed_at,
  fn.normalization_dedupe_key,
  fn.canonical_record_id,
  cfr.facility_id,
  f.name as facility_name,
  f.city,
  f.state,
  f.postal_code,
  cfr.dedupe_key as canonical_dedupe_key,
  cfr.confidence_score as canonical_confidence_score,
  cfr.last_normalized_at,
  coalesce((cfr.canonical_payload->>'profile_strength')::integer, 0) as profile_strength,
  cfr.canonical_payload->'market_benchmark' as market_benchmark,
  case
    when coalesce((cfr.canonical_payload->>'profile_strength')::integer, 0) >= 85
      and coalesce(cfr.confidence_score, 0) >= 0.8
    then 'authority'
    else 'standard'
  end as listing_authority_tier,
  cil.id as identity_link_id,
  cil.linked_at,
  fn.raw_payload,
  cfr.canonical_payload
from facility_normalization fn
left join public.canonical_facility_records cfr
  on cfr.id = fn.canonical_record_id
left join public.facilities f
  on f.id = cfr.facility_id
left join public.canonical_identity_links cil
  on cil.canonical_entity = 'facility'
 and cil.raw_event_id = fn.raw_event_id
 and cil.canonical_record_id = fn.canonical_record_id;

revoke all on table public.api_internal_facility_lineage from public;
grant select on table public.api_internal_facility_lineage to authenticated;
