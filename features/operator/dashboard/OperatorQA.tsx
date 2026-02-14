import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { sanitizeInput } from '@/src/utils/qaGuards';
import { trackEvent } from '@/src/utils/analytics';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { useOperatorPlan } from '@/src/hooks/useOperatorPlan';
import { UpgradeModal } from './UpgradeModal';

type QuestionStatus = 'pending' | 'approved' | 'rejected';

interface FacilityRow {
  id: string;
  name: string;
}

interface QuestionRow {
  id: string;
  facility_id: string;
  question_text: string;
  status: QuestionStatus;
  rejection_reason: string | null;
  created_at: string;
}

interface AnswerRow {
  id: string;
  question_id: string;
  answer_text: string;
  status: QuestionStatus;
  created_at: string;
  user_id: string | null;
  review_due_at: string | null;
}

interface FaqRow {
  id: string;
  facility_id: string;
  question_text: string;
  answer_text: string;
  is_published: boolean;
  updated_at: string;
}

interface CanAnswerResult {
  allowed: boolean;
  reason: string;
  answers_this_month: number;
  plan: string;
}

const statusClass: Record<QuestionStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};
const ANSWER_MIN_LEN = 1;
const ANSWER_MAX_LEN = 2000;

interface OperatorQAProps {
  highlightQuestionId?: string | null;
}

