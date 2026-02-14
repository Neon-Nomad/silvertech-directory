import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';

export interface FacilityAnswer {
  id: string;
  answer_text: string;
  is_operator: boolean;
  verification_tier?: 'community' | 'premium_verified';
  answer_date: string;
}

export interface FacilityQuestion {
  id: string;
  facility_id: string;
  question_text: string;
  question_date: string;
  upvote_count: number;
  pinned: boolean;
  last_activity_at: string;
  answers: FacilityAnswer[];
}

interface UseFacilityQuestionsResult {
  questions: FacilityQuestion[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ApprovedFacilityQaRow {
  question_id: string;
  facility_id: string;
  question_text: string;
  question_date: string;
  upvote_count: number | null;
  pinned: boolean | null;
  last_activity_at: string | null;
  answer_id: string | null;
  answer_text: string | null;
  is_operator: boolean | null;
  verification_tier: 'community' | 'premium_verified' | null;
  answer_date: string | null;
}

const recencyBonus = (iso: string): number => {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return 0;
  const ageDays = (Date.now() - ts) / (1000 * 60 * 60 * 24);
  if (ageDays <= 30) return 2;
  if (ageDays <= 90) return 1;
  return 0;
};

const computeQuestionScore = (question: FacilityQuestion): number => {
  const premiumVerifiedBonus = question.answers.some((a) => a.verification_tier === 'premium_verified') ? 3 : 0;
  const operatorAnswerBonus = question.answers.some((a) => a.is_operator) ? 1 : 0;
  const answerBonus = FEATURE_FLAGS.qa_priority_verified_ordering ? Math.max(premiumVerifiedBonus, operatorAnswerBonus) : operatorAnswerBonus;
  return question.upvote_count * 2 + answerBonus + recencyBonus(question.last_activity_at || question.question_date);
};

const groupRows = (rows: ApprovedFacilityQaRow[]): FacilityQuestion[] => {
  const questionMap = new Map<string, FacilityQuestion>();

  for (const row of rows) {
    if (!questionMap.has(row.question_id)) {
      questionMap.set(row.question_id, {
        id: row.question_id,
        facility_id: row.facility_id,
        question_text: row.question_text,
        question_date: row.question_date,
        upvote_count: Number(row.upvote_count || 0),
        pinned: Boolean(row.pinned),
        last_activity_at: row.last_activity_at || row.question_date,
        answers: [],
      });
    }

    if (row.answer_id && row.answer_text) {
      const question = questionMap.get(row.question_id)!;
      question.answers.push({
        id: row.answer_id,
        answer_text: row.answer_text,
        is_operator: Boolean(row.is_operator),
        verification_tier: (row.verification_tier || 'community') as 'community' | 'premium_verified',
        answer_date: row.answer_date || '',
      });
    }
  }

  return Array.from(questionMap.values())
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const scoreDiff = computeQuestionScore(b) - computeQuestionScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.last_activity_at || b.question_date).getTime() - new Date(a.last_activity_at || a.question_date).getTime();
    });
};

export const useFacilityQuestions = (facilityId: string): UseFacilityQuestionsResult => {
  const [questions, setQuestions] = useState<FacilityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!facilityId) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: viewError } = await supabase
        .from('approved_facility_qa')
        .select('*')
        .eq('facility_id', facilityId)
        .order('question_date', { ascending: false })
        .order('answer_date', { ascending: true });

      if (viewError) {
        throw viewError;
      }

      const grouped = groupRows((data || []) as ApprovedFacilityQaRow[]);
      setQuestions(grouped);
    } catch (viewFetchErr) {
      try {
        const { data: rawQuestions, error: qErr } = await supabase
          .from('facility_questions')
          .select('id, facility_id, question_text, created_at, upvote_count, pinned, last_activity_at')
          .eq('facility_id', facilityId)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (qErr) throw qErr;

        const questionIds = (rawQuestions || []).map((q: any) => q.id);
        let answerMap = new Map<string, FacilityAnswer[]>();

        if (questionIds.length > 0) {
          const { data: rawAnswers, error: aErr } = await supabase
            .from('facility_answers')
            .select('id, question_id, answer_text, is_operator, verification_tier, created_at')
            .in('question_id', questionIds)
            .eq('status', 'approved')
            .order('created_at', { ascending: true });

          if (aErr) throw aErr;

          for (const answer of rawAnswers || []) {
            const questionId = answer.question_id as string;
            const list = answerMap.get(questionId) || [];
            list.push({
              id: answer.id,
              answer_text: answer.answer_text,
              is_operator: Boolean(answer.is_operator),
              verification_tier: (answer.verification_tier || 'community') as 'community' | 'premium_verified',
              answer_date: answer.created_at,
            });
            answerMap.set(questionId, list);
          }
        }

        const normalized: FacilityQuestion[] = (rawQuestions || []).map((q: any) => ({
          id: q.id,
          facility_id: q.facility_id,
          question_text: q.question_text,
          question_date: q.created_at,
          upvote_count: Number(q.upvote_count || 0),
          pinned: Boolean(q.pinned),
          last_activity_at: q.last_activity_at || q.created_at,
          answers: answerMap.get(q.id) || [],
        }));

        setQuestions(
          normalized.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            const scoreDiff = computeQuestionScore(b) - computeQuestionScore(a);
            if (scoreDiff !== 0) return scoreDiff;
            return new Date(b.last_activity_at || b.question_date).getTime() - new Date(a.last_activity_at || a.question_date).getTime();
          })
        );
      } catch (fallbackErr: any) {
        setError(fallbackErr?.message || 'Unable to load questions right now.');
      }
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    refetch: fetchQuestions,
  };
};
