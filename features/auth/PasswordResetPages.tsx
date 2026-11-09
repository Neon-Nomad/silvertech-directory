import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Loader2 } from 'lucide-react';
import { authRedirectHash, supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/Button';

const MIN_PASSWORD_LENGTH = 8;

const RESET_PAGE_ROBOTS = <meta name="robots" content="noindex, nofollow" />;

// True when the access token came from a password-recovery link.
export const isRecoveryToken = (accessToken: string): boolean => {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Array.isArray(payload.amr) && payload.amr.some((entry: { method?: string }) => entry?.method === 'recovery');
  } catch {
    return false;
  }
};

const readHashParams = (hash: string) => new URLSearchParams(hash.replace(/^#/, ''));

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        const code = (resetError as { code?: string }).code;
        if (code === 'over_email_send_rate_limit') {
          setError('Please wait a minute before requesting another link.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        return;
      }
      // The same message whether or not an account exists, so the form does not reveal who has one.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Reset your password | SilverTech Directory</title>
        {RESET_PAGE_ROBOTS}
      </Helmet>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-charcoal">Reset your password</h1>
        <p className="mt-2 text-center text-sm text-charcoal/70">
          Enter the email address for your family account and we will send a link to choose a new password.
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {sent ? (
            <div role="status" className="space-y-4">
              <p className="text-sm text-charcoal">
                If an account exists for that email, we have sent a link to reset your password. The link works once and expires after a short time.
              </p>
              <p className="text-sm">
                <Link to="/login" className="font-medium text-primary-700 hover:text-primary-800">
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-charcoal">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-warm-gray rounded-md shadow-sm placeholder-charcoal/40 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full flex justify-center py-2 px-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
              <p className="text-center text-sm">
                <Link to="/login" className="font-medium text-primary-700 hover:text-primary-800">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

type ResetState = 'checking' | 'ready' | 'invalid' | 'expired';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<ResetState>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = readHashParams(authRedirectHash);
    // Supabase reports an expired, invalid, or already used link in the hash. A used link is rejected the same way.
    if (params.get('error') || params.get('error_code')) {
      setState(params.get('error_code') === 'otp_expired' ? 'expired' : 'invalid');
      return;
    }

    let active = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === 'PASSWORD_RECOVERY') setState('ready');
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const session = data.session;
      const fromRecoveryLink = params.get('type') === 'recovery';
      if (session && (fromRecoveryLink || isRecoveryToken(session.access_token))) {
        setState('ready');
      } else if (!session) {
        setState('invalid');
      } else {
        // Signed in normally, not through a reset link. Do not let a signed-in visitor change the password here.
        setState('invalid');
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        const code = (updateError as { code?: string }).code;
        if (code === 'same_password') {
          setError('Choose a password you have not used before.');
        } else if (code === 'weak_password') {
          setError(updateError.message || 'That password is too weak. Try a longer one.');
        } else {
          setError('We could not update your password. Request a new link and try again.');
        }
        return;
      }
      // End the recovery session, so the next step is signing in with the new password.
      await supabase.auth.signOut();
      navigate('/login?reset=updated', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Choose a new password | SilverTech Directory</title>
        {RESET_PAGE_ROBOTS}
      </Helmet>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-charcoal">Choose a new password</h1>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {state === 'checking' && <p className="text-sm text-charcoal/70">Checking your link...</p>}

          {(state === 'expired' || state === 'invalid') && (
            <div role="alert" className="space-y-4">
              <p className="text-sm text-charcoal">
                {state === 'expired'
                  ? 'This reset link has expired or has already been used.'
                  : 'This reset link is not valid. Open the most recent link from your email.'}
              </p>
              <p className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-700 hover:text-primary-800">
                  Request a new link
                </Link>
              </p>
            </div>
          )}

          {state === 'ready' && (
            <form className="space-y-6" onSubmit={onSubmit}>
              {error && (
                <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-charcoal">
                  New password
                </label>
                <p id="new-password-hint" className="mt-1 text-xs text-charcoal/60">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
                <div className="mt-1">
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    aria-describedby="new-password-hint"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-warm-gray rounded-md shadow-sm placeholder-charcoal/40 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-charcoal">
                  Confirm new password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-warm-gray rounded-md shadow-sm placeholder-charcoal/40 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              <Button type="submit" variant="primary" className="w-full flex justify-center py-2 px-4" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  'Save new password'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
