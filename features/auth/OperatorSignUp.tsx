import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';

const OperatorSignUp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formErrorId = 'operator-signup-form-error';
  const passwordHintId = 'operator-signup-password-hint';
  const redirectToParam = searchParams.get('redirect_to') || '/dashboard';
  const redirectTo = redirectToParam.startsWith('/') ? redirectToParam : '/dashboard';
  const loginPath = `/operator/login?redirect_to=${encodeURIComponent(redirectTo)}`;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'operator',
          },
        },
      });

      if (signUpError) throw signUpError;

      alert('Operator account created. Please check your email to verify your account.');
      navigate(loginPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create operator account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Operator Sign Up | SilverTech Directory</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://silvertechdirectory.com/operator/signup" />
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create operator account
        </h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an operator account?{' '}
          <Link to={loginPath} className="font-medium text-primary-600 hover:text-primary-500">
            Sign in
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
                Work email
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
                  placeholder="admin@facility.com"
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
                  placeholder="At least 6 characters"
                />
                <p id={passwordHintId} className="mt-1 text-xs text-slate-500">
                  Must be at least 6 characters
                </p>
              </div>
            </div>

            <div>
              <Button type="submit" variant="primary" className="w-full flex justify-center py-2 px-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating account...
                  </>
                ) : (
                  'Create operator account'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OperatorSignUp;
