import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { FacilityQuestion } from '@/src/hooks/useFacilityQuestions';
import { useFacilityFaqs } from '@/src/hooks/useFacilityFaqs';
import { AskQuestionForm } from '@/features/family/discovery/AskQuestionForm';
import { FacilityQASchema } from '@/features/family/discovery/FacilityQASchema';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { trackEvent } from '@/src/utils/analytics';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { useLeadTracking } from '@/src/hooks/useLeadTracking';

interface FacilityQAProps {
  facilityId: string;
  facilityName: string;
  questions: FacilityQuestion[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  hasOwner: boolean;
  claimedAt: string | null;
  isPremiumFacility: boolean;
}

const INITIAL_VISIBLE_QUESTIONS = 5;
const LOAD_MORE_COUNT = 5;

export const FacilityQA: React.FC<FacilityQAProps> = ({
  facilityId,
  facilityName,
  questions,
  loading,
  error,
  onRefresh,
  hasOwner,
  claimedAt,
  isPremiumFacility,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trackLeadEvent } = useLeadTracking();
  const { faqs: officialFaqs } = useFacilityFaqs(facilityId);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_QUESTIONS);
  const [votedQuestionIds, setVotedQuestionIds] = useState<Set<string>>(new Set());
  const [submittingVoteFor, setSubmittingVoteFor] = useState<string | null>(null);
  const [reportingTarget, setReportingTarget] = useState<{ kind: 'question' | 'answer'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState<'misinfo' | 'privacy' | 'off_topic' | 'spam' | 'abuse'>('misinfo');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    const sessionKey = `qa_section_viewed_${facilityId}`;
    if (hasTrackedView.current) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem(sessionKey) === '1') {
      hasTrackedView.current = true;
      return;
    }
    hasTrackedView.current = true;
    trackEvent('qa_section_viewed', { facilityId });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, '1');
    }
  }, [facilityId]);

  useEffect(() => {
    const loadVotes = async () => {
      if (!user || questions.length === 0) {
        setVotedQuestionIds(new Set());
        return;
      }

      const questionIds = questions.map((q) => q.id);
      const { data } = await supabase
        .from('qa_votes')
        .select('question_id')
        .eq('user_id', user.id)
        .in('question_id', questionIds);

      setVotedQuestionIds(new Set((data || []).map((row: any) => String(row.question_id))));
    };

    loadVotes();
  }, [questions, user]);

  const toggleQuestion = (questionId: string) => {
    const willExpand = !expandedIds[questionId];
    setExpandedIds((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
    if (willExpand) {
      const key = `lead_event_faq_viewed_${facilityId}_${questionId}`;
      if (typeof window !== 'undefined') {
        if (sessionStorage.getItem(key) === '1') return;
        sessionStorage.setItem(key, '1');
      }
      void trackLeadEvent(facilityId, 'faq_viewed', { source: 'qa_question_expand', questionId });
    }
  };

  const handleVote = async (questionId: string) => {
    if (!user) {
      navigate(`/login?redirect_to=${encodeURIComponent(`/facility/${facilityId}`)}`);
      return;
    }

    const hasVoted = votedQuestionIds.has(questionId);
    const previousVotes = new Set(votedQuestionIds);
    const nextVotes = new Set(votedQuestionIds);
    if (hasVoted) {
      nextVotes.delete(questionId);
    } else {
      nextVotes.add(questionId);
    }

    // Optimistic UI: reflect vote state immediately.
    setVotedQuestionIds(nextVotes);
    setSubmittingVoteFor(questionId);
    try {
      if (hasVoted) {
        const { error: deleteError } = await supabase
          .from('qa_votes')
          .delete()
          .eq('question_id', questionId)
          .eq('user_id', user.id);
        if (deleteError) throw deleteError;
      } else {
        const { error: insertError } = await supabase
          .from('qa_votes')
          .insert({ question_id: questionId, user_id: user.id });
        if (insertError) throw insertError;
      }
      trackEvent('qa_upvoted', { facilityId, questionId, action: hasVoted ? 'remove' : 'add' });
      await onRefresh();
    } catch {
      // Roll back optimistic vote state if DB write fails.
      setVotedQuestionIds(previousVotes);
    } finally {
      setSubmittingVoteFor(null);
    }
  };

  const submitReport = async () => {
    if (!user || !reportingTarget) return;
    setReportError(null);
    setSubmittingReport(true);
    try {
      const payload: any = {
        reporter_user_id: user.id,
        reason: reportReason,
        details: reportDetails.trim() || null,
      };

      if (reportingTarget.kind === 'question') {
        payload.question_id = reportingTarget.id;
      } else {
        payload.answer_id = reportingTarget.id;
      }

      const { error: insertError } = await supabase.from('qa_reports').insert(payload);
      if (insertError) throw insertError;
      trackEvent('qa_report_submitted', {
        facilityId,
        targetType: reportingTarget.kind,
        targetId: reportingTarget.id,
        reason: reportReason,
      });
      setReportingTarget(null);
      setReportReason('misinfo');
      setReportDetails('');
    } catch (err: any) {
      const message = String(err?.message || '').toLowerCase();
      if (message.includes('duplicate key')) {
        setReportError('You already reported this content.');
      } else {
        setReportError('Unable to submit report right now.');
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  const questionCountLabel = useMemo(() => {
    const count = questions.length;
    return `${count} question${count === 1 ? '' : 's'}`;
  }, [questions.length]);
  const visibleQuestions = useMemo(() => questions.slice(0, visibleCount), [questions, visibleCount]);
  const hasMore = questions.length > visibleCount;
  const claimedAtTs = claimedAt ? new Date(claimedAt).getTime() : NaN;

  const isStaleUnverified = (question: FacilityQuestion) => {
    if (!FEATURE_FLAGS.qa_unverified_staleness_labels) return false;
    if (!hasOwner || !Number.isFinite(claimedAtTs)) return false;
    if (question.answers.some((answer) => answer.is_operator)) return false;
    const questionTs = new Date(question.question_date).getTime();
    if (!Number.isFinite(questionTs)) return false;
    const ageDays = (Date.now() - questionTs) / (1000 * 60 * 60 * 24);
    return ageDays >= 60 && questionTs >= claimedAtTs;
  };

  return (
    <>
      <FacilityQASchema
        facilityId={facilityId}
        questions={questions}
        officialFaqs={officialFaqs}
        isPremiumFacility={isPremiumFacility}
      />
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-serif font-bold text-charcoal">Community Q&A</h2>
          <p className="mt-2 text-sm text-charcoal/70">
            Read verified questions from families and responses from the facility team.
          </p>
          {!hasOwner && (
            <div className="mt-4 rounded-lg border border-warm-gray bg-warm-white px-3 py-2">
              <p className="text-sm text-charcoal/70">No verified representative has joined this conversation yet.</p>
            </div>
          )}
          <div className="mt-6">
            <AskQuestionForm facilityId={facilityId} facilityName={facilityName} onSubmitted={onRefresh} />
          </div>
          {officialFaqs.length > 0 && (
            <div className="mt-6 rounded-lg border border-primary-100 bg-primary-50/40 p-4">
              <p className="text-xs uppercase tracking-widest text-primary-700 font-semibold">Official FAQs</p>
              <div className="mt-3 space-y-3">
                {officialFaqs.slice(0, 3).map((faq) => (
                  <div key={faq.id}>
                    <p className="text-sm font-semibold text-charcoal">{faq.question_text}</p>
                    <p className="text-sm text-charcoal/80 mt-1">{faq.answer_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-charcoal/60 font-semibold">{questionCountLabel}</p>
          </div>
        </div>

        <div className="border-t border-warm-gray p-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-16 bg-warm-gray rounded animate-pulse" />
              <div className="h-16 bg-warm-gray rounded animate-pulse" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>
          ) : questions.length === 0 ? (
            <p className="text-sm text-charcoal/70">
              No questions yet. Be the first to ask about {facilityName}.
            </p>
          ) : (
            <div className="space-y-3">
              {visibleQuestions.map((question) => {
                const isExpanded = Boolean(expandedIds[question.id]);
                const panelId = `qa-panel-${question.id}`;
                const buttonId = `qa-button-${question.id}`;
                const titleId = `qa-title-${question.id}`;
                return (
                  <article
                    key={question.id}
                    id={`qa-${question.id}`}
                    className="border border-warm-gray rounded-lg bg-white"
                    aria-labelledby={titleId}
                  >
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      onClick={() => toggleQuestion(question.id)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-warm-gray/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded-lg"
                    >
                      <span id={titleId} className="text-sm font-semibold text-charcoal">{question.question_text}</span>
                      <span className="text-xs text-charcoal/60">{isExpanded ? 'Hide' : 'View'}</span>
                    </button>
                    {isExpanded && (
                      <div id={panelId} role="region" aria-labelledby={buttonId} className="px-4 pb-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleVote(question.id)}
                            disabled={submittingVoteFor === question.id}
                            className={`text-xs font-semibold rounded-full border px-3 py-1 ${
                              votedQuestionIds.has(question.id)
                                ? 'bg-primary-50 border-primary-200 text-primary-700'
                                : 'bg-white border-warm-gray text-charcoal/70'
                            }`}
                          >
                            {votedQuestionIds.has(question.id) ? 'Upvoted' : 'Upvote'} ({question.upvote_count})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!user) {
                                navigate(`/login?redirect_to=${encodeURIComponent(`/facility/${facilityId}`)}`);
                                return;
                              }
                              setReportingTarget({ kind: 'question', id: question.id });
                            }}
                            className="text-xs text-charcoal/70 underline underline-offset-2"
                          >
                            Report
                          </button>
                          {question.pinned && (
                            <span className="text-[10px] uppercase tracking-widest bg-gold/15 text-charcoal border border-gold/40 rounded-full px-2 py-1">
                              Pinned
                            </span>
                          )}
                        </div>
                        {isStaleUnverified(question) && (
                          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            Community Sourced - Not Verified by Facility
                          </p>
                        )}
                        {question.answers.length === 0 ? (
                          <p className="text-sm text-charcoal/60">No approved answers yet.</p>
                        ) : (
                          question.answers.map((answer) => (
                            <div key={answer.id} className="rounded-md border border-warm-gray bg-warm-white p-3">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                {answer.is_operator && (
                                  answer.verification_tier === 'premium_verified' ? (
                                    <span className="text-[10px] uppercase tracking-widest bg-primary-50 text-primary-700 border border-primary-100 rounded-full px-2 py-1">
                                      Verified Representative
                                    </span>
                                  ) : (
                                    <span className="text-[10px] uppercase tracking-widest bg-warm-gray text-charcoal/70 border border-warm-gray rounded-full px-2 py-1">
                                      Facility Response
                                    </span>
                                  )
                                )}
                              </div>
                              <p className="text-sm text-charcoal/80">{answer.answer_text}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!user) {
                                    navigate(`/login?redirect_to=${encodeURIComponent(`/facility/${facilityId}`)}`);
                                    return;
                                  }
                                  setReportingTarget({ kind: 'answer', id: answer.id });
                                }}
                                className="mt-2 text-xs text-charcoal/70 underline underline-offset-2"
                              >
                                Report
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              {hasMore && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
                    className="text-sm font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
                  >
                    Show more questions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {reportingTarget && (
        <Card className="mt-4">
          <div className="p-4">
            <h3 className="text-base font-semibold text-charcoal">Report content</h3>
            <p className="text-sm text-charcoal/70 mt-1">
              This helps us remove misinformation, spam, or privacy violations quickly.
            </p>
            <div className="mt-3">
              <label htmlFor="qa-report-reason" className="text-xs uppercase tracking-widest text-charcoal/60 font-semibold">
                Reason
              </label>
              <select
                id="qa-report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as typeof reportReason)}
                className="mt-1 w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
              >
                <option value="misinfo">Misinformation</option>
                <option value="privacy">Privacy / HIPAA</option>
                <option value="off_topic">Off topic</option>
                <option value="spam">Spam</option>
                <option value="abuse">Abusive content</option>
              </select>
            </div>
            <div className="mt-3">
              <label htmlFor="qa-report-details" className="text-xs uppercase tracking-widest text-charcoal/60 font-semibold">
                Details (optional)
              </label>
              <textarea
                id="qa-report-details"
                rows={3}
                maxLength={2000}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="mt-1 w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={submitReport}
                disabled={submittingReport}
                className="rounded-md bg-charcoal text-white px-3 py-2 text-sm"
              >
                {submittingReport ? 'Submitting...' : 'Submit report'}
              </button>
              <button
                type="button"
                onClick={() => setReportingTarget(null)}
                className="rounded-md border border-warm-gray px-3 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
            {reportError && <p className="mt-2 text-xs text-red-700">{reportError}</p>}
          </div>
        </Card>
      )}
    </>
  );
};
