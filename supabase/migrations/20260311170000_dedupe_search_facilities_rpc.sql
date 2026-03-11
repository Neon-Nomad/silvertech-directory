-- Deduplicate facility search results at the database layer so the API payload
-- contains unique rows before LIMIT/OFFSET are applied.

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'search_facilities'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s', fn);
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.search_facilities(
  query_text text,
  state_filter text,
  city_filter text,
  postal_filter text,
  limit_count integer,
  offset_count integer
)
RETURNS TABLE (
  id uuid,
  name text,
  city text,
  state text,
  address_line1 text,
  postal_code text,
  phone text,
  website_url text,
  owner_id uuid,
  listing_tier text,
  waiting_question_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT
      f.id,
      f.name,
      f.city,
      f.state,
      f.address_line1,
      f.postal_code,
      f.phone,
      f.website_url,
      f.owner_id,
      f.listing_tier,
      lower(regexp_replace(trim(coalesce(f.name, '')), '\s+', ' ', 'g')) AS dedupe_name,
      lower(regexp_replace(trim(coalesce(f.address_line1, '')), '\s+', ' ', 'g')) AS dedupe_address,
      lower(regexp_replace(trim(coalesce(f.city, '')), '\s+', ' ', 'g')) AS dedupe_city,
      upper(trim(coalesce(f.state, ''))) AS dedupe_state,
      trim(coalesce(f.postal_code, '')) AS dedupe_postal
    FROM public.facilities f
    WHERE
      (state_filter IS NULL OR f.state = state_filter)
      AND (postal_filter IS NULL OR f.postal_code = postal_filter)
      AND (city_filter IS NULL OR f.city ILIKE city_filter)
      AND (query_text IS NULL OR f.name ILIKE '%' || query_text || '%')
  ),
  ranked AS (
    SELECT
      filtered.*,
      row_number() OVER (
        PARTITION BY dedupe_name, dedupe_address, dedupe_city, dedupe_state, dedupe_postal
        ORDER BY id
      ) AS dedupe_rank
    FROM filtered
  ),
  deduped AS (
    SELECT *
    FROM ranked
    WHERE dedupe_rank = 1
  )
  SELECT
    d.id,
    d.name,
    d.city,
    d.state,
    d.address_line1,
    d.postal_code,
    d.phone,
    d.website_url,
    d.owner_id,
    d.listing_tier,
    COALESCE((
      SELECT COUNT(*)
      FROM public.facility_questions fq
      WHERE fq.facility_id = d.id
        AND fq.status = 'approved'
        AND NOT EXISTS (
          SELECT 1
          FROM public.facility_answers fa
          WHERE fa.question_id = fq.id
            AND fa.status = 'approved'
            AND fa.is_operator = true
        )
    ), 0)::integer AS waiting_question_count
  FROM deduped d
  ORDER BY d.name
  LIMIT GREATEST(COALESCE(limit_count, 50), 1)
  OFFSET GREATEST(COALESCE(offset_count, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.search_facilities(text, text, text, text, integer, integer) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
