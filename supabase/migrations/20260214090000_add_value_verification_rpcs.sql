-- Value Verification Suite: funnel + profile health RPCs.

CREATE INDEX IF NOT EXISTS idx_lead_events_facility_type_created
  ON lead_events (facility_id, created_at DESC, event_type);

CREATE OR REPLACE FUNCTION public.get_operator_attribution_funnel(p_range text DEFAULT 'month')
RETURNS TABLE (
  impressions bigint,
  engagement bigint,
  intent bigint,
  conversions bigint,
  prev_impressions bigint,
  prev_engagement bigint,
  prev_intent bigint,
  prev_conversions bigint,
  phone_reveals bigint,
  tour_requests bigint,
  directions bigint,
  comparisons bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
WITH bounds AS (
  SELECT
    CASE
      WHEN p_range = 'week' THEN NOW() - INTERVAL '7 days'
      WHEN p_range = 'month' THEN NOW() - INTERVAL '30 days'
      ELSE to_timestamp(0)
    END AS current_start,
    NOW() AS current_end,
    CASE
      WHEN p_range = 'week' THEN NOW() - INTERVAL '14 days'
      WHEN p_range = 'month' THEN NOW() - INTERVAL '60 days'
      ELSE NULL::timestamptz
    END AS prev_start,
    CASE
      WHEN p_range = 'week' THEN NOW() - INTERVAL '7 days'
      WHEN p_range = 'month' THEN NOW() - INTERVAL '30 days'
      ELSE NULL::timestamptz
    END AS prev_end
),
owned AS (
  SELECT id
  FROM facilities
  WHERE owner_id = auth.uid()
),
current_events AS (
  SELECT le.session_id, le.event_type
  FROM lead_events le
  JOIN owned o ON o.id = le.facility_id
  CROSS JOIN bounds b
  WHERE le.created_at >= b.current_start
    AND le.created_at < b.current_end
),
prev_events AS (
  SELECT le.session_id, le.event_type
  FROM lead_events le
  JOIN owned o ON o.id = le.facility_id
  CROSS JOIN bounds b
  WHERE b.prev_start IS NOT NULL
    AND b.prev_end IS NOT NULL
    AND le.created_at >= b.prev_start
    AND le.created_at < b.prev_end
),
current_agg AS (
  SELECT
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS impressions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'faq_viewed') AS engagement,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type IN ('phone_reveal', 'directions_clicked', 'comparison_added')) AS intent,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'schedule_tour') AS conversions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'phone_reveal') AS phone_reveals,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'schedule_tour') AS tour_requests,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'directions_clicked') AS directions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'comparison_added') AS comparisons
  FROM current_events
),
prev_agg AS (
  SELECT
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view') AS prev_impressions,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'faq_viewed') AS prev_engagement,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type IN ('phone_reveal', 'directions_clicked', 'comparison_added')) AS prev_intent,
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'schedule_tour') AS prev_conversions
  FROM prev_events
)
SELECT
  COALESCE(c.impressions, 0),
  COALESCE(c.engagement, 0),
  COALESCE(c.intent, 0),
  COALESCE(c.conversions, 0),
  COALESCE(p.prev_impressions, 0),
  COALESCE(p.prev_engagement, 0),
  COALESCE(p.prev_intent, 0),
  COALESCE(p.prev_conversions, 0),
  COALESCE(c.phone_reveals, 0),
  COALESCE(c.tour_requests, 0),
  COALESCE(c.directions, 0),
  COALESCE(c.comparisons, 0)
FROM current_agg c
CROSS JOIN prev_agg p;
$$;

REVOKE ALL ON FUNCTION public.get_operator_attribution_funnel(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_operator_attribution_funnel(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_operator_profile_health()
RETURNS TABLE (
  facility_id uuid,
  has_photos boolean,
  has_care_types boolean,
  has_phone boolean,
  has_verified_phone boolean,
  has_website_url boolean,
  has_licensing boolean,
  qa_response_rate numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT
  f.id AS facility_id,
  EXISTS (SELECT 1 FROM facility_photos fp WHERE fp.facility_id = f.id) AS has_photos,
  EXISTS (SELECT 1 FROM facility_care_types fct WHERE fct.facility_id = f.id) AS has_care_types,
  (NULLIF(BTRIM(COALESCE(f.phone, '')), '') IS NOT NULL) AS has_phone,
  (NULLIF(BTRIM(COALESCE(f.verified_phone, '')), '') IS NOT NULL) AS has_verified_phone,
  (NULLIF(BTRIM(COALESCE(f.website_url, '')), '') IS NOT NULL) AS has_website_url,
  EXISTS (SELECT 1 FROM facility_licensing fl WHERE fl.facility_id = f.id) AS has_licensing,
  COALESCE(
    CASE
      WHEN qa.approved_questions = 0 THEN 0::numeric
      ELSE qa.approved_with_operator::numeric / qa.approved_questions::numeric
    END,
    0::numeric
  ) AS qa_response_rate
FROM facilities f
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS approved_questions,
    COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1
        FROM facility_answers fa
        WHERE fa.question_id = fq.id
          AND fa.status = 'approved'
          AND fa.is_operator = true
      )
    ) AS approved_with_operator
  FROM facility_questions fq
  WHERE fq.facility_id = f.id
    AND fq.status = 'approved'
) qa ON true
WHERE f.owner_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_operator_profile_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_operator_profile_health() TO authenticated;
