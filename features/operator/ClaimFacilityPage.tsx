import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { isOperatorUser } from '@/src/utils/authRole';
import { trackActivationEvent } from '@/src/config/activationEvents';
import { getActivationSessionId } from '@/src/utils/activationSession';

export const ClaimFacilityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const formErrorId = 'claim-facility-error';
  const businessEmailHintId = 'claim-business-email-hint';
  
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    businessEmail: '',
    phone: '',
    role: '',
    notes: ''
  });

  useEffect(() => {
    if (!user) {
        const returnPath = id ? `/claim/${id}` : '/claim-business';
        navigate(`/operator/login?redirect_to=${encodeURIComponent(returnPath)}`);
        return;
    }

    if (!isOperatorUser(user)) {
      setError('This account is a family account. Please sign in with an operator account to claim a facility profile.');
      setLoading(false);
      return;
    }

    const fetchFacility = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name, address_line1, city, state, owner_id')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data.owner_id) {
            setError("This facility has already been claimed.");
        }
        
        setFacility(data);
      } catch (err) {
        console.error('Error fetching facility:', err);
        setError('Facility not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !facility) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('facility_claims')
        .insert({
          facility_id: facility.id,
          user_id: user.id,
          business_email: formData.businessEmail,
          phone: formData.phone,
          status: 'pending',
          verification_doc_url: formData.notes // Using this for notes for now
        });

      if (error) throw error;
      trackActivationEvent(
        'operator_claim_completed',
        {
          operator_id: user.id,
          facility_id: facility.id,
          session_id: getActivationSessionId(),
          plan_tier: 'unknown',
          activation_score: 0,
          source_screen: 'claim_facility',
        },
        { claim_status: 'pending' },
      );
      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting claim:', err);
      setError(err.message || 'Failed to submit claim.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Claim Submitted!</h2>
          <p className="text-slate-600 mb-6">
            We have received your request to claim <strong>{facility?.name}</strong>. 
            Our team will review your information and verify your identity within 24-48 hours.
          </p>
          <p className="text-sm text-slate-500 mb-4">
            You can continue setting up your operator account while this claim is under review.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="w-full min-h-11" onClick={() => navigate('/dashboard/listings?onboarding=claim')}>
              Go To Dashboard
            </Button>
            <Button variant="outline" className="w-full min-h-11" onClick={() => navigate('/search?claim=1')}>
              Claim Another Listing
            </Button>
          </div>
          <button
            type="button"
            className="mt-4 text-sm text-charcoal/70 hover:text-charcoal underline"
            onClick={() => navigate('/')}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">Claim Your Business</h1>
          <p className="mt-2 text-slate-600">
            Take control of your profile on SilverTech Directory
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <Building2 className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{facility?.name}</h2>
              <p className="text-sm text-slate-500">{facility?.address_line1}, {facility?.city}, {facility?.state}</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div
                id={formErrorId}
                role="alert"
                aria-live="assertive"
                className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="h-5 w-5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="business-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Business Email
                </label>
                <input
                  id="business-email"
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="name@facility.com"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({...formData, businessEmail: e.target.value})}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? `${businessEmailHintId} ${formErrorId}` : businessEmailHintId}
                />
                <p id={businessEmailHintId} className="mt-1 text-xs text-slate-500">Please use an email address associated with the facility.</p>
              </div>

              <div>
                <label htmlFor="business-phone" className="block text-sm font-medium text-slate-700 mb-1">
                  Business Phone
                </label>
                <input
                  id="business-phone"
                  type="tel"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? formErrorId : undefined}
                />
              </div>

              <div>
                <label htmlFor="business-role" className="block text-sm font-medium text-slate-700 mb-1">
                  Your Role
                </label>
                <select
                  id="business-role"
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? formErrorId : undefined}
                >
                  <option value="">Select your role...</option>
                  <option value="Owner">Owner</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Marketing Director">Marketing Director</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="verification-notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Additional Verification Notes
                </label>
                <textarea
                  id="verification-notes"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 h-24"
                  placeholder="Please provide any details that help us verify your identity (e.g. license number, website URL)..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? formErrorId : undefined}
                />
              </div>

              <div className="pt-4">
                <Button 
                  variant="primary" 
                  type="submit" 
                  className="w-full py-3 text-lg"
                  disabled={submitting || !!facility?.owner_id}
                >
                  {submitting ? 'Submitting...' : 'Submit Claim Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
