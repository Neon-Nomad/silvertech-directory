import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { trackEvent } from '@/src/utils/analytics';
import {
  checkDuplicateText,
  checkQuestionRateLimit,
  recordQuestionSubmission,
  sanitizeInput,
} from '@/src/utils/qaGuards';

interface AskQuestionFormProps {
  facilityId: string;
  facilityName: string;
  onSubmitted: () => void;
}

interface OwnQuestion {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
}

const MIN_LEN = 10;
const MAX_LEN = 1000;
const formErrorId = 'qa-question-form-error';
const formHintId = 'qa-question-form-hint';

export const AskQuestionForm: React.FC<AskQuestionFormProps> = ({ facilityId, facilityName, onSubmitted }) => {
  const { user } = useAuth();
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ownQuestions, setOwnQuestions] = useState<OwnQuestion[]>([]);
  const [approvedQuestionTexts, setApprovedQuestionTexts] = useState<string[]>([]);

  const redirectPath = `/login?redirect_to=${encodeURIComponent(`/facility/${facilityId}`)}`;
  const trimmedLength = questionText.trim().length;
  const isValidLength = trimmedLength >= MIN_LEN && trimmedLength <= MAX_LEN;
  const pendingCount = ownQuestions.filter((q) => q.status === 'pending').length;
  const latestRejected = useMemo(
    () => ownQuestions.find((q) => q.status === 'rejected' && q.rejection_reason),
    [ownQuestions]
  );

  useEffect(() => {
    let mounted = true;
    const loadContext = async () => {
      try {
        const { data: approvedRows } = await supabase
          .from('approved_facility_qa')
          .select('question_text')
          .eq('facility_id', facilityId);

        if (mounted) {
          const uniqueTexts = Array.from(
            new Set((approvedRows || []).map((row: any) => String(row.question_text || '').trim()).filter(Boolean))
          );
          setApprovedQuestionTexts(uniqueTexts);
        }

        if (!user) return;

        const { data: ownRows } = await supabase
          .from('facility_questions')
          .select('id,status,rejection_reason')
          .eq('facility_id', facilityId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (mounted) {
          setOwnQuestions((ownRows || []) as OwnQuestion[]);
        }
      } catch {
        if (mounted) {
          setOwnQuestions([]);
          setApprovedQuestionTexts([]);
        }
      }
    };

    loadContext();
    return () => {
      mounted = false;
    };
  }, [facilityId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);
    setWarnings([]);
    setSubmitted(false);

    const rateCheck = checkQuestionRateLimit(user.id);
    if (!rateCheck.allowed) {
      setError(rateCheck.message);
      return;
    }

    const duplicateCheck = checkDuplicateText(questionText, approvedQuestionTexts);
    if (duplicateCheck.isDuplicate) {
      setError(duplicateCheck.message);
      return;
    }

    const sanitized = sanitizeInput(questionText);
    if (sanitized.blocked) {
      setError(sanitized.message);
      return;
    }

    if (sanitized.warnings.length > 0) {
      setWarnings(sanitized.warnings);
    }

    if (sanitized.sanitizedText.length < MIN_LEN || sanitized.sanitizedText.length > MAX_LEN) {
      setError(`Question must be between ${MIN_LEN} and ${MAX_LEN} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const { error: rpcError } = await supabase.rpc('submit_question', {
        p_facility_id: facilityId,
        p_question_text: sanitized.sanitizedText,
      });

      if (rpcError) throw rpcError;

      recordQuestionSubmission(user.id);
      trackEvent('question_submitted', { facilityId });
      setQuestionText('');
      setSubmitted(true);
      onSubmitted();

      const { data: ownRows } = await supabase
        .from('facility_questions')
        .select('id,status,rejection_reason')
        .eq('facility_id', facilityId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setOwnQuestions((ownRows || []) as OwnQuestion[]);
    } catch (submitErr: any) {
      setError(submitErr?.message || 'Unable to submit question right now.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-warm-gray bg-warm-white p-4">
        <p className="text-sm text-charcoal/70">
          Want to ask about {facilityName}?{' '}
          <Link to={redirectPath} className="font-semibold text-primary-700 hover:underline">
            Log in to ask a question
          </Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warm-gray bg-warm-white p-4">
      <h3 className="text-base font-semibold text-charcoal">Ask a question about this community</h3>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {submitted ? 'Your question has been submitted for review.' : ''}
      </p>
      <p id={formHintId} className="mt-1 text-sm text-charcoal/70">
        Questions are reviewed before they appear publicly.
      </p>
      <p className="mt-1 text-xs text-charcoal/60">
        By posting, you agree to our{' '}
        <Link to="/community-guidelines" className="underline underline-offset-2">
          Q&A Code of Conduct
        </Link>{' '}
        and acknowledge that "Verified Representative" badges are assigned to authenticated facility operators.
      </p>
      {pendingCount > 0 && (
        <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
          You currently have {pendingCount} question{pendingCount > 1 ? 's' : ''} pending review.
        </p>
      )}
      {latestRejected?.rejection_reason && (
        <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
          Last rejected question reason: {latestRejected.rejection_reason}
        </p>
      )}
      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        <label htmlFor="qa-question-text" className="sr-only">
          Ask a question
        </label>
        <textarea
          id="qa-question-text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={4}
          maxLength={MAX_LEN}
          placeholder="Example: How often are nurse-led wellness checks performed?"
          aria-invalid={Boolean(error)}
          aria-describedby={`${formHintId}${error ? ` ${formErrorId}` : ''}`}
          className="w-full rounded-md border border-warm-gray px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isValidLength ? 'text-charcoal/60' : 'text-amber-700'}`}>
            {trimmedLength}/{MAX_LEN} characters
          </span>
          <Button type="submit" variant="primary" size="sm" disabled={submitting || !isValidLength}>
            {submitting ? 'Submitting...' : 'Submit Question'}
          </Button>
        </div>
        {warnings.map((warning) => (
          <p key={warning} className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
            {warning}
          </p>
        ))}
        {error && (
          <p id={formErrorId} role="alert" className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1">
            {error}
          </p>
        )}
        {!error && warnings.length === 0 && submitted && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1">
            Your question has been submitted and will appear after review.
          </p>
        )}
      </form>
    </div>
  );
};
