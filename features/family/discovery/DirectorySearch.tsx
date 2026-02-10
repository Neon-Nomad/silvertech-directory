import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';
import zipToCity from '@/src/data/zip_to_city.json';
import { getLocationSuggestions, LocationSuggestion } from '@/src/utils/locationSuggestions';

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
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const stateOptions = useMemo(
    () => ALL_STATES.map((s) => ({ label: s.name, value: s.slug, abbr: s.abbreviation })),
    []
  );

  const handleSearch = () => {
    setError('');
    const rawLocation = location.trim();
    const zipMatch = /^\d{5}$/.test(rawLocation) ? rawLocation : '';

    let resolvedStateSlug = stateSlug;
    let city = rawLocation;

    if (zipMatch) {
      const zipEntry = (zipToCity as Record<string, { city: string; state: string }>)[zipMatch];
      if (!zipEntry) {
        setError('We could not find that ZIP code yet. Try a nearby city or select a state.');
        return;
      }
      const zipState = findStateByInput(zipEntry.state);
      if (!zipState) {
        setError('We could not match that ZIP code to a state. Try a city instead.');
        return;
      }
      resolvedStateSlug = zipState.slug;
      city = zipEntry.city;
    }
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

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    if (suggestion.type === 'city') {
      setLocation(`${suggestion.city}, ${suggestion.state}`);
      const stateMatch = findStateByInput(suggestion.state);
      if (stateMatch) setStateSlug(stateMatch.slug);
    }
    if (suggestion.type === 'zip') {
      setLocation(suggestion.zip);
      const stateMatch = findStateByInput(suggestion.state);
      if (stateMatch) setStateSlug(stateMatch.slug);
    }
    if (suggestion.type === 'state') {
      setLocation('');
      setStateSlug(suggestion.stateSlug);
    }
    setShowSuggestions(false);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.trim().length > 0) {
      setSuggestions(getLocationSuggestions(value));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f1ea]">
      <div className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Search Senior Living by City or State</h1>
          <p className="text-lg text-slate-600 mb-8">
            Choose a state or type a city or ZIP code (e.g., “Muncie, IN” or “47302”) to see every
            licensed facility.
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-slate-200">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">State</label>
                <select
                  value={stateSlug}
                  onChange={(e) => setStateSlug(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[#f6f1ea]"
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
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  City or ZIP (optional)
                </label>
                <MapPin className="absolute left-3 top-11 transform text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Muncie, IN or 47302"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => location.trim() && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[#f6f1ea]"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg text-left">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.label}-${index}`}
                        className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                        onMouseDown={() => handleSuggestionSelect(suggestion)}
                      >
                        <span>{suggestion.label}</span>
                        <span className="text-xs text-slate-400 uppercase">
                          {suggestion.type === 'zip' ? 'ZIP' : suggestion.type === 'state' ? 'State' : 'City'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="self-end bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap"
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
        <div className="bg-white rounded-2xl shadow p-6 border border-slate-200">
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
