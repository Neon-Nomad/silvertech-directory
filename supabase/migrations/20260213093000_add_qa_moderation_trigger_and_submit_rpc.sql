-- Facility Q&A moderation + submit RPC (Step 4): triggers and server-side rate limiting.

-- Moderation trigger function:
-- sets moderated_at when status transitions from pending -> approved/rejected.
CREATE OR REPLACE FUNCTION notify_qa_moderation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    NEW.moderated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_question_moderation ON facility_questions;
CREATE TRIGGER trg_question_moderation
  BEFORE UPDATE OF status ON facility_questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_qa_moderation();

DROP TRIGGER IF EXISTS trg_answer_moderation ON facility_answers;
CREATE TRIGGER trg_answer_moderation
  BEFORE UPDATE OF status ON facility_answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_qa_moderation();

-- Server-side question submission RPC.
-- SECURITY DEFINER + explicit search_path for safe execution.
CREATE OR REPLACE FUNCTION submit_question(
  p_facility_id uuid,
  p_question_text text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  recent_count int;
  new_id uuid;
  cleaned_text text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  cleaned_text := btrim(COALESCE(p_question_text, ''));

  IF char_length(cleaned_text) < 10 OR char_length(cleaned_text) > 1000 THEN
    RAISE EXCEPTION 'Question must be between 10 and 1000 characters.';
  END IF;

  SELECT COUNT(*) INTO recent_count
  FROM facility_questions
  WHERE user_id = auth.uid()
    AND created_at > NOW() - INTERVAL '24 hours';

  IF recent_count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Maximum 5 questions per day.';
  END IF;

  INSERT INTO facility_questions (facility_id, user_id, question_text)
  VALUES (p_facility_id, auth.uid(), cleaned_text)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION submit_question(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_question(uuid, text) TO authenticated;
