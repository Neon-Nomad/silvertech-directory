import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/src/context/AuthProvider';

export const ClaimBusiness: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const loginPath = `/operator/login?redirect_to=${encodeURIComponent('/claim-business')}`;
  const signUpPath = `/operator/signup?redirect_to=${encodeURIComponent('/claim-business')}`;

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Claim Your Business Profile
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-slate-500">
            Take control of your facility's presence on SilverTech Directory. Update your information, respond to reviews, and reach more families.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Manage Your Info</h3>
            <p className="text-slate-500">
              Keep your facility details, pricing, and availability up to date to attract the right residents.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Verify Your Status</h3>
            <p className="text-slate-500">
              Get the "Verified Partner" badge to build trust with families looking for care.
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">Connect with Families</h3>
            <p className="text-slate-500">
              Receive inquiries directly and schedule tours with interested families.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link to={signUpPath}>
            <Button size="lg" className="px-8 py-3 text-lg">
              Create Operator Account
            </Button>
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to={loginPath} className="text-primary-600 hover:text-primary-500 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
