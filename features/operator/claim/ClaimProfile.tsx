import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const ClaimProfile: React.FC = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    // Simulate code verification
    const timer = setTimeout(() => {
      setLoading(false);
      if (code) {
        setValid(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [code]);

  const handleClaim = () => {
    // Simulate claim success and redirect to dashboard
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Verifying Award Badge...</h2>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Badge Code</h2>
          <p className="text-slate-600 mb-6">
            The code you entered seems to be invalid or expired. Please check your email for the correct link.
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="w-full">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <ShieldCheck className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Congratulations!</h1>
        <p className="text-xl text-slate-600 mb-8">
          You've unlocked the <span className="font-bold text-primary-600">2024 Price Transparency Award</span>.
        </p>

        <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left border border-slate-200">
          <h3 className="font-bold text-slate-900 mb-2">What this means:</h3>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Your facility is now highlighted as a "Verified Partner" to thousands of families.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>You have exclusive access to the SilverTech Operator Dashboard.</span>
            </li>
          </ul>
        </div>

        <Button onClick={handleClaim} variant="primary" size="lg" className="w-full text-lg group">
          Claim Your Profile <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
        <p className="text-xs text-slate-400 mt-4">
          By claiming this profile, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  );
};
