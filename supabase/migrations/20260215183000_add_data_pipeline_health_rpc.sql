-- Data pipeline health snapshot RPC for automation monitoring.

create or replace function public.get_data_pipeline_health()
returns table (
  pending_raw_events bigint,
  latest_raw_ingested_at timestamptz,
  latest_normalized_at timestamptz,
  latest_read_model_refresh_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  with pending as (
    select count(*)::bigint as c
    from public.raw_events re
    left join public.normalization_records nr
      on nr.raw_event_id = re.id
    where nr.id is null
       or nr.status in ('ingested', 'rejected')
  ),
  raw_latest as (
    select max(re.ingested_at) as ts
    from public.raw_events re
  ),
  norm_latest as (
    select max(nr.last_processed_at) as ts
    from public.normalization_records nr
    where nr.status = 'normalized'
  ),
  read_model_latest as (
    select max(mv.data_as_of) as ts
    from public.api_v1_attribution_funnel_daily mv
  )
  select
    coalesce((select c from pending), 0) as pending_raw_events,
    (select ts from raw_latest) as latest_raw_ingested_at,
    (select ts from norm_latest) as latest_normalized_at,
    (select ts from read_model_latest) as latest_read_model_refresh_at;
$$;

revoke all on function public.get_data_pipeline_health() from public;
grant execute on function public.get_data_pipeline_health() to authenticated;

