import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formErrorId = 'login-form-error';
  const redirectToParam = searchParams.get('redirect_to') || '/';
  const redirectTo = redirectToParam.startsWith('/') ? redirectToParam : '/';
  const signUpPath = redirectTo !== '/' ? `/signup?redirect_to=${encodeURIComponent(redirectTo)}` : '/signup';
  const operatorLoginPath = `/operator/login?redirect_to=${encodeURIComponent(redirectTo)}`;
  const operatorIntent =
    redirectTo === '/claim-business' || redirectTo.startsWith('/claim/') || redirectTo.startsWith('/dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operatorIntent) return;
    navigate(operatorLoginPath, { replace: true });
  }, [navigate, operatorIntent, operatorLoginPath]);

  if (operatorIntent) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const message = String(err?.message || 'Failed to sign in');
      if (message.toLowerCase().includes('email not confirmed')) {
        setError('Your account exists but email confirmation is pending. Please confirm your email first.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Sign In | SilverTech Directory</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://silvertechdirectory.com/login" />
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-charcoal">
          Family Sign In
        </h1>
        <p className="mt-2 text-center text-sm text-charcoal/70">
          New to SilverTech?{' '}
          <Link to={signUpPath} className="font-medium text-primary-600 hover:text-primary-500">
            Create an account
          </Link>
        </p>
        <p className="mt-1 text-center text-sm text-charcoal/70">
          Are you a facility operator?{' '}
          <Link to={operatorLoginPath} className="font-medium text-primary-600 hover:text-primary-500">
            Facility sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
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
              <label htmlFor="email" className="block text-sm font-medium text-charcoal">
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
                  className="appearance-none block w-full px-3 py-2 border border-warm-gray rounded-md shadow-sm placeholder-charcoal/40 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? formErrorId : undefined}
                  className="appearance-none block w-full px-3 py-2 border border-warm-gray rounded-md shadow-sm placeholder-charcoal/40 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
