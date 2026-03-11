# Search Console Audit Guide (30 Days)

Use this guide to track indexing progress for the `19,110` care-type city pages:

`/senior-living/{state}/{city}/{care-type-slug}/`

For this cycle, run from **March 11, 2026** to **April 10, 2026**.

## 1) Audit Goal

- Track how fast Google discovers, crawls, and indexes care-type city pages.
- Catch indexing stalls early.
- Prioritize fixes by state/city cluster, not random URLs.

## 2) KPI Scorecard

Track these metrics daily in one sheet:

- `submitted_urls`: `19110` (fixed baseline from sitemap)
- `indexed_urls`: count from Search Console Pages report filter
- `index_rate_pct`: `indexed_urls / 19110`
- `urls_with_impressions_7d`: distinct URLs with impressions in last 7 days
- `impression_coverage_pct`: `urls_with_impressions_7d / indexed_urls`
- `total_impressions_7d`
- `total_clicks_7d`
- `ctr_7d`
- `avg_position_7d`

Use this threshold ladder:

- Day 7 target: `>= 15%` indexed
- Day 14 target: `>= 35%` indexed
- Day 21 target: `>= 55%` indexed
- Day 30 target: `>= 70%` indexed

If any checkpoint misses by `10+` points, open an incident and run the remediation checklist in section 6.

## 3) Day-0 Setup (One Time)

1. In Search Console, submit only:
   `https://silvertechdirectory.com/sitemap-index.xml`
2. Confirm `public/sitemap-index.xml` includes all chunks, including:
   `sitemap-facilities-1.xml ... sitemap-facilities-19.xml`
3. In Search Console Pages report, create and save a page filter for:
   `/senior-living/` and 3-path depth pages.
4. Enable Search Console bulk export to BigQuery (if not already enabled).
5. Use `docs/search_console_bigquery_queries.sql` as the base query set.

## 4) Daily Workflow (10-15 min)

1. Open Search Console:
   - `Pages` report for indexing status.
   - `Sitemaps` report for fetch/read errors.
2. Record scorecard metrics.
3. Run the BigQuery 7-day query pack and log:
   - pages seen
   - impressions
   - clicks
   - CTR
4. Spot-check 5 URLs:
   - 2 high-impression URLs
   - 2 no-impression indexed URLs
   - 1 newly discovered URL
5. Log blockers:
   - canonical mismatch
   - crawl anomaly
   - soft 404 signal
   - duplicate cluster issue

## 5) Weekly Workflow (60 min)

1. Compare week-over-week:
   - indexed growth
   - impressions growth
   - state-level winners/laggards
2. Segment lagging URLs by type:
   - low-content cities
   - weak internal-link states
   - low-demand care types
3. Take corrective actions:
   - strengthen internal links from state/city hubs
   - improve unique intro and regulatory prose for thin pages
   - re-check canonical and breadcrumb schema consistency
4. Re-submit only impacted sitemap(s) after major content/technical changes.

## 6) Remediation Checklist (When Growth Stalls)

Run these in order:

1. Confirm all care-type pages return `200` and have self-canonical.
2. Re-validate no legacy `/assisted-living/` links are emitted.
3. Confirm only one `<h1>` per page and no header/logo `<h1>`.
4. Check robots/meta robots do not block indexing.
5. Verify internal links into low-performing pages from:
   - state page
   - city page
   - nearby city module
6. Inspect 20 lagging URLs in URL Inspection for shared failure patterns.

## 7) BigQuery Queries You Should Run

Use the existing file:

- `docs/search_console_bigquery_queries.sql`

Add this query for care-type city coverage in the last 30 days:

```sql
SELECT
  COUNT(DISTINCT url) AS care_type_urls_with_impressions_30d,
  SUM(impressions) AS impressions_30d,
  SUM(clicks) AS clicks_30d,
  SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS ctr_30d,
  AVG(position) AS avg_position_30d
FROM `your_project.searchconsole.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND REGEXP_CONTAINS(url, r'/senior-living/[^/]+/[^/]+/[^/]+/?$');
```

Add this state-level leaderboard query:

```sql
SELECT
  REGEXP_EXTRACT(url, r'/senior-living/([^/]+)/') AS state_slug,
  COUNT(DISTINCT url) AS care_type_urls_seen_30d,
  SUM(impressions) AS impressions_30d,
  SUM(clicks) AS clicks_30d,
  SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS ctr_30d
FROM `your_project.searchconsole.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND REGEXP_CONTAINS(url, r'/senior-living/[^/]+/[^/]+/[^/]+/?$')
GROUP BY state_slug
ORDER BY impressions_30d DESC;
```

## 8) 30-Day Exit Criteria

Call the indexing phase successful when all are true:

- `index_rate_pct >= 70%`
- no persistent sitemap fetch/read errors
- no systemic canonical/duplicate cluster issue
- care-type city impressions trend upward for 3 consecutive weeks

If exit criteria fail, run a focused 14-day recovery sprint on the bottom 10 states by impression coverage.
