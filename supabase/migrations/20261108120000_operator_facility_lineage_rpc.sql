-- Operator-scoped access to the facility lineage view.
-- Facility operators see only facilities they own, without processing errors or trace IDs.
-- Platform staff (claim_reviewers) see every facility, with processing errors and trace IDs. Neither sees raw payloads.
-- Market benchmarks with fewer than 4 facilities are suppressed, so a single competitor's rate is never shown.
create or replace function public.get_operator_facility_lineage(p_limit integer default 200)
returns table (
  normalization_record_id uuid,
  raw_event_id uuid,
  canonical_record_id uuid,
  source_system text,
  occurred_at timestamptz,
  normalization_status text,
  processing_error text,
  attempts integer,
  facility_id uuid,
  facility_name text,
  city text,
  state text,
  profile_strength integer,
  listing_authority_tier text,
  market_benchmark jsonb,
  last_processed_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_staff boolean;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  v_staff := public.is_claim_reviewer(v_uid);

  if not v_staff and not exists (select 1 from public.facilities f where f.owner_id = v_uid) then
    raise exception 'Not authorized to view facility lineage';
  end if;

  return query
  select
    case when v_staff then l.normalization_record_id end,
    case when v_staff then l.raw_event_id end,
    case when v_staff then l.canonical_record_id end,
    l.source_system::text,
    l.occurred_at::timestamptz,
    l.normalization_status::text,
    case when v_staff then l.processing_error end,
    l.attempts::integer,
    l.facility_id,
    l.facility_name::text,
    l.city::text,
    l.state::text,
    l.profile_strength::integer,
    l.listing_authority_tier::text,
    case
      when l.market_benchmark is null then null
      when coalesce((l.market_benchmark ->> 'facility_count')::integer, 0) >= 4 then l.market_benchmark
      else jsonb_build_object(
        'scope', l.market_benchmark ->> 'scope',
        'confidence', 'suppressed',
        'facility_count', null,
        'avg_monthly_rate', null
      )
    end,
    l.last_processed_at::timestamptz
  from public.api_internal_facility_lineage l
  where v_staff or l.facility_id in (select f.id from public.facilities f where f.owner_id = v_uid)
  order by l.last_processed_at desc nulls last
  limit greatest(1, least(coalesce(p_limit, 200), 500));
end
$$;

revoke all on function public.get_operator_facility_lineage(integer) from public, anon;
grant execute on function public.get_operator_facility_lineage(integer) to authenticated;
