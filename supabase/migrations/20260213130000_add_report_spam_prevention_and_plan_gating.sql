-- Sprint monetization foundation: anti-spam, plan-aware gating, and search waiting counts.

-- 1) Report spam prevention: one report per user per target.
CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_unique_question_reporter
  ON qa_reports (question_id, reporter_user_id)
  WHERE question_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_qr_unique_answer_reporter
  ON qa_reports (answer_id, reporter_user_id)
  WHERE answer_id IS NOT NULL;

-- 2) Claimed timestamp and listing tier for public/read-time gating.
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz,
  ADD COLUMN IF NOT EXISTS listing_tier text NOT NULL DEFAULT 'free'
    CHECK (listing_tier IN ('free', 'featured', 'priority', 'lead_suite'));

UPDATE facilities
SET claimed_at = COALESCE(claimed_at, created_at, NOW()),
    listing_tier = CASE
      WHEN owner_id IS NULL THEN 'free'
      ELSE COALESCE(
        (SELECT up.plan::text FROM user_profiles up WHERE up.id = facilities.owner_id),
        'free'
      )
    END
WHERE owner_id IS NOT NULL;

CREATE OR REPLACE FUNCTION sync_facility_listing_tier()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.owner_id IS NOT NULL THEN
      NEW.claimed_at = COALESCE(NEW.claimed_at, NOW());
    END IF;
  ELSIF NEW.owner_id IS NOT NULL AND OLD.owner_id IS NULL THEN
    NEW.claimed_at = COALESCE(NEW.claimed_at, NOW());
  END IF;

  NEW.listing_tier = CASE
    WHEN NEW.owner_id IS NULL THEN 'free'
    ELSE COALESCE(
      (SELECT up.plan::text FROM user_profiles up WHERE up.id = NEW.owner_id),
      'free'
    )
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_facility_listing_tier ON facilities;
CREATE TRIGGER trg_sync_facility_listing_tier
  BEFORE INSERT OR UPDATE OF owner_id ON facilities
  FOR EACH ROW EXECUTE FUNCTION sync_facility_listing_tier();

CREATE OR REPLACE FUNCTION sync_facility_tiers_from_profile()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE facilities
  SET listing_tier = COALESCE(NEW.plan::text, 'free')
  WHERE owner_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_facility_tiers_from_profile ON user_profiles;
CREATE TRIGGER trg_sync_facility_tiers_from_profile
  AFTER UPDATE OF plan ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION sync_facility_tiers_from_profile();

-- 3) Answer-level verification identity is write-time immutable business signal.
ALTER TABLE facility_answers
  ADD COLUMN IF NOT EXISTS verification_tier text NOT NULL DEFAULT 'community'
    CHECK (verification_tier IN ('community', 'premium_verified'));

CREATE INDEX IF NOT EXISTS idx_fa_verification_status
  ON facility_answers (question_id, status, verification_tier);

-- 4) Premium-only FAQ writes (owner-managed but plan enforced).
DROP POLICY IF EXISTS owners_manage_faqs ON facility_faqs;

DROP POLICY IF EXISTS owners_insert_faqs ON facility_faqs;
CREATE POLICY owners_insert_faqs
  ON facility_faqs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND facility_id IN (
      SELECT id
      FROM facilities
      WHERE owner_id = auth.uid()
        AND listing_tier IN ('featured', 'priority', 'lead_suite')
    )
  );

DROP POLICY IF EXISTS owners_update_faqs ON facility_faqs;
CREATE POLICY owners_update_faqs
  ON facility_faqs
  FOR UPDATE
  USING (
    facility_id IN (
      SELECT id
      FROM facilities
      WHERE owner_id = auth.uid()
        AND listing_tier IN ('featured', 'priority', 'lead_suite')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND facility_id IN (
      SELECT id
      FROM facilities
      WHERE owner_id = auth.uid()
        AND listing_tier IN ('featured', 'priority', 'lead_suite')
    )
  );

DROP POLICY IF EXISTS owners_delete_faqs ON facility_faqs;
CREATE POLICY owners_delete_faqs
  ON facility_faqs
  FOR DELETE
  USING (
    facility_id IN (
      SELECT id
      FROM facilities
      WHERE owner_id = auth.uid()
        AND listing_tier IN ('featured', 'priority', 'lead_suite')
    )
  );

-- 5) Force answer writes through RPC (drop direct insert policy).
DROP POLICY IF EXISTS insert_operator_answers ON facility_answers;

