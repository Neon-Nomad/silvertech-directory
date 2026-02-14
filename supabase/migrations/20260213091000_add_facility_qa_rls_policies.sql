-- Facility Q&A access control (Step 2): RLS + policies only.

ALTER TABLE facility_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_answers ENABLE ROW LEVEL SECURITY;

-- QUESTION POLICIES
DROP POLICY IF EXISTS read_approved_questions ON facility_questions;
CREATE POLICY read_approved_questions
  ON facility_questions
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS read_own_questions ON facility_questions;
CREATE POLICY read_own_questions
  ON facility_questions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS owners_read_facility_questions ON facility_questions;
CREATE POLICY owners_read_facility_questions
  ON facility_questions
  FOR SELECT
  USING (
    facility_id IN (
      SELECT id FROM facilities WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS insert_questions ON facility_questions;
CREATE POLICY insert_questions
  ON facility_questions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS update_own_pending_questions ON facility_questions;
CREATE POLICY update_own_pending_questions
  ON facility_questions
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS delete_own_pending_questions ON facility_questions;
CREATE POLICY delete_own_pending_questions
  ON facility_questions
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- ANSWER POLICIES
DROP POLICY IF EXISTS read_approved_answers ON facility_answers;
CREATE POLICY read_approved_answers
  ON facility_answers
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS read_own_answers ON facility_answers;
CREATE POLICY read_own_answers
  ON facility_answers
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS insert_operator_answers ON facility_answers;
CREATE POLICY insert_operator_answers
  ON facility_answers
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM facility_questions fq
      JOIN facilities f ON f.id = fq.facility_id
      WHERE fq.id = question_id
        AND f.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS update_own_pending_answers ON facility_answers;
CREATE POLICY update_own_pending_answers
  ON facility_answers
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS delete_own_pending_answers ON facility_answers;
CREATE POLICY delete_own_pending_answers
  ON facility_answers
  FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');
