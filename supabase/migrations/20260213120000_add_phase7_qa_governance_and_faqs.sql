-- Phase 7: Q&A governance + official FAQs + ranking support.

-- Question ranking/support columns.
ALTER TABLE facility_questions
  ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT NOW();

ALTER TABLE facility_answers
  ADD COLUMN IF NOT EXISTS review_due_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_fq_facility_rank
  ON facility_questions (facility_id, pinned DESC, upvote_count DESC, last_activity_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_fa_review_due
  ON facility_answers (review_due_at)
  WHERE status = 'approved';

-- Official/operator FAQs: separate from moderated community Q&A.
CREATE TABLE IF NOT EXISTS facility_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  question_text text NOT NULL CHECK (char_length(question_text) BETWEEN 5 AND 300),
  answer_text text NOT NULL CHECK (char_length(answer_text) BETWEEN 1 AND 2000),
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ff_facility_published
  ON facility_faqs (facility_id, is_published, updated_at DESC);

-- Upvotes for community questions.
CREATE TABLE IF NOT EXISTS qa_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES facility_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_qv_question ON qa_votes (question_id);
CREATE INDEX IF NOT EXISTS idx_qv_user ON qa_votes (user_id);

-- User reports for moderation queue.
CREATE TABLE IF NOT EXISTS qa_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES facility_questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES facility_answers(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('misinfo', 'privacy', 'off_topic', 'spam', 'abuse')),
  details text CHECK (char_length(details) <= 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  CHECK (
    ((question_id IS NOT NULL)::int + (answer_id IS NOT NULL)::int) = 1
  )
);

CREATE INDEX IF NOT EXISTS idx_qr_status_created ON qa_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_question ON qa_reports (question_id) WHERE question_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_answer ON qa_reports (answer_id) WHERE answer_id IS NOT NULL;

-- Keep updated_at in sync for official FAQs.
CREATE OR REPLACE FUNCTION set_facility_faq_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_facility_faq_updated_at ON facility_faqs;
CREATE TRIGGER trg_facility_faq_updated_at
  BEFORE UPDATE ON facility_faqs
  FOR EACH ROW EXECUTE FUNCTION set_facility_faq_updated_at();

-- Maintain question last activity timestamp from all relevant write paths.
CREATE OR REPLACE FUNCTION touch_question_activity(p_question_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE facility_questions
  SET last_activity_at = NOW()
  WHERE id = p_question_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_touch_question_from_answer()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM touch_question_activity(NEW.question_id);
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.question_id <> OLD.question_id THEN
      PERFORM touch_question_activity(OLD.question_id);
      PERFORM touch_question_activity(NEW.question_id);
    ELSIF NEW.answer_text <> OLD.answer_text OR NEW.status <> OLD.status THEN
      PERFORM touch_question_activity(NEW.question_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_question_from_answer_insert ON facility_answers;
CREATE TRIGGER trg_touch_question_from_answer_insert
  AFTER INSERT ON facility_answers
  FOR EACH ROW EXECUTE FUNCTION trg_touch_question_from_answer();

DROP TRIGGER IF EXISTS trg_touch_question_from_answer_update ON facility_answers;
CREATE TRIGGER trg_touch_question_from_answer_update
  AFTER UPDATE OF question_id, answer_text, status ON facility_answers
  FOR EACH ROW EXECUTE FUNCTION trg_touch_question_from_answer();

CREATE OR REPLACE FUNCTION trg_touch_question_from_question_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pinned <> OLD.pinned OR NEW.status <> OLD.status THEN
    NEW.last_activity_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_question_from_question_update ON facility_questions;
CREATE TRIGGER trg_touch_question_from_question_update
  BEFORE UPDATE OF pinned, status ON facility_questions
  FOR EACH ROW EXECUTE FUNCTION trg_touch_question_from_question_update();

-- review_due_at lifecycle: approved answers need refresh every 180 days.
CREATE OR REPLACE FUNCTION trg_set_answer_review_due_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.review_due_at = NOW() + INTERVAL '180 days';
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.answer_text <> OLD.answer_text OR NEW.status <> OLD.status THEN
      NEW.review_due_at = NOW() + INTERVAL '180 days';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_answer_review_due_at_insert ON facility_answers;
CREATE TRIGGER trg_set_answer_review_due_at_insert
  BEFORE INSERT ON facility_answers
  FOR EACH ROW EXECUTE FUNCTION trg_set_answer_review_due_at();

DROP TRIGGER IF EXISTS trg_set_answer_review_due_at_update ON facility_answers;
CREATE TRIGGER trg_set_answer_review_due_at_update
  BEFORE UPDATE OF answer_text, status ON facility_answers
  FOR EACH ROW EXECUTE FUNCTION trg_set_answer_review_due_at();

-- Vote counter sync + question activity updates.
CREATE OR REPLACE FUNCTION trg_apply_vote_counter()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE facility_questions
    SET upvote_count = upvote_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.question_id;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    UPDATE facility_questions
    SET upvote_count = GREATEST(0, upvote_count - 1),
        last_activity_at = NOW()
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_vote_counter_insert ON qa_votes;
CREATE TRIGGER trg_vote_counter_insert
  AFTER INSERT ON qa_votes
  FOR EACH ROW EXECUTE FUNCTION trg_apply_vote_counter();

DROP TRIGGER IF EXISTS trg_vote_counter_delete ON qa_votes;
CREATE TRIGGER trg_vote_counter_delete
  AFTER DELETE ON qa_votes
  FOR EACH ROW EXECUTE FUNCTION trg_apply_vote_counter();

-- Extend approved view for ranking and interactions.
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
  a.created_at AS answer_date
FROM facility_questions q
LEFT JOIN facility_answers a
  ON a.question_id = q.id
 AND a.status = 'approved'
WHERE q.status = 'approved';

-- RLS for new tables.
ALTER TABLE facility_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS read_published_faqs ON facility_faqs;
CREATE POLICY read_published_faqs
  ON facility_faqs
  FOR SELECT
  USING (
    is_published = true
    OR facility_id IN (
      SELECT id FROM facilities WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS owners_manage_faqs ON facility_faqs;
CREATE POLICY owners_manage_faqs
  ON facility_faqs
  FOR ALL
  USING (
    facility_id IN (
      SELECT id FROM facilities WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND facility_id IN (
      SELECT id FROM facilities WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS read_votes ON qa_votes;
CREATE POLICY read_votes
  ON qa_votes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS insert_own_votes ON qa_votes;
CREATE POLICY insert_own_votes
  ON qa_votes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM facility_questions fq
      WHERE fq.id = question_id
        AND fq.status = 'approved'
    )
  );

DROP POLICY IF EXISTS delete_own_votes ON qa_votes;
CREATE POLICY delete_own_votes
  ON qa_votes
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_reports ON qa_reports;
CREATE POLICY insert_reports
  ON qa_reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS read_own_reports ON qa_reports;
CREATE POLICY read_own_reports
  ON qa_reports
  FOR SELECT
  USING (auth.uid() = reporter_user_id);

DROP POLICY IF EXISTS owners_read_reports ON qa_reports;
CREATE POLICY owners_read_reports
  ON qa_reports
  FOR SELECT
  USING (
    (question_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM facility_questions fq
      JOIN facilities f ON f.id = fq.facility_id
      WHERE fq.id = qa_reports.question_id
        AND f.owner_id = auth.uid()
    ))
    OR
    (answer_id IS NOT NULL AND EXISTS (
      SELECT 1
      FROM facility_answers fa
      JOIN facility_questions fq ON fq.id = fa.question_id
      JOIN facilities f ON f.id = fq.facility_id
      WHERE fa.id = qa_reports.answer_id
        AND f.owner_id = auth.uid()
    ))
  );