-- 6) Plan-aware answering check and write RPCs.
CREATE OR REPLACE FUNCTION can_operator_answer(p_question_id uuid)
RETURNS TABLE (allowed boolean, reason text, answers_this_month integer, plan text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid;
  v_facility_id uuid;
  v_owner_id uuid;
  v_plan text;
  v_count integer;
  v_month_start timestamptz;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, 'Authentication required', 0, 'free';
    RETURN;
  END IF;

  SELECT fq.facility_id, f.owner_id
  INTO v_facility_id, v_owner_id
  FROM facility_questions fq
  JOIN facilities f ON f.id = fq.facility_id
  WHERE fq.id = p_question_id;

  IF v_facility_id IS NULL THEN
    RETURN QUERY SELECT false, 'Question not found', 0, 'free';
    RETURN;
  END IF;

  IF v_owner_id IS DISTINCT FROM v_uid THEN
    RETURN QUERY SELECT false, 'Not authorized for this facility', 0, 'free';
    RETURN;
  END IF;

  SELECT COALESCE(up.plan::text, 'free') INTO v_plan
  FROM user_profiles up
  WHERE up.id = v_uid;

  v_plan := COALESCE(v_plan, 'free');
  v_month_start := date_trunc('month', timezone('utc', now()));

  SELECT COUNT(*)
  INTO v_count
  FROM facility_answers fa
  JOIN facility_questions fq ON fq.id = fa.question_id
  JOIN facilities f ON f.id = fq.facility_id
  WHERE fa.user_id = v_uid
    AND fa.is_operator = true
    AND f.owner_id = v_uid
    AND fa.created_at >= v_month_start;

  IF v_plan IN ('featured', 'priority', 'lead_suite') THEN
    RETURN QUERY SELECT true, 'Allowed', v_count, v_plan;
    RETURN;
  END IF;

  IF v_count >= 1 THEN
    RETURN QUERY SELECT false, 'Free plan monthly clarification limit reached', v_count, v_plan;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Allowed', v_count, v_plan;
END;
$$;

REVOKE ALL ON FUNCTION can_operator_answer(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION can_operator_answer(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION submit_operator_answer(
  p_question_id uuid,
  p_answer_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid;
  v_plan text;
  v_allowed boolean;
  v_reason text;
  v_count integer;
  v_id uuid;
  v_clean text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_clean := btrim(COALESCE(p_answer_text, ''));
  IF char_length(v_clean) < 1 OR char_length(v_clean) > 2000 THEN
    RAISE EXCEPTION 'Answer must be between 1 and 2000 characters.';
  END IF;

  SELECT allowed, reason, answers_this_month, plan
  INTO v_allowed, v_reason, v_count, v_plan
  FROM can_operator_answer(p_question_id);

  IF NOT COALESCE(v_allowed, false) THEN
    RAISE EXCEPTION '%', COALESCE(v_reason, 'Not allowed');
  END IF;

  INSERT INTO facility_answers (
    question_id,
    user_id,
    answer_text,
    is_operator,
    status,
    verification_tier
  )
  VALUES (
    p_question_id,
    v_uid,
    v_clean,
    true,
    'pending',
    CASE
      WHEN v_plan IN ('featured', 'priority', 'lead_suite') THEN 'premium_verified'
      ELSE 'community'
    END
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION submit_operator_answer(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_operator_answer(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION submit_official_faq(
  p_facility_id uuid,
  p_question_text text,
  p_answer_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid;
  v_plan text;
  v_owner_id uuid;
  v_id uuid;
  v_q text;
  v_a text;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  SELECT owner_id INTO v_owner_id FROM facilities WHERE id = p_facility_id;
  IF v_owner_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'Not authorized for this facility.';
  END IF;

  SELECT COALESCE(plan::text, 'free') INTO v_plan
  FROM user_profiles
  WHERE id = v_uid;
  v_plan := COALESCE(v_plan, 'free');

  IF v_plan NOT IN ('featured', 'priority', 'lead_suite') THEN
    RAISE EXCEPTION 'Official FAQs are a premium feature.';
  END IF;

  v_q := btrim(COALESCE(p_question_text, ''));
  v_a := btrim(COALESCE(p_answer_text, ''));
  IF char_length(v_q) < 5 OR char_length(v_q) > 300 THEN
    RAISE EXCEPTION 'FAQ question must be between 5 and 300 characters.';
  END IF;
  IF char_length(v_a) < 1 OR char_length(v_a) > 2000 THEN
    RAISE EXCEPTION 'FAQ answer must be between 1 and 2000 characters.';
  END IF;

  INSERT INTO facility_faqs (
    facility_id,
    user_id,
    question_text,
    answer_text,
    is_published
  )
  VALUES (p_facility_id, v_uid, v_q, v_a, true)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION submit_official_faq(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_official_faq(uuid, text, text) TO authenticated;

-- 7) Include verification tier in public approved view.
DROP VIEW IF EXISTS approved_facility_qa;
CREATE VIEW approved_facility_qa AS
SELECT
  q.id AS question_id,
  q.facility_id,
  q.question_text,
  q.created_at AS question_date,
  q.upvote_count,
  q.pinned,
  q.last_activity_at,
  a.id AS answer_id,
  a.answer_text,
  a.is_operator,
  a.verification_tier,
  a.created_at AS answer_date
FROM facility_questions q
LEFT JOIN facility_answers a
  ON a.question_id = q.id
 AND a.status = 'approved'
WHERE q.status = 'approved';

-- 8) Search function now returns waiting question counts and listing tier signals.
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
    COALESCE((
      SELECT COUNT(*)
      FROM facility_questions fq
      WHERE fq.facility_id = f.id
        AND fq.status = 'approved'
        AND NOT EXISTS (
          SELECT 1
          FROM facility_answers fa
          WHERE fa.question_id = fq.id
            AND fa.status = 'approved'
            AND fa.is_operator = true
        )
    ), 0)::integer AS waiting_question_count
  FROM facilities f
  WHERE
    (state_filter IS NULL OR f.state = state_filter)
    AND (postal_filter IS NULL OR f.postal_code = postal_filter)
    AND (city_filter IS NULL OR f.city ILIKE city_filter)
    AND (query_text IS NULL OR f.name ILIKE '%' || query_text || '%')
  ORDER BY f.name
  LIMIT limit_count
  OFFSET offset_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_facilities(text, text, text, text, integer, integer) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
