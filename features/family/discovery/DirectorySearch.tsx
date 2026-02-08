import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const findStateByInput = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  return (
    ALL_STATES.find((s) => s.abbreviation.toLowerCase() === normalized) ||
    ALL_STATES.find((s) => s.name.toLowerCase() === normalized) ||
    ALL_STATES.find((s) => s.slug === normalized)
  );
};

const DirectorySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [stateSlug, setStateSlug] = useState('');
  const [error, setError] = useState('');

  const stateOptions = useMemo(
    () => ALL_STATES.map((s) => ({ label: s.name, value: s.slug, abbr: s.abbreviation })),
    []
  );

  const handleSearch = () => {
    setError('');
    const rawLocation = location.trim();

    let resolvedStateSlug = stateSlug;
    let city = rawLocation;

    if (!resolvedStateSlug && rawLocation.includes(',')) {
      const [cityPart, statePart] = rawLocation.split(',').map((part) => part.trim());
      const stateMatch = findStateByInput(statePart);
      if (stateMatch) {
        resolvedStateSlug = stateMatch.slug;
        city = cityPart;
      }
    }

    if (!resolvedStateSlug) {
      setError('Please select a state or type a city followed by a state (e.g., "Muncie, IN").');
      return;
    }

    if (city) {
      const citySlug = toSlug(city);
      navigate(`/assisted-living/${resolvedStateSlug}/cities/${citySlug}`);
      return;
    }

    navigate(`/assisted-living/${resolvedStateSlug}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-primary-600 to-secondary-500 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Search Senior Living by City or State</h1>
          <p className="text-lg text-white/90 mb-8">
            Choose a state or type a city (e.g., “Muncie, IN”) to see every licensed facility.
          </p>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                <select
                  value={stateSlug}
                  onChange={(e) => setStateSlug(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select a state</option>
                  {stateOptions.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-slate-700 mb-2">City (optional)</label>
                <MapPin className="absolute left-3 top-11 transform text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Muncie, IN"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                className="self-end bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap"
                onClick={handleSearch}
              >
                <span className="inline-flex items-center gap-2">
                  <Search size={18} />
                  Search
                </span>
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Browse all states</h2>
          <p className="text-slate-600 mb-4">
            Prefer to explore? You can jump straight to the full state directory.
          </p>
          <button
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-md font-medium transition-colors"
            onClick={() => navigate('/states')}
          >
            View all states
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectorySearch;
