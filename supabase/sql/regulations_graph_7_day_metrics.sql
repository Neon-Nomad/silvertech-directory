-- 7-day regulations graph metrics template
-- Scope: /regulations/{state}/ pages and tracked graph links (reg_to_state, reg_to_city)
-- Window: current 7 days vs previous 7 days baseline
--
-- Notes:
-- 1) This query reads from public.raw_events and expects event payloads to include some mix of:
--    - event_name/event/event_type
--    - state/city/position
--    - session_id (or ga_session_id/client_id fallback)
--    - page_path/path/page_location/url for page views
--    - page_referrer/referrer for downstream attribution
-- 2) If your analytics stream does not land in raw_events yet, this report will return little/no data.

with params as (
  select
    now() as current_end,
    now() - interval '7 days' as current_start,
    now() - interval '14 days' as baseline_start
),
events_raw as (
  select
    re.id,
    re.occurred_at,
    lower(
      coalesce(
        nullif(re.payload ->> 'event_name', ''),
        nullif(re.payload ->> 'event', ''),
        nullif(re.payload ->> 'event_type', ''),
        nullif(re.metadata ->> 'event_name', ''),
        nullif(re.metadata ->> 'event_type', '')
      )
    ) as event_name,
    lower(
      coalesce(
        nullif(re.payload ->> 'state', ''),
        nullif(re.metadata ->> 'state', '')
      )
    ) as state_slug_payload,
    nullif(
      coalesce(
        re.payload ->> 'city',
        re.metadata ->> 'city'
      ),
      ''
    ) as city_name,
    lower(
      coalesce(
        nullif(re.payload ->> 'position', ''),
        nullif(re.metadata ->> 'position', ''),
        'unknown'
      )
    ) as position,
    coalesce(
      nullif(re.payload ->> 'session_id', ''),
      nullif(re.metadata ->> 'session_id', ''),
      nullif(re.payload ->> 'ga_session_id', ''),
      nullif(re.payload ->> 'client_id', ''),
      nullif(re.metadata ->> 'client_id', ''),
      re.id::text
    ) as session_id,
    coalesce(
      nullif(re.payload ->> 'page_path', ''),
      nullif(re.payload ->> 'path', ''),
      nullif(re.payload ->> 'pathname', ''),
      nullif(re.payload ->> 'page_location', ''),
      nullif(re.payload ->> 'url', ''),
      nullif(re.metadata ->> 'page_path', ''),
      nullif(re.metadata ->> 'path', ''),
      nullif(re.metadata ->> 'pathname', ''),
      nullif(re.metadata ->> 'page_location', ''),
      nullif(re.metadata ->> 'url', '')
    ) as page_path_raw,
    coalesce(
      nullif(re.payload ->> 'page_referrer', ''),
      nullif(re.payload ->> 'referrer', ''),
      nullif(re.metadata ->> 'page_referrer', ''),
      nullif(re.metadata ->> 'referrer', '')
    ) as referrer_raw,
    case
      when coalesce(re.payload ->> 'engagement_time_msec', '') ~ '^[0-9]+(\.[0-9]+)?$'
        then (re.payload ->> 'engagement_time_msec')::numeric
      when coalesce(re.payload ->> 'engagement_time', '') ~ '^[0-9]+(\.[0-9]+)?$'
        then (re.payload ->> 'engagement_time')::numeric
      else null
    end as engagement_ms
  from public.raw_events re
  cross join params p
  where re.occurred_at >= p.baseline_start
    and re.occurred_at < p.current_end
    and re.processing_status <> 'rejected'
),
events_norm as (
  select
    er.*,
    case
      when er.occurred_at >= p.current_start then 'current'
      else 'baseline'
    end as window_name,
    case
      when np.path_value = '' then null
      else lower(
        case
          when regexp_replace(np.path_value, '/+$', '') = '' then '/'
          else regexp_replace(np.path_value, '/+$', '') || '/'
        end
      )
    end as page_path,
    case
      when nr.path_value = '' then null
      else lower(
        case
          when regexp_replace(nr.path_value, '/+$', '') = '' then '/'
          else regexp_replace(nr.path_value, '/+$', '') || '/'
        end
      )
    end as referrer_path
  from events_raw er
  cross join params p
  cross join lateral (
    select
      case
        when base = '' then ''
        when left(base, 1) = '/' then base
        else '/' || base
      end as path_value
    from (
      select split_part(
        split_part(
          regexp_replace(coalesce(er.page_path_raw, ''), '^https?://[^/]+', ''),
          '?',
          1
        ),
        '#',
        1
      ) as base
    ) s
  ) np
  cross join lateral (
    select
      case
        when base = '' then ''
        when left(base, 1) = '/' then base
        else '/' || base
      end as path_value
    from (
      select split_part(
        split_part(
          regexp_replace(coalesce(er.referrer_raw, ''), '^https?://[^/]+', ''),
          '?',
          1
        ),
        '#',
        1
      ) as base
    ) s
  ) nr
),
page_views as (
  select *
  from events_norm
  where event_name in ('page_view', 'pageview', 'view_page')
),
reg_page_views as (
  select
    pv.*,
    substring(pv.page_path from '^/regulations/([^/]+)/$') as state_slug_path
  from page_views pv
  where pv.page_path ~ '^/regulations/[^/]+/$'
),
reg_sessions as (
  select
    window_name,
    coalesce(state_slug_payload, state_slug_path) as state_slug,
    session_id
  from reg_page_views
  where coalesce(state_slug_payload, state_slug_path) is not null
  group by 1, 2, 3
),
session_pageviews as (
  select
    rs.window_name,
    rs.state_slug,
    rs.session_id,
    count(*) as pages_in_session
  from reg_sessions rs
  join page_views pv
    on pv.window_name = rs.window_name
   and pv.session_id = rs.session_id
  group by 1, 2, 3
),
reg_engagement as (
  select
    window_name,
    coalesce(state_slug_payload, state_slug_path) as state_slug,
    avg(engagement_ms) / 1000.0 as avg_reg_time_on_page_sec
  from reg_page_views
  where coalesce(state_slug_payload, state_slug_path) is not null
  group by 1, 2
),
reg_clicks as (
  select
    en.window_name,
    coalesce(
      en.state_slug_payload,
      substring(en.page_path from '^/regulations/([^/]+)/$'),
      substring(en.referrer_path from '^/regulations/([^/]+)/$')
    ) as state_slug,
    en.event_name,
    en.position,
    en.city_name
  from events_norm en
  where en.event_name in ('reg_to_state', 'reg_to_city')
),
click_counts as (
  select
    window_name,
    state_slug,
    count(*) filter (where event_name = 'reg_to_state') as reg_to_state_clicks,
    count(*) filter (where event_name = 'reg_to_city') as reg_to_city_clicks
  from reg_clicks
  where state_slug is not null
  group by 1, 2
),
downstream_pageviews as (
  select
    pv.window_name,
    substring(pv.referrer_path from '^/regulations/([^/]+)/$') as state_slug,
    count(*) filter (
      where pv.page_path ~ '^/assisted-living/[^/]+/$'
        and substring(pv.page_path from '^/assisted-living/([^/]+)/$') = substring(pv.referrer_path from '^/regulations/([^/]+)/$')
    ) as downstream_state_hub_pageviews,
    count(*) filter (
      where pv.page_path ~ '^/assisted-living/[^/]+/[^/]+/$'
        and substring(pv.page_path from '^/assisted-living/([^/]+)/') = substring(pv.referrer_path from '^/regulations/([^/]+)/$')
    ) as downstream_city_pageviews
  from page_views pv
  where pv.referrer_path ~ '^/regulations/[^/]+/$'
  group by 1, 2
),
landings as (
  select
    window_name,
    state_slug,
    count(distinct session_id) as regulation_landing_sessions
  from reg_sessions
  group by 1, 2
),
pages_per_session as (
  select
    window_name,
    state_slug,
    avg(pages_in_session)::numeric(12, 3) as pages_per_session
  from session_pageviews
  group by 1, 2
),
state_windows as (
  select distinct state_slug from landings
  union
  select distinct state_slug from click_counts
  union
  select distinct state_slug from downstream_pageviews
),
state_metrics as (
  select
    sw.state_slug,
    coalesce(cur_land.regulation_landing_sessions, 0) as current_regulation_landing_sessions,
    coalesce(cur_click.reg_to_state_clicks, 0) as current_reg_to_state_clicks,
    coalesce(cur_click.reg_to_city_clicks, 0) as current_reg_to_city_clicks,
    case
      when coalesce(cur_land.regulation_landing_sessions, 0) = 0 then 0
      else round(cur_click.reg_to_state_clicks::numeric / cur_land.regulation_landing_sessions::numeric, 4)
    end as current_reg_to_state_ctr,
    case
      when coalesce(cur_land.regulation_landing_sessions, 0) = 0 then 0
      else round(cur_click.reg_to_city_clicks::numeric / cur_land.regulation_landing_sessions::numeric, 4)
    end as current_reg_to_city_ctr,
    cur_pages.pages_per_session as current_pages_per_session,
    cur_time.avg_reg_time_on_page_sec as current_avg_reg_time_on_page_sec,
    coalesce(cur_down.downstream_state_hub_pageviews, 0) as current_downstream_state_hub_pageviews,
    coalesce(cur_down.downstream_city_pageviews, 0) as current_downstream_city_pageviews,
    coalesce(base_land.regulation_landing_sessions, 0) as baseline_regulation_landing_sessions,
    coalesce(base_click.reg_to_state_clicks, 0) as baseline_reg_to_state_clicks,
    coalesce(base_click.reg_to_city_clicks, 0) as baseline_reg_to_city_clicks,
    case
      when coalesce(base_land.regulation_landing_sessions, 0) = 0 then 0
      else round(base_click.reg_to_state_clicks::numeric / base_land.regulation_landing_sessions::numeric, 4)
    end as baseline_reg_to_state_ctr,
    case
      when coalesce(base_land.regulation_landing_sessions, 0) = 0 then 0
      else round(base_click.reg_to_city_clicks::numeric / base_land.regulation_landing_sessions::numeric, 4)
    end as baseline_reg_to_city_ctr,
    base_pages.pages_per_session as baseline_pages_per_session,
    base_time.avg_reg_time_on_page_sec as baseline_avg_reg_time_on_page_sec,
    coalesce(base_down.downstream_state_hub_pageviews, 0) as baseline_downstream_state_hub_pageviews,
    coalesce(base_down.downstream_city_pageviews, 0) as baseline_downstream_city_pageviews
  from state_windows sw
  left join landings cur_land
    on cur_land.window_name = 'current' and cur_land.state_slug = sw.state_slug
  left join click_counts cur_click
    on cur_click.window_name = 'current' and cur_click.state_slug = sw.state_slug
  left join pages_per_session cur_pages
    on cur_pages.window_name = 'current' and cur_pages.state_slug = sw.state_slug
  left join reg_engagement cur_time
    on cur_time.window_name = 'current' and cur_time.state_slug = sw.state_slug
  left join downstream_pageviews cur_down
    on cur_down.window_name = 'current' and cur_down.state_slug = sw.state_slug
  left join landings base_land
    on base_land.window_name = 'baseline' and base_land.state_slug = sw.state_slug
  left join click_counts base_click
    on base_click.window_name = 'baseline' and base_click.state_slug = sw.state_slug
  left join pages_per_session base_pages
    on base_pages.window_name = 'baseline' and base_pages.state_slug = sw.state_slug
  left join reg_engagement base_time
    on base_time.window_name = 'baseline' and base_time.state_slug = sw.state_slug
  left join downstream_pageviews base_down
    on base_down.window_name = 'baseline' and base_down.state_slug = sw.state_slug
)
select
  state_slug,
  current_regulation_landing_sessions,
  current_reg_to_state_clicks,
  current_reg_to_city_clicks,
  current_reg_to_state_ctr,
  current_reg_to_city_ctr,
  current_pages_per_session,
  baseline_pages_per_session,
  round((current_pages_per_session - baseline_pages_per_session)::numeric, 3) as pages_per_session_delta,
  current_avg_reg_time_on_page_sec,
  baseline_avg_reg_time_on_page_sec,
  round((current_avg_reg_time_on_page_sec - baseline_avg_reg_time_on_page_sec)::numeric, 3) as avg_time_on_page_delta_sec,
  current_downstream_state_hub_pageviews,
  baseline_downstream_state_hub_pageviews,
  (current_downstream_state_hub_pageviews - baseline_downstream_state_hub_pageviews) as downstream_state_hub_pageviews_delta,
  current_downstream_city_pageviews,
  baseline_downstream_city_pageviews,
  (current_downstream_city_pageviews - baseline_downstream_city_pageviews) as downstream_city_pageviews_delta
