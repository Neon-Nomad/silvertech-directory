-- Facility Q&A foundation (Step 1): tables + indexes only.
-- RLS policies, views, triggers, and RPC are added in later steps.

CREATE TABLE IF NOT EXISTS facility_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  question_text text NOT NULL CHECK (char_length(question_text) BETWEEN 10 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz DEFAULT NOW(),
  moderated_at timestamptz,
  moderator_id uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS facility_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES facility_questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answer_text text NOT NULL CHECK (char_length(answer_text) BETWEEN 1 AND 2000),
  -- v1 is operator-only; this CHECK can be dropped when community answers are enabled.
  is_operator boolean NOT NULL DEFAULT TRUE CHECK (is_operator = TRUE),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz DEFAULT NOW(),
  moderated_at timestamptz,
  moderator_id uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_fq_facility_status ON facility_questions(facility_id, status);
CREATE INDEX IF NOT EXISTS idx_fq_user ON facility_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_fq_status_created ON facility_questions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_fa_question_status ON facility_answers(question_id, status);
CREATE INDEX IF NOT EXISTS idx_fa_status_created ON facility_answers(status, created_at);
CREATE INDEX IF NOT EXISTS idx_fa_status_question ON facility_answers(status, question_id);
