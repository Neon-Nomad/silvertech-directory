# Regulations 7-Day Metrics Check Template

Use this after regulations graph-link deployments to confirm the links are improving real behavior.

## Goal
- Verify click behavior on `reg_to_state` and `reg_to_city`.
- Verify regulations pages are pushing users deeper (state hubs/city pages).
- Verify engagement quality is stable (or better), not degraded.

## Query Pack
- SQL file: `supabase/sql/regulations_graph_7_day_metrics.sql`

Run it in Supabase SQL Editor (or any Postgres client connected to prod).

## Metrics Captured
- `reg_to_state_ctr`
- `reg_to_city_ctr`
- `pages_per_session` and `pages_per_session_delta` (current 7d vs prior 7d)
- `avg_reg_time_on_page_sec` and delta
- `downstream_state_hub_pageviews` and delta
- `downstream_city_pageviews` and delta

## How To Read The Output
1. Good outcome:
- `reg_to_city_ctr` is meaningfully above zero.
- `reg_to_state_ctr` is meaningfully above zero.
- `pages_per_session_delta` is positive.
- `avg_time_on_page_delta_sec` is stable or slightly positive.

2. Mixed outcome:
- CTR rises, `pages_per_session_delta` rises.
- `avg_time_on_page_delta_sec` dips slightly.
- Usually acceptable if downstream pageviews are climbing.

3. Bad outcome:
- CTR low/flat.
- `pages_per_session_delta` flat/negative.
- `avg_time_on_page_delta_sec` negative.
- Means links are visible but not compelling, or they are distracting.

## Wiring Diagnostics (2nd result set)
Use the diagnostics table to catch instrumentation drift:
- Missing `state` payloads.
- Missing `city` for `reg_to_city`.
- Position skew (`hero|mid|section|footer` unexpectedly absent).

If payload quality breaks, metric quality breaks.

## 7-Day Operator Checklist
1. Run query pack.
2. Export state-level table.
3. Check top 5 traffic states first.
4. Flag states with:
- zero CTR
- large engagement drop
- downstream pageviews near zero
5. Spot-check those pages in production for:
- link presence
- copy quality above links
- mobile readability

## Suggested Weekly Log Format
- Date run:
- Commit/deploy ID:
- States reviewed:
- `reg_to_state_ctr` trend:
- `reg_to_city_ctr` trend:
- `pages/session` trend:
- `time-on-page` trend:
- Downstream state hub pageviews trend:
- Downstream city pageviews trend:
- Fixes required:

## Notes
- This template assumes event streams are ingested into `public.raw_events`.
- If your analytics connector is not yet landing events there, wire ingestion first; otherwise the report will undercount.
