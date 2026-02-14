import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { useLeadTracking } from '@/src/hooks/useLeadTracking';

interface NoResultsProps {
  requestedLocation: string;
}

export const NoResults: React.FC<NoResultsProps> = ({ requestedLocation }) => {
  const { user } = useAuth();
  const { getSessionId } = useLeadTracking();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    careType: 'Assisted Living',
    budget: 'Under $4,000/mo',
    message: '',
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('leads').insert({
        facility_id: null,
        user_id: user?.id || null,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message || `No-results request for ${requestedLocation}`,
        source: 'no_results',
        care_type: formData.careType,
        budget: formData.budget,
        requested_location: requestedLocation,
        session_id: getSessionId(),
        metadata: {
          capture_type: 'no_results',
          requested_location: requestedLocation,
        },
      });

      if (insertError) throw insertError;
      setSubmitted(true);
    } catch (submitError: any) {
      console.error('No-results capture failed:', submitError);
      setError(submitError?.message || 'Unable to submit request right now.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-4 text-sm text-charcoal">
        Thanks. We logged your request for {requestedLocation || 'this area'} and will prioritize recruitment for referral-free options.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warm-gray bg-warm-white p-5">
      <p className="text-sm text-charcoal/80">
        We have not verified a referral-free community in <span className="font-semibold">{requestedLocation || 'this area'}</span> yet.
        Tell us what you need and we will recruit them without commission pressure.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
            placeholder="Your name"
          />
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
            placeholder="Email"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
            placeholder="Phone"
          />
          <select
            value={formData.careType}
            onChange={(e) => setFormData((prev) => ({ ...prev, careType: e.target.value }))}
            className="w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
          >
            <option>Assisted Living</option>
            <option>Memory Care</option>
            <option>Skilled Nursing</option>
            <option>Unsure</option>
          </select>
          <select
            value={formData.budget}
            onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
            className="w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
          >
            <option>Under $4,000/mo</option>
            <option>$4,000-$6,000/mo</option>
            <option>$6,000-$8,000/mo</option>
            <option>$8,000+/mo</option>
          </select>
        </div>
        <textarea
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
          className="w-full rounded-md border border-warm-gray bg-white px-3 py-2 text-sm"
          placeholder="Anything else we should know?"
        />
        {error && (
          <p className="text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-70"
        >
          {loading ? 'Submitting...' : 'Notify Me + Recruit Local Options'}
        </button>
      </form>
    </div>
  );
};
