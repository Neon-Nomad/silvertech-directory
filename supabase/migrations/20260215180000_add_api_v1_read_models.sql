-- API-ready read models built on canonical normalization tables.
-- These are stable contracts for future external API exposure.

drop view if exists public.api_v1_facility_profile_summary;
create view public.api_v1_facility_profile_summary as
with latest_canonical as (
  select distinct on (cfr.facility_id)
    cfr.facility_id,
    cfr.id as canonical_record_id,
    cfr.canonical_payload,
    cfr.confidence_score,
    cfr.last_normalized_at,
    cfr.source_system,
    cfr.schema_version
  from public.canonical_facility_records cfr
  where cfr.facility_id is not null
  order by cfr.facility_id, cfr.last_normalized_at desc
),
profile_versions as (
  select
    fpv.facility_id,
    max(fpv.updated_at) as profile_updated_at
  from public.facility_profile_versions fpv
  where fpv.status = 'published'
  group by fpv.facility_id
)
select
  f.id as facility_id,
  f.name as facility_name,
  f.city,
  f.state,
  f.postal_code,
  f.phone,
  f.website_url,
  coalesce(lc.confidence_score, 0) as confidence_score,
  lc.source_system as canonical_source_system,
  lc.schema_version as canonical_schema_version,
  coalesce(pv.profile_updated_at, f.updated_at, f.created_at)::timestamptz as profile_updated_at,
  lc.last_normalized_at as canonical_last_normalized_at,
  coalesce((lc.canonical_payload ->> 'profile_strength')::numeric, 0) as profile_strength_score,
  coalesce((lc.canonical_payload ->> 'qa_response_rate')::numeric, 0) as qa_response_rate,
  now()::timestamptz as data_as_of
from public.facilities f
left join latest_canonical lc on lc.facility_id = f.id
left join profile_versions pv on pv.facility_id = f.id;

drop view if exists public.api_v1_lead_lifecycle;
create view public.api_v1_lead_lifecycle as
with latest_lead as (
  select distinct on (clr.lead_id)
    clr.lead_id,
    clr.id as canonical_lead_record_id,
    clr.confidence_score,
    clr.last_normalized_at,
    clr.analytics_payload
  from public.canonical_lead_records clr
  where clr.lead_id is not null
  order by clr.lead_id, clr.last_normalized_at desc
),
lead_events_rollup as (
  select
    cler.lead_id,
    min(cler.occurred_at) as first_event_at,
    max(cler.occurred_at) as last_event_at,
    count(*) as total_events,
    count(*) filter (where cler.event_type = 'schedule_tour') as tour_events
  from public.canonical_lead_event_records cler
  where cler.lead_id is not null
  group by cler.lead_id
)
select
  l.id as lead_id,
  l.facility_id,
  lower(coalesce(l.status, 'new')) as lifecycle_status,
  l.created_at::timestamptz as created_at,
  ler.first_event_at,
  ler.last_event_at,
  coalesce(ler.total_events, 0) as total_events,
  coalesce(ler.tour_events, 0) as tour_events,
  coalesce(ll.confidence_score, 0) as confidence_score,
  ll.last_normalized_at as canonical_last_normalized_at,
  coalesce((ll.analytics_payload ->> 'lead_quality_score')::numeric, 0) as lead_quality_score,
  now()::timestamptz as data_as_of
from public.leads l
left join latest_lead ll on ll.lead_id = l.id
left join lead_events_rollup ler on ler.lead_id = l.id;

drop materialized view if exists public.api_v1_attribution_funnel_daily;
create materialized view public.api_v1_attribution_funnel_daily as
with deduped as (
  select
    cler.facility_id,
    date_trunc('day', cler.occurred_at)::date as bucket_date,
    cler.event_type,
    cler.session_id
  from public.canonical_lead_event_records cler
  where cler.facility_id is not null
    and cler.session_id is not null
)
select
  d.facility_id,
  d.bucket_date,
  count(distinct d.session_id) filter (where d.event_type = 'page_view') as impressions,
  count(distinct d.session_id) filter (where d.event_type = 'faq_viewed') as engagement,
  count(distinct d.session_id) filter (where d.event_type in ('phone_reveal', 'directions_clicked', 'comparison_added')) as intent,
  count(distinct d.session_id) filter (where d.event_type = 'schedule_tour') as conversions,
  now()::timestamptz as data_as_of
from deduped d
group by d.facility_id, d.bucket_date;

create unique index if not exists idx_api_v1_attribution_funnel_daily_unique
  on public.api_v1_attribution_funnel_daily (facility_id, bucket_date);

create index if not exists idx_api_v1_attribution_funnel_daily_bucket
  on public.api_v1_attribution_funnel_daily (bucket_date desc);

create or replace function public.refresh_api_v1_read_models()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.api_v1_attribution_funnel_daily;
end;
$$;

revoke all on function public.refresh_api_v1_read_models() from public;
grant execute on function public.refresh_api_v1_read_models() to authenticated;

-- Contract views are not exposed publicly by default.
revoke all on table public.api_v1_facility_profile_summary from public;
revoke all on table public.api_v1_lead_lifecycle from public;
revoke all on table public.api_v1_attribution_funnel_daily from public;

grant select on table public.api_v1_facility_profile_summary to authenticated;
grant select on table public.api_v1_lead_lifecycle to authenticated;
grant select on table public.api_v1_attribution_funnel_daily to authenticated;

