import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/src/hooks/useGeolocation';

export const LocationPrompt: React.FC = () => {
  const { getLocation, coordinates, loading } = useGeolocation();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissedValue = localStorage.getItem('geo_prompt_dismissed');
    const status = localStorage.getItem('geo_status');
    const hasCoords = !!localStorage.getItem('geo_coords');
    setDismissed(dismissedValue === '1' || status === 'denied' || hasCoords);
  }, []);

  if (dismissed || coordinates) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#f6f1ea] flex items-center justify-center">
            <MapPin className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Enable location?</h3>
            <p className="text-sm text-slate-500">See nearby senior living options faster.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Button
            variant="primary"
            className="w-full bg-slate-900 hover:bg-slate-800"
            onClick={() => getLocation()}
            disabled={loading}
          >
            {loading ? 'Requesting...' : 'Enable Location'}
          </Button>
          <Button
            variant="outline"
            className="w-full border-slate-300 hover:bg-slate-100"
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('geo_prompt_dismissed', '1');
              }
              setDismissed(true);
            }}
          >
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
};
