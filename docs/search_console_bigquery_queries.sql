-- SilverTech Search Console Bulk Export Queries
-- Dataset/table placeholder:
--   `your_project.searchconsole.searchdata_url_impression`

-- 1) State Hub and City Spoke performance in last 7 days
SELECT
  CASE
    WHEN REGEXP_CONTAINS(url, r'/senior-living/[^/]+/[^/]+/[^/]+/?$') THEN 'city_spoke'
    WHEN REGEXP_CONTAINS(url, r'/senior-living/[^/]+/[^/]+/?$') THEN 'city_hub'
    WHEN REGEXP_CONTAINS(url, r'/senior-living/[^/]+/?$') THEN 'state_hub'
    ELSE 'other'
  END AS page_scope,
  REGEXP_EXTRACT(url, r'/senior-living/([^/]+)/') AS state_slug,
  COUNT(DISTINCT url) AS pages_seen,
  SUM(impressions) AS total_impressions,
  SUM(clicks) AS total_clicks,
  SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS ctr
FROM `your_project.searchconsole.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND REGEXP_CONTAINS(url, r'/senior-living/')
GROUP BY page_scope, state_slug
ORDER BY total_impressions DESC;

-- 2) City spoke pages gaining the most impressions week-over-week
WITH this_week AS (
  SELECT
    url,
    REGEXP_EXTRACT(url, r'/senior-living/([^/]+)/') AS state_slug,
    SUM(impressions) AS impressions_7d,
    SUM(clicks) AS clicks_7d
  FROM `your_project.searchconsole.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND REGEXP_CONTAINS(url, r'/senior-living/[^/]+/[^/]+/[^/]+/?$')
  GROUP BY url, state_slug
),
prev_week AS (
  SELECT
    url,
    SUM(impressions) AS impressions_prev_7d
  FROM `your_project.searchconsole.searchdata_url_impression`
  WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
    AND data_date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
    AND REGEXP_CONTAINS(url, r'/senior-living/[^/]+/[^/]+/[^/]+/?$')
  GROUP BY url
)
SELECT
  t.state_slug,
  t.url,
  t.impressions_7d,
  t.clicks_7d,
  COALESCE(p.impressions_prev_7d, 0) AS impressions_prev_7d,
  (t.impressions_7d - COALESCE(p.impressions_prev_7d, 0)) AS impression_delta
FROM this_week t
LEFT JOIN prev_week p USING (url)
ORDER BY impression_delta DESC
LIMIT 500;

-- 3) Priority internal-link targets: state hubs with rising impressions but weak CTR
SELECT
  REGEXP_EXTRACT(url, r'/senior-living/([^/]+)/') AS state_slug,
  SUM(impressions) AS impressions_7d,
  SUM(clicks) AS clicks_7d,
  SAFE_DIVIDE(SUM(clicks), NULLIF(SUM(impressions), 0)) AS ctr
FROM `your_project.searchconsole.searchdata_url_impression`
WHERE data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  AND REGEXP_CONTAINS(url, r'/senior-living/[^/]+/?$')
GROUP BY state_slug
HAVING impressions_7d >= 500
ORDER BY ctr ASC, impressions_7d DESC;