from state_metrics
order by current_regulation_landing_sessions desc, state_slug asc;

-- Event wiring diagnostics for the current 7-day window.
-- Use this to confirm position/state/city coverage and detect malformed tracking payloads.
with params as (
  select
    now() as current_end,
    now() - interval '7 days' as current_start
),
events as (
  select
    lower(
      coalesce(
        nullif(payload ->> 'event_name', ''),
        nullif(payload ->> 'event', ''),
        nullif(payload ->> 'event_type', ''),
        nullif(metadata ->> 'event_name', ''),
        nullif(metadata ->> 'event_type', '')
      )
    ) as event_name,
    lower(
      coalesce(
        nullif(payload ->> 'state', ''),
        nullif(metadata ->> 'state', '')
      )
    ) as state_slug,
    nullif(
      coalesce(payload ->> 'city', metadata ->> 'city'),
      ''
    ) as city_name,
    lower(
      coalesce(
        nullif(payload ->> 'position', ''),
        nullif(metadata ->> 'position', ''),
        'unknown'
      )
    ) as position
  from public.raw_events re
  cross join params p
  where re.occurred_at >= p.current_start
    and re.occurred_at < p.current_end
    and re.processing_status <> 'rejected'
)
select
  event_name,
  position,
  count(*) as events,
  count(*) filter (where coalesce(state_slug, '') = '') as missing_state_events,
  count(*) filter (where event_name = 'reg_to_city' and coalesce(city_name, '') = '') as missing_city_events
from events
where event_name in ('reg_to_state', 'reg_to_city')
group by 1, 2
order by 1, 2;

