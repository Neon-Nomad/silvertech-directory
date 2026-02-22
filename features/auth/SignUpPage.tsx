import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Loader2 } from 'lucide-react';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formErrorId = 'signup-form-error';
  const passwordHintId = 'signup-password-hint';
  const redirectToParam = searchParams.get('redirect_to') || '/';
  const redirectTo = redirectToParam.startsWith('/') ? redirectToParam : '/';
  const loginPath = redirectTo !== '/' ? `/login?redirect_to=${encodeURIComponent(redirectTo)}` : '/login';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      const createdUser = data.user;
      if (!createdUser) {
        throw new Error('Unable to create account right now. Please try again.');
      }

      const hasIdentity = !Array.isArray(createdUser.identities) || createdUser.identities.length > 0;
      if (!hasIdentity) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      const { error: functionError } = await supabase.functions.invoke('send-registration-email', {
        body: { email },
      });

      if (functionError) {
        console.error('Failed to send registration email:', functionError);
        // We can still proceed, but we should log this error
      }


      const needsEmailConfirmation = !data.session && !createdUser.email_confirmed_at;
      alert(
        needsEmailConfirmation
          ? 'Account created. Please confirm your email via the Supabase verification email before signing in.'
          : 'Account created. You can now sign in.',
      );
      navigate(loginPath, { replace: true });
    } catch (err: any) {
      const message = String(err?.message || 'Failed to sign up');
      if (message.toLowerCase().includes('email not confirmed')) {
        setError('Your account exists but email confirmation is still pending. Please confirm your email first.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Sign Up | SilverTech Directory</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://silvertechdirectory.com/signup" />
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link to={loginPath} className="font-medium text-primary-600 hover:text-primary-500">
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div
                id={formErrorId}
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3"
              >
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? formErrorId : undefined}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${passwordHintId} ${formErrorId}` : passwordHintId}
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <p id={passwordHintId} className="mt-1 text-xs text-slate-500">Must be at least 6 characters</p>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full flex justify-center py-2 px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating account...
                  </>
                ) : (
                  'Sign up'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
