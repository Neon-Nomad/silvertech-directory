import { createClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

type FacilityAnswer = {
  id: string;
  answer_text: string;
  is_operator: boolean;
  verification_tier: 'community' | 'premium_verified';
  answer_date: string;
};

type FacilityQuestion = {
  id: string;
  question_text: string;
  question_date: string;
  upvote_count: number;
  pinned: boolean;
  answers: FacilityAnswer[];
};

type QaRow = {
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
};

type Props = {
  facilityId: string;
  facilityName: string;
};

function groupRows(rows: QaRow[]): FacilityQuestion[] {
  const map = new Map<string, FacilityQuestion>();
  for (const row of rows) {
    if (!map.has(row.question_id)) {
      map.set(row.question_id, {
        id: row.question_id,
        question_text: row.question_text,
        question_date: row.question_date,
        upvote_count: Number(row.upvote_count || 0),
        pinned: Boolean(row.pinned),
        answers: [],
      });
    }
    if (row.answer_id && row.answer_text) {
      map.get(row.question_id)!.answers.push({
        id: row.answer_id,
        answer_text: row.answer_text,
        is_operator: Boolean(row.is_operator),
        verification_tier: row.verification_tier || 'community',
        answer_date: row.answer_date || '',
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.upvote_count - a.upvote_count;
  });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function FacilityQASection({ facilityId, facilityName }: Props) {
  const [questions, setQuestions] = useState<FacilityQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!facilityId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || '',
        import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      );
      const { data, error: err } = await supabase
        .from('approved_facility_qa')
        .select('*')
        .eq('facility_id', facilityId)
        .order('question_date', { ascending: false });

      if (err) throw err;
      setQuestions(groupRows((data || []) as QaRow[]));
    } catch (e: any) {
      setError(e?.message || 'Unable to load questions.');
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="fp-qa-loading">Loading community questions…</div>;
  }

  if (error) {
    return <div className="fp-qa-loading" style={{ color: '#ef4444' }}>{error}</div>;
  }

  return (
    <div>
      {questions.length === 0 ? (
        <p className="fp-qa-empty">
          No questions yet. Be the first to ask about {facilityName}.
        </p>
      ) : (
        <ul className="fp-qa-list">
          {questions.slice(0, 6).map((q) => (
            <li key={q.id} className="fp-qa-item">
              <div className="fp-qa-question">
                <span className="fp-qa-q-icon" aria-hidden="true">Q</span>
                <span>{q.question_text}</span>
              </div>
              {q.answers.length === 0 ? (
                <div className="fp-qa-no-answers">No answers yet — register to be the first.</div>
              ) : (
                <ul className="fp-qa-answers">
                  {q.answers.map((a) => (
                    <li key={a.id} className="fp-qa-answer">
                      {a.verification_tier === 'premium_verified' ? (
                        <span className="fp-qa-advisor-badge">
                          <span>★</span> SilverTech Care Advisor
                        </span>
                      ) : a.is_operator ? (
                        <span className="fp-qa-operator-badge">Facility</span>
                      ) : null}
                      <span style={{ flex: 1 }}>{a.answer_text}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="fp-qa-meta">{formatDate(q.question_date)}{q.upvote_count > 0 ? ` · ${q.upvote_count} helpful` : ''}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="fp-qa-cta">
        <p className="fp-qa-cta-title">Have a question about {facilityName}?</p>
        <p className="fp-qa-cta-sub">Create a free account to ask questions and get answers from our care advisors and the community.</p>
        <a href="/register" className="fp-btn fp-btn-gold" style={{ display: 'inline-flex' }}>
          Ask a Question — Free
        </a>
      </div>
    </div>
  );
}