export const OperatorQA: React.FC<OperatorQAProps> = ({ highlightQuestionId = null }) => {
  const { user } = useAuth();
  const { plan, isPremium, loading: planLoading } = useOperatorPlan();
  const [facilities, setFacilities] = useState<FacilityRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [faqQuestionDrafts, setFaqQuestionDrafts] = useState<Record<string, string>>({});
  const [faqAnswerDrafts, setFaqAnswerDrafts] = useState<Record<string, string>>({});
  const [faqSavingFacilityId, setFaqSavingFacilityId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<Record<string, string>>({});
  const [submittingQuestionId, setSubmittingQuestionId] = useState<string | null>(null);
  const [canAnswerByQuestionId, setCanAnswerByQuestionId] = useState<Record<string, CanAnswerResult>>({});
  const [upgradeFeature, setUpgradeFeature] = useState<'verified-answers' | 'official-faqs' | null>(null);
  const isShadowMode = FEATURE_FLAGS.qa_shadow_dashboard && FEATURE_FLAGS.qa_answer_premium_gate && !isPremium;
  const hasTrackedPremiumGate = useRef(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: ownedFacilities, error: facilityError } = await supabase
        .from('facilities')
        .select('id,name')
        .eq('owner_id', user.id)
        .order('name', { ascending: true });

      if (facilityError) throw facilityError;
      const facilityRows = (ownedFacilities || []) as FacilityRow[];
      setFacilities(facilityRows);

      const facilityIds = facilityRows.map((f) => f.id);
      if (facilityIds.length === 0) {
        setQuestions([]);
        setAnswers([]);
        return;
      }

      const { data: questionRows, error: questionError } = await supabase
        .from('facility_questions')
        .select('id,facility_id,question_text,status,rejection_reason,created_at')
        .in('facility_id', facilityIds)
        .order('created_at', { ascending: false });

      if (questionError) throw questionError;
      const normalizedQuestions = (questionRows || []) as QuestionRow[];
      setQuestions(normalizedQuestions);
      setCanAnswerByQuestionId({});

      const questionIds = normalizedQuestions.map((q) => q.id);
      if (questionIds.length === 0) {
        setAnswers([]);
      } else {
        const { data: answerRows, error: answerError } = await supabase
          .from('facility_answers')
          .select('id,question_id,answer_text,status,created_at,user_id,review_due_at')
          .in('question_id', questionIds)
          .order('created_at', { ascending: false });

        if (answerError) throw answerError;
        setAnswers((answerRows || []) as AnswerRow[]);
      }

      const { data: faqRows, error: faqError } = await supabase
        .from('facility_faqs')
        .select('id,facility_id,question_text,answer_text,is_published,updated_at')
        .in('facility_id', facilityIds)
        .order('updated_at', { ascending: false });

      if (faqError) throw faqError;
      setFaqs((faqRows || []) as FaqRow[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load Q&A data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!highlightQuestionId || loading) return;
    if (typeof window === 'undefined') return;

    const node = document.getElementById(`operator-qa-${highlightQuestionId}`);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightQuestionId, loading, questions.length]);

  useEffect(() => {
    if (loading || planLoading) return;
    if (!isShadowMode) return;
    if (hasTrackedPremiumGate.current) return;
    if (typeof window !== 'undefined') {
      const key = `qa_premium_gate_shown_${user?.id || 'anon'}`;
      if (sessionStorage.getItem(key) === '1') {
        hasTrackedPremiumGate.current = true;
        return;
      }
      sessionStorage.setItem(key, '1');
    }
    hasTrackedPremiumGate.current = true;
    trackEvent('qa_premium_gate_shown', { plan });
  }, [loading, planLoading, isShadowMode, plan, user?.id]);

  const groupedByFacility = useMemo(() => {
    const facilitiesById = new Map(facilities.map((f) => [f.id, f]));
    const answersByQuestion = new Map<string, AnswerRow[]>();

    for (const answer of answers) {
      const list = answersByQuestion.get(answer.question_id) || [];
      list.push(answer);
      answersByQuestion.set(answer.question_id, list);
    }

      return facilities.map((facility) => {
        const facilityQuestions = questions
          .filter((q) => q.facility_id === facility.id)
          .map((q) => ({ ...q, answers: answersByQuestion.get(q.id) || [] }));
      const facilityFaqs = faqs.filter((faq) => faq.facility_id === facility.id);
      const staleAnswers = facilityQuestions
        .flatMap((q) => q.answers)
        .filter((answer) => {
          if (answer.status !== 'approved' || !answer.review_due_at) return false;
          return new Date(answer.review_due_at).getTime() <= Date.now();
        });
      return {
        facility: facilitiesById.get(facility.id) || facility,
        questions: facilityQuestions,
        faqs: facilityFaqs,
        staleAnswers,
      };
    });
  }, [facilities, questions, answers, faqs]);

  const handleSubmitAnswer = async (question: QuestionRow, facilityName: string) => {
    if (!user) return;

    const raw = drafts[question.id] || '';
    const sanitized = sanitizeInput(raw);
    if (sanitized.blocked) {
      setSubmitError((prev) => ({ ...prev, [question.id]: sanitized.message || 'Unable to submit answer.' }));
      return;
    }
    if (sanitized.sanitizedText.length < ANSWER_MIN_LEN || sanitized.sanitizedText.length > ANSWER_MAX_LEN) {
      setSubmitError((prev) => ({ ...prev, [question.id]: `Answer must be between ${ANSWER_MIN_LEN} and ${ANSWER_MAX_LEN} characters.` }));
      return;
    }

    setSubmittingQuestionId(question.id);
    setSubmitError((prev) => ({ ...prev, [question.id]: '' }));
    try {
      const { error: insertError } = await supabase.rpc('submit_operator_answer', {
        p_question_id: question.id,
        p_answer_text: sanitized.sanitizedText,
      });

      if (insertError) throw insertError;

      trackEvent('operator_answer_submitted', {
        facilityId: question.facility_id,
        questionId: question.id,
        facilityName,
      });

      setDrafts((prev) => ({ ...prev, [question.id]: '' }));
      await fetchData();
    } catch (err: any) {
      setSubmitError((prev) => ({ ...prev, [question.id]: err?.message || 'Failed to submit answer.' }));
    } finally {
      setSubmittingQuestionId(null);
    }
  };

  const handleAddFaq = async (facilityId: string) => {
    if (!user) return;

    const questionText = (faqQuestionDrafts[facilityId] || '').trim();
    const answerText = (faqAnswerDrafts[facilityId] || '').trim();

    const sanitizedQ = sanitizeInput(questionText);
    const sanitizedA = sanitizeInput(answerText);
    if (sanitizedQ.blocked || sanitizedA.blocked) {
      setSubmitError((prev) => ({ ...prev, [`faq-${facilityId}`]: 'Unable to publish FAQ due to content policy.' }));
      return;
    }
    if (sanitizedQ.sanitizedText.length < 5 || sanitizedA.sanitizedText.length < 1) {
      setSubmitError((prev) => ({ ...prev, [`faq-${facilityId}`]: 'FAQ question and answer are required.' }));
      return;
    }

    setFaqSavingFacilityId(facilityId);
    setSubmitError((prev) => ({ ...prev, [`faq-${facilityId}`]: '' }));
    try {
      const { error: insertError } = await supabase.rpc('submit_official_faq', {
        p_facility_id: facilityId,
        p_question_text: sanitizedQ.sanitizedText,
        p_answer_text: sanitizedA.sanitizedText,
      });
      if (insertError) throw insertError;

      trackEvent('faq_seed_created', { facilityId });
      setFaqQuestionDrafts((prev) => ({ ...prev, [facilityId]: '' }));
      setFaqAnswerDrafts((prev) => ({ ...prev, [facilityId]: '' }));
      await fetchData();
    } catch (err: any) {
      setSubmitError((prev) => ({ ...prev, [`faq-${facilityId}`]: err?.message || 'Unable to save FAQ.' }));
    } finally {
      setFaqSavingFacilityId(null);
    }
  };

  const loadCanAnswer = async (questionId: string) => {
    if (!FEATURE_FLAGS.qa_free_tier_limited_clarification || isPremium) return;
    const { data } = await supabase.rpc('can_operator_answer', { p_question_id: questionId });
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return;
    setCanAnswerByQuestionId((prev) => ({ ...prev, [questionId]: row as CanAnswerResult }));
  };

  if (loading) {
    return <div className="text-center py-10">Loading Q&A...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
        <h3 className="text-lg font-medium text-slate-900 mb-2">No facilities found</h3>
        <p className="text-slate-500">Claim a facility to start managing Q&A.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Facility Q&A</h2>
      </div>

      {groupedByFacility.map(({ facility, questions: facilityQuestions, faqs: facilityFaqs, staleAnswers }) => (
        <div key={facility.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{facility.name}</h3>
            <span className="text-xs uppercase tracking-wider text-slate-500">
              {facilityQuestions.length} question{facilityQuestions.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs uppercase tracking-wider text-amber-800 font-semibold">Review due</p>
            <p className="text-sm text-amber-900 mt-1">
              {staleAnswers.length > 0
                ? `${staleAnswers.length} approved answer${staleAnswers.length === 1 ? '' : 's'} should be refreshed.`
                : 'All approved answers are within the current 180-day review window.'}
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-primary-100 bg-primary-50/40 p-4">
            <h4 className="text-sm font-semibold text-charcoal">Official FAQ (SEO seeding)</h4>
            <p className="text-xs text-charcoal/70 mt-1">
              Publish direct, high-value questions families ask most often.
            </p>
            {isShadowMode && (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Upgrade to publish Official FAQs and unlock premium FAQ schema benefits.
                <button
                  type="button"
                  className="ml-2 underline font-semibold"
                  onClick={() => {
                    trackEvent('qa_shadow_answer_click', { feature: 'official-faqs', facilityId: facility.id });
                    setUpgradeFeature('official-faqs');
                  }}
                >
                  Upgrade
                </button>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {facilityFaqs.slice(0, 5).map((faq) => (
                <div key={faq.id} className="rounded border border-primary-100 bg-white px-3 py-2">
                  <p className="text-sm font-semibold text-charcoal">{faq.question_text}</p>
                  <p className="text-sm text-charcoal/80 mt-1">{faq.answer_text}</p>
                </div>
              ))}
              {facilityFaqs.length === 0 && (
                <p className="text-sm text-charcoal/70">No official FAQs yet.</p>
              )}
            </div>
            <div className="mt-3 grid gap-2">
              <input
                value={faqQuestionDrafts[facility.id] || ''}
                onChange={(e) => setFaqQuestionDrafts((prev) => ({ ...prev, [facility.id]: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="FAQ question (example: Do you accept Medicaid waivers?)"
                maxLength={300}
                disabled={isShadowMode}
              />
              <textarea
                rows={3}
                value={faqAnswerDrafts[facility.id] || ''}
                onChange={(e) => setFaqAnswerDrafts((prev) => ({ ...prev, [facility.id]: e.target.value }))}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                placeholder="FAQ answer"
                maxLength={2000}
                disabled={isShadowMode}
              />
            </div>
            {submitError[`faq-${facility.id}`] && (
              <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1" role="alert">
                {submitError[`faq-${facility.id}`]}
              </p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                onClick={() => handleAddFaq(facility.id)}
                disabled={faqSavingFacilityId === facility.id || isShadowMode}
              >
                {faqSavingFacilityId === facility.id ? 'Saving...' : 'Publish official FAQ'}
              </Button>
            </div>
          </div>

          {facilityQuestions.length === 0 ? (
            <p className="text-sm text-slate-600">No questions yet for this facility.</p>
          ) : (
            <div className="space-y-4">
              {facilityQuestions.map((question) => {
                const hasAnswer = question.answers.length > 0;
                const status = question.status;
                const draftText = drafts[question.id] || '';
                const trimmedLen = draftText.trim().length;
                const withinBounds = trimmedLen >= ANSWER_MIN_LEN && trimmedLen <= ANSWER_MAX_LEN;
                return (
                  <div
                    key={question.id}
                    id={`operator-qa-${question.id}`}
                    className={`border rounded-lg p-4 ${
                      highlightQuestionId === question.id
                        ? 'border-primary-400 ring-2 ring-primary-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{question.question_text}</p>
                      <span className={`shrink-0 text-[10px] uppercase tracking-wider border rounded-full px-2 py-1 ${statusClass[status]}`}>
                        {status}
                      </span>
                    </div>
                    {question.rejection_reason && (
                      <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
                        Rejection reason: {question.rejection_reason}
                      </p>
                    )}

                    {hasAnswer && (
                      <div className="mt-3 space-y-2">
                        {question.answers.map((answer) => (
                          <div key={answer.id} className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-slate-500 uppercase tracking-wider">
                                Your answer ({answer.status})
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(answer.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="text-sm text-slate-700 mt-1">{answer.answer_text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {!hasAnswer && question.status === 'approved' && (
                      <div className="mt-3">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor={`answer-${question.id}`}>
                          Answer this question
                        </label>
                        {isShadowMode ? (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                            Upgrade to respond as a Verified Representative.
                            <button
                              type="button"
                              className="ml-2 underline font-semibold"
                              onClick={() => {
                                trackEvent('qa_shadow_answer_click', { questionId: question.id, facilityId: question.facility_id });
                                setUpgradeFeature('verified-answers');
                              }}
                            >
                              Upgrade
                            </button>
                          </div>
                        ) : (
                          <>
                            <textarea
                              id={`answer-${question.id}`}
                              rows={3}
                              maxLength={ANSWER_MAX_LEN}
                              value={draftText}
                              onChange={(e) => setDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))}
                              onFocus={() => loadCanAnswer(question.id)}
                              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Write your response for families..."
                            />
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-xs ${withinBounds ? 'text-slate-500' : 'text-amber-700'}`}>
                                {trimmedLen}/{ANSWER_MAX_LEN} characters
                              </span>
                              {FEATURE_FLAGS.qa_free_tier_limited_clarification && !isPremium && canAnswerByQuestionId[question.id] && (
                                <span className="text-xs text-slate-500">
                                  {canAnswerByQuestionId[question.id].answers_this_month}/1 free responses used this month
                                </span>
                              )}
                            </div>
                            {submitError[question.id] && (
                              <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1" role="alert">
                                {submitError[question.id]}
                              </p>
                            )}
                            <div className="mt-2 flex justify-end">
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={submittingQuestionId === question.id || !withinBounds}
                                onClick={() => handleSubmitAnswer(question, facility.name)}
                              >
                                {submittingQuestionId === question.id ? 'Submitting...' : 'Submit answer'}
                              </Button>
                            </div>
                          </>
                        )}
                        {FEATURE_FLAGS.qa_free_tier_limited_clarification && !isPremium && canAnswerByQuestionId[question.id] && !canAnswerByQuestionId[question.id].allowed && (
                          <div className="mt-2 text-xs text-amber-800">
                            {canAnswerByQuestionId[question.id].reason}
                          </div>
                        )}
                        {FEATURE_FLAGS.qa_free_tier_limited_clarification && !isPremium && !isShadowMode && (
                          <div className="mt-2 text-xs text-charcoal/60">
                            Free operators can post 1 clarification per month. Upgrade for unlimited verified responses.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      <UpgradeModal
        isOpen={Boolean(upgradeFeature)}
        onClose={() => setUpgradeFeature(null)}
        feature={upgradeFeature || 'verified-answers'}
      />
    </div>
  );
};
