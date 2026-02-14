-- Facility Q&A safe read layer (Step 3): approved-only public view.

CREATE OR REPLACE VIEW approved_facility_qa AS
SELECT
  q.id AS question_id,
  q.facility_id,
  q.question_text,
  q.created_at AS question_date,
  a.id AS answer_id,
  a.answer_text,
  a.is_operator,
  a.created_at AS answer_date
FROM facility_questions q
LEFT JOIN facility_answers a
  ON a.question_id = q.id
 AND a.status = 'approved'
WHERE q.status = 'approved';
