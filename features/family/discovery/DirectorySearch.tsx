import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';
import zipToCity from '@/src/data/zip_to_city.json';
import { getLocationSuggestions, LocationSuggestion } from '@/src/utils/locationSuggestions';
import { supabase } from '@/src/lib/supabase';
import { loadFacilityIndex, FacilityIndexItem } from '@/src/utils/facilityIndex';
import { hasTypesense, typesenseClient } from '@/src/lib/typesense';

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
  const { state: routeState } = useParams();
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [nameQuery, setNameQuery] = useState(searchParams.get('name') || '');
  const [stateSlug, setStateSlug] = useState(routeState || searchParams.get('state') || '');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<FacilityIndexItem[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);

  const stateOptions = useMemo(
    () => ALL_STATES.map((s) => ({ label: s.name, value: s.slug, abbr: s.abbreviation })),
    []
  );

  const handleSearch = async () => {
    setError('');
    setResultsError('');
    const rawLocation = location.trim();
    const rawName = nameQuery.trim();
    const zipMatch = /^\d{5}$/.test(rawLocation) ? rawLocation : '';
    const zipEntry = zipMatch
      ? (zipToCity as Record<string, { city: string; state: string }>)[zipMatch]
      : null;

    let resolvedStateSlug = stateSlug || routeState || '';
    let city = rawLocation;
    let stateAbbr = '';

    if (zipMatch) {
      const zipState = zipEntry ? findStateByInput(zipEntry.state) : null;
      if (zipState) resolvedStateSlug = zipState.slug;
    }
    if (rawLocation.includes(',')) {
      const [cityPart, statePart] = rawLocation.split(',').map((part) => part.trim());
      if (cityPart) city = cityPart;
      const stateMatch = findStateByInput(statePart);
      if (stateMatch && (!resolvedStateSlug || resolvedStateSlug !== stateMatch.slug)) {
        resolvedStateSlug = stateMatch.slug;
      }
    }

    if (!resolvedStateSlug && !rawName) {
      setError('Please select a state or type a city followed by a state (e.g., "Muncie, IN").');
      return;
    }

    if (resolvedStateSlug) {
      const stateMatch = ALL_STATES.find((s) => s.slug === resolvedStateSlug);
      stateAbbr = stateMatch?.abbreviation || '';
    }

    const nextParams = new URLSearchParams();
    if (rawLocation) nextParams.set('location', rawLocation);
    if (rawName) nextParams.set('name', rawName);
    if (resolvedStateSlug) nextParams.set('state', resolvedStateSlug);
    navigate(`/search?${nextParams.toString()}`);

      const performSearch = async (filters: { city?: string; state?: string; zip?: string }) => {
      if (hasTypesense && typesenseClient) {
        const searchParams: any = {
          q: rawName || '*',
          query_by: 'name,city,state,postal_code',
          query_by_weights: '8,3,2,2',
          sort_by: 'premium_tier:desc,_text_match:desc',
          per_page: 50
        };
        const filterParts: string[] = [];
        if (filters.state) filterParts.push(`state:=${filters.state}`);
        if (filters.city) filterParts.push(`city:=${filters.city}`);
        if (filters.zip) filterParts.push(`postal_code:=${filters.zip}`);
        if (filterParts.length > 0) searchParams.filter_by = filterParts.join(' && ');

        const searchResult: any = await typesenseClient
          .collections('facilities')
          .documents()
          .search(searchParams);
        const hits = (searchResult?.hits || []).map((hit: any) => hit.document) as FacilityIndexItem[];
        if (hits.length === 0 && filters.state && !filters.city && !filters.zip && !rawName) {
          throw new Error('Typesense returned 0 for state-only search.');
        }
        return hits;
      }

      try {
        const { data, error } = await supabase
          .rpc('search_facilities', {
            query_text: rawName || null,
            state_filter: filters.state || null,
            city_filter: filters.city || null,
            postal_filter: filters.zip || null,
            limit_count: 50,
            offset_count: 0
          });
        if (error) throw error;
        return (data as FacilityIndexItem[]) || [];
      } catch (err: any) {
        const message = err?.message || '';
        if (!message.includes('Could not find the function')) throw err;

        let query = supabase
          .from('facilities')
          .select('id,name,city,state,address_line1,postal_code,phone,website_url')
          .order('name', { ascending: true });

        if (filters.state) query = query.eq('state', filters.state);
        if (filters.city) query = query.ilike('city', filters.city);
        if (filters.zip) query = query.eq('postal_code', filters.zip);
        if (rawName) query = query.ilike('name', `%${rawName}%`);

        const { data, error } = await query.limit(50);
        if (error) throw error;
        setResultsError('Search RPC not ready yet. Using direct database search.');
        return (data as FacilityIndexItem[]) || [];
      }
    };

    const performOfflineSearch = async (filters: { city?: string; state?: string; zip?: string }) => {
      const index = await loadFacilityIndex();
      let filtered = index;
      if (filters.state) {
        filtered = filtered.filter((f) => f.state?.toLowerCase() === filters.state?.toLowerCase());
      }
      if (filters.city) {
        filtered = filtered.filter((f) => (f.city || '').trim().toLowerCase() === filters.city?.toLowerCase());
      }
      if (filters.zip) {
        filtered = filtered.filter((f) => (f.postal_code || '').trim() === filters.zip);
      }
      if (rawName) {
        const needle = rawName.toLowerCase();
        filtered = filtered.filter((f) => (f.name || '').toLowerCase().includes(needle));
      }
      setResultsError('Live search is unavailable. Showing offline results.');
      return filtered.slice(0, 50);
    };

    setResultsLoading(true);
    try {
      const primaryFilters = {
        state: stateAbbr || undefined,
        city: zipMatch ? undefined : city || undefined,
        zip: zipMatch || undefined
      };
      let hits = await performSearch(primaryFilters);

      if (zipMatch && hits.length === 0 && zipEntry?.city && zipEntry?.state) {
        const zipState = findStateByInput(zipEntry.state);
        const fallbackFilters = {
          state: zipState?.abbreviation,
          city: zipEntry.city
        };
        hits = await performSearch(fallbackFilters);
        if (hits.length > 0) {
          setResultsError('No direct ZIP results. Showing the closest city matches instead.');
        }
      }

      if (zipMatch && hits.length === 0) {
        const zipState = zipEntry ? findStateByInput(zipEntry.state) : null;
        const stateOnly = zipState?.abbreviation || stateAbbr;
        if (stateOnly) {
          hits = await performSearch({ state: stateOnly });
          if (hits.length > 0) {
            setResultsError('No ZIP or city matches. Showing statewide results instead.');
          }
        }
      }

      setResults(hits);
    } catch (err) {
      try {
        const offlineFilters = {
          state: stateAbbr || (zipEntry ? findStateByInput(zipEntry.state)?.abbreviation : undefined),
          city: zipMatch ? zipEntry?.city : city,
          zip: zipMatch || undefined
        };
        let offlineHits = await performOfflineSearch(offlineFilters);
        if (zipMatch && offlineHits.length === 0) {
          const stateOnly = offlineFilters.state;
          if (stateOnly) {
            offlineHits = await performOfflineSearch({ state: stateOnly });
            if (offlineHits.length > 0) {
              setResultsError('No ZIP or city matches. Showing statewide results instead.');
            }
          }
        }
        setResults(offlineHits);
      } catch (fallbackError) {
        console.error('Search failed:', fallbackError);
        setResultsError('Search failed. Please try again in a moment.');
      }
    } finally {
      setResultsLoading(false);
    }
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

  useEffect(() => {
    if (routeState && stateSlug !== routeState) {
      setStateSlug(routeState);
      setLocation('');
      setNameQuery('');
    }
  }, [routeState, stateSlug]);

  useEffect(() => {
    if (hasAutoSearched) return;
    if (routeState || location.trim().length > 0 || nameQuery.trim().length > 0) {
      setHasAutoSearched(true);
      handleSearch();
    }
  }, [routeState, location, nameQuery, hasAutoSearched]);

  return (
    <div className="min-h-screen bg-warm-gray">
      <div className="py-16 bg-white border-b border-warm-gray">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-4">Search Senior Living by City or State</h1>
          <p className="text-lg text-charcoal/70 mb-8">
            Choose a state or type a city or ZIP code (e.g., “Muncie, IN” or “47302”) to see every
            licensed facility.
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-warm-gray">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal mb-2">State</label>
                <select
                  value={stateSlug}
                  onChange={(e) => setStateSlug(e.target.value)}
                  className="w-full border border-warm-gray rounded-md px-3 py-3 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-warm-gray"
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
                <label className="block text-sm font-medium text-charcoal mb-2">
                  City or ZIP (optional)
                </label>
                <MapPin className="absolute left-3 top-11 transform text-charcoal/40" size={20} />
                <input
                  type="text"
                  placeholder="Muncie, IN or 47302"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => location.trim() && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  className="w-full pl-10 pr-4 py-3 border border-warm-gray rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-warm-gray"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-warm-gray rounded-xl shadow-lg text-left">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.label}-${index}`}
                        className="w-full px-4 py-2 text-sm text-charcoal hover:bg-warm-gray flex items-center justify-between"
                        onMouseDown={() => handleSuggestionSelect(suggestion)}
                      >
                        <span>{suggestion.label}</span>
                        <span className="text-xs text-charcoal/40 uppercase">
                          {suggestion.type === 'zip' ? 'ZIP' : suggestion.type === 'state' ? 'State' : 'City'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="self-end bg-charcoal hover:bg-black text-white px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap"
                onClick={handleSearch}
              >
                <span className="inline-flex items-center gap-2">
                  <Search size={18} />
                  Search
                </span>
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-2">Facility name (optional)</label>
              <input
                type="text"
                placeholder="e.g., Sunrise of San Francisco"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                className="w-full px-4 py-3 border border-warm-gray rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-warm-gray"
              />
            </div>
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow p-6 border border-warm-gray">
          <h2 className="text-xl font-bold text-charcoal mb-2">Search results</h2>
          <p className="text-charcoal/70 mb-6">
            {resultsLoading ? 'Searching facilities...' : 'Showing the best matches based on your search.'}
          </p>
          {resultsError && (
            <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              {resultsError}
            </div>
          )}
          {resultsLoading ? (
            <div className="text-sm text-charcoal/60">Loading results...</div>
          ) : results.length === 0 ? (
            <div className="text-sm text-charcoal/60">
              No facilities found yet. Try a nearby city or search by facility name.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((facility) => (
                <div key={facility.id} className="border border-warm-gray rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-charcoal">{facility.name}</p>
                    <p className="text-sm text-charcoal/60">
                      {facility.address_line1 ? `${facility.address_line1}, ` : ''}
                      {facility.city}, {facility.state} {facility.postal_code || ''}
                    </p>
                    {facility.phone && (
                      <p className="text-sm text-charcoal/60">{facility.phone}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
                      {facility.website_url ? (
                        <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1">
                          Verified community
                        </span>
                      ) : (
                        <span className="rounded-full bg-warm-gray text-charcoal/60 border border-warm-gray px-2 py-1">
                          Website unavailable
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="bg-charcoal text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black"
                    onClick={() => navigate(`/facility/${facility.id}`)}
                  >
                    View details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow p-6 border border-warm-gray">
          <h2 className="text-xl font-bold text-charcoal mb-2">Browse all states</h2>
          <p className="text-charcoal/70 mb-4">
            Prefer to explore? You can jump straight to the full state directory.
          </p>
          <button
            className="bg-charcoal hover:bg-black text-white px-6 py-3 rounded-md font-medium transition-colors"
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
