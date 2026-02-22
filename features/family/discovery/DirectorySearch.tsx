import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Search, MapPin, LocateFixed } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';
import zipToCity from '@/src/data/zip_to_city.json';
import { getLocationSuggestions, LocationSuggestion } from '@/src/utils/locationSuggestions';
import { supabase } from '@/src/lib/supabase';
import { loadFacilityIndexWithOptions, FacilityIndexItem } from '@/src/utils/facilityIndex';
import { hasTypesense, typesenseClient } from '@/src/lib/typesense';
import { trackEvent } from '@/src/utils/analytics';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { NoResults } from '@/features/family/discovery/NoResults';
import { useGeolocation } from '@/src/hooks/useGeolocation';

type SearchFacilityResult = FacilityIndexItem & {
  owner_id?: string | null;
  listing_tier?: string;
  waiting_question_count?: number;
  latitude?: number | null;
  longitude?: number | null;
  distance_miles?: number;
};

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

const toRadians = (value: number) => (value * Math.PI) / 180;
const milesBetween = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
};

type ReverseGeocodeResult = {
  zip?: string;
  city?: string;
  state?: string;
};

const reverseGeocodeToLocation = async (
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult | null> => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    addressdetails: '1',
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();
    const address = data?.address || {};

    const rawZip = String(address.postcode || '').trim();
    const zip = rawZip.match(/\d{5}/)?.[0];

    const city = String(
      address.city || address.town || address.village || address.hamlet || address.county || ''
    ).trim();

    const stateCode = String(address.state_code || '').trim();
    const stateFromCode = stateCode.includes('-') ? stateCode.split('-')[1] : stateCode;
    const state = (stateFromCode || String(address.state || '')).trim();

    return { zip, city, state };
  } catch {
    return null;
  }
};

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

const STATE_SEARCH_EXAMPLES: Record<string, { cityState: string; zip: string }> = {
  CA: { cityState: 'Los Angeles, CA', zip: '90001' },
  FL: { cityState: 'Orlando, FL', zip: '32801' },
  TX: { cityState: 'Austin, TX', zip: '78701' },
  NY: { cityState: 'Buffalo, NY', zip: '14201' },
  IN: { cityState: 'Muncie, IN', zip: '47302' },
};

const DirectorySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state: routeState } = useParams();
  const claimMode = searchParams.get('claim') === '1';
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [nameQuery, setNameQuery] = useState(searchParams.get('name') || '');
  const [stateSlug, setStateSlug] = useState(routeState || searchParams.get('state') || '');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<SearchFacilityResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [geoLookupError, setGeoLookupError] = useState('');
  const [geoFallbackCity, setGeoFallbackCity] = useState('');
  const [geoLookupLoading, setGeoLookupLoading] = useState(false);
  const { coordinates, nearestCity, getLocation, loading: geoLoading, error: geoError } = useGeolocation();

  const stateOptions = useMemo(
    () => ALL_STATES.map((s) => ({ label: s.name, value: s.slug, abbr: s.abbreviation })),
    []
  );
  const selectedState = useMemo(
    () => ALL_STATES.find((s) => s.slug === (stateSlug || routeState || '')),
    [stateSlug, routeState]
  );
  const locationExample = useMemo(() => {
    if (!selectedState) {
      return { cityState: 'Los Angeles, CA', zip: '90001' };
    }
    return STATE_SEARCH_EXAMPLES[selectedState.abbreviation] || {
      cityState: `City, ${selectedState.abbreviation}`,
      zip: '12345',
    };
  }, [selectedState]);

  const handleSearch = async () => {
    setError('');
    setResultsError('');
    setGeoLookupError('');
    const rawLocation = location.trim();
    const rawName = nameQuery.trim();
    const zipMatch = /^\d{5}$/.test(rawLocation) ? rawLocation : '';
    const geoCity = claimMode ? (geoFallbackCity || nearestCity || '').trim() : '';
    const zipEntry = zipMatch
      ? (zipToCity as Record<string, { city: string; state: string }>)[zipMatch]
      : null;

    let resolvedStateSlug = stateSlug || routeState || '';
    let city = rawLocation || geoCity;
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

    if (claimMode && !zipMatch && !geoCity) {
      setError('Enter a 5-digit ZIP code or use your location to find your facility.');
      return;
    }

    if (!resolvedStateSlug && !rawName && !zipMatch && !geoCity) {
      setError(`Please select a state or type a city followed by a state (e.g., "${locationExample.cityState}").`);
      return;
    }

    if (resolvedStateSlug) {
      const stateMatch = ALL_STATES.find((s) => s.slug === resolvedStateSlug);
      stateAbbr = stateMatch?.abbreviation || '';
    }

    const nextParams = new URLSearchParams();
    if (rawLocation) {
      nextParams.set('location', rawLocation);
    } else if (claimMode && geoCity) {
      nextParams.set('location', geoCity);
    }
    if (rawName) nextParams.set('name', rawName);
    if (resolvedStateSlug) nextParams.set('state', resolvedStateSlug);
    if (claimMode) nextParams.set('claim', '1');
    navigate(`/search?${nextParams.toString()}`);

    const searchViaSupabase = async (filters: { city?: string; state?: string; zip?: string }) => {
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
        return (data as SearchFacilityResult[]) || [];
      } catch (err: any) {
        const message = err?.message || '';
        if (!message.includes('Could not find the function')) throw err;

        let query = supabase
          .from('facilities')
          .select('id,name,city,state,address_line1,postal_code,phone,website_url,owner_id')
          .order('name', { ascending: true });

        if (filters.state) query = query.eq('state', filters.state);
        if (filters.city) query = query.ilike('city', filters.city);
        if (filters.zip) query = query.eq('postal_code', filters.zip);
        if (rawName) query = query.ilike('name', `%${rawName}%`);

        const { data, error } = await query.limit(50);
        if (error) throw error;
        setResultsError('Search RPC not ready yet. Using direct database search.');
        const fallbackRows = ((data as SearchFacilityResult[]) || []).map((row) => ({
          ...row,
          waiting_question_count: 0,
        }));
        return fallbackRows;
      }
    };

    const performSearch = async (filters: { city?: string; state?: string; zip?: string }) => {
      if (hasTypesense && typesenseClient) {
        try {
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
          const hits = (searchResult?.hits || []).map((hit: any) => hit.document) as SearchFacilityResult[];

          if (hits.length > 0) return hits;
          // Important: stale Typesense indexes can return 0 despite data existing in Supabase.
          // Fall through to database-backed search on zero-hit responses.
        } catch {
          // Fall through to Supabase search on any Typesense failure.
        }
      }

      return searchViaSupabase(filters);
    };

    const performOfflineSearch = async (
      filters: { city?: string; state?: string; zip?: string },
      message?: string
    ) => {
      const index = await loadFacilityIndexWithOptions({ stateAbbr: filters.state });
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
      setResultsError(message || (claimMode
        ? 'Live search is unavailable. Showing nearby offline results.'
        : 'Live search is unavailable. Showing offline results.'));
      return filtered.slice(0, 50);
    };

    const applyDistance = (items: SearchFacilityResult[]) => {
      if (!coordinates) return items;
      const ranked = items.map((item) => {
        const lat = typeof item.latitude === 'number' ? item.latitude : Number(item.latitude);
        const lng = typeof item.longitude === 'number' ? item.longitude : Number(item.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return item;
        return {
          ...item,
          distance_miles: milesBetween(coordinates.lat, coordinates.lng, lat, lng),
        };
      });
      if (!ranked.some((item) => Number.isFinite(item.distance_miles))) return ranked;
      return ranked.sort(
        (a, b) => (a.distance_miles ?? Number.POSITIVE_INFINITY) - (b.distance_miles ?? Number.POSITIVE_INFINITY)
      );
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

      if (!claimMode && zipMatch && hits.length === 0) {
        const zipState = zipEntry ? findStateByInput(zipEntry.state) : null;
        const stateOnly = zipState?.abbreviation || stateAbbr;
        if (stateOnly) {
          hits = await performSearch({ state: stateOnly });
          if (hits.length > 0) {
            setResultsError('No ZIP or city matches. Showing statewide results instead.');
          }
        }
      }

      if (claimMode && hits.length === 0) {
        const offlineFilters = {
          state: stateAbbr || (zipEntry ? findStateByInput(zipEntry.state)?.abbreviation : undefined),
          city: zipMatch ? zipEntry?.city : (city || geoCity),
          zip: zipMatch || undefined
        };
        const offlineHits = await performOfflineSearch(
          offlineFilters,
          'No live matches for that ZIP yet. Showing offline directory matches.'
        );
        if (offlineHits.length > 0) {
          hits = offlineHits;
        }
      }

      setResults(applyDistance(hits));
    } catch (err) {
      try {
        const offlineFilters = {
          state: stateAbbr || (zipEntry ? findStateByInput(zipEntry.state)?.abbreviation : undefined),
          city: zipMatch ? zipEntry?.city : (city || geoCity),
          zip: zipMatch || undefined
        };
        let offlineHits = await performOfflineSearch(offlineFilters);
        if (!claimMode && zipMatch && offlineHits.length === 0) {
          const stateOnly = offlineFilters.state;
          if (stateOnly) {
            offlineHits = await performOfflineSearch({ state: stateOnly });
            if (offlineHits.length > 0) {
              setResultsError('No ZIP or city matches. Showing statewide results instead.');
            }
          }
        }
        setResults(applyDistance(offlineHits));
      } catch (fallbackError) {
        console.error('Search failed:', fallbackError);
        setResultsError('Search failed. Please try again in a moment.');
      }
    } finally {
      setResultsLoading(false);
    }
  };

  const handleSearchRef = useRef(handleSearch);
  handleSearchRef.current = handleSearch;

  const resolveClaimLocation = async (lat: number, lng: number) => {
    setGeoLookupLoading(true);
    setGeoLookupError('');

    const reverse = await reverseGeocodeToLocation(lat, lng);
    const zip = reverse?.zip || '';
    const city = (reverse?.city || nearestCity || '').trim();
    const stateMatch = findStateByInput(reverse?.state || '');

    if (zip) {
      setLocation(zip);
      setGeoFallbackCity(city);
      if (stateMatch) setStateSlug(stateMatch.slug);
      setGeoLookupLoading(false);
      return;
    }

    setGeoFallbackCity(city);
    if (stateMatch) setStateSlug(stateMatch.slug);
    setGeoLookupLoading(false);
    setGeoLookupError(city
      ? `Could not detect ZIP from your location. Searching near ${city} instead.`
      : 'Could not detect ZIP from your location. Enter ZIP manually.');
  };

  const handleUseMyLocation = () => {
    setError('');
    setGeoLookupError('');
    if (coordinates) {
      void resolveClaimLocation(coordinates.lat, coordinates.lng);
      return;
    }
    getLocation();
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
    if (claimMode) {
      const zipOnly = value.replace(/\D/g, '').slice(0, 5);
      setLocation(zipOnly);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

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
    if (claimMode && (location.trim().length > 0 || geoFallbackCity)) {
      setHasAutoSearched(true);
      handleSearchRef.current();
      return;
    }
    if (routeState || location.trim().length > 0 || nameQuery.trim().length > 0) {
      setHasAutoSearched(true);
      handleSearchRef.current();
    }
  }, [routeState, location, nameQuery, hasAutoSearched, claimMode, geoFallbackCity]);

  useEffect(() => {
    if (!claimMode || !coordinates) return;
    if (location.trim().length > 0) return;
    void resolveClaimLocation(coordinates.lat, coordinates.lng);
  }, [claimMode, coordinates?.lat, coordinates?.lng]);

  useEffect(() => {
    if (!FEATURE_FLAGS.qa_waiting_badges) return;
    if (typeof window === 'undefined') return;

    for (const facility of results) {
      const waiting = Number(facility.waiting_question_count || 0);
      if (waiting <= 0) continue;
      const key = `qa_waiting_badge_viewed_search_${facility.id}`;
      if (sessionStorage.getItem(key) === '1') continue;
      sessionStorage.setItem(key, '1');
      trackEvent('qa_waiting_badge_viewed', {
        source: 'search_card',
        facilityId: facility.id,
        waitingCount: waiting,
      });
    }
  }, [results]);

  return (
    <div className="min-h-screen bg-warm-gray">
      <div className="py-16 bg-white border-b border-warm-gray">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-4">
            {claimMode ? 'Find Your Facility By ZIP' : 'Search Senior Living by City or State'}
          </h1>
          <p className="text-lg text-charcoal/70 mb-8">
            {claimMode
              ? 'Use your current location or enter facility ZIP code to choose from a short local list and claim the correct listing.'
              : `Choose a state or type a city or ZIP code (e.g., "${locationExample.cityState}" or "${locationExample.zip}") to see every licensed facility.`}
          </p>
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-warm-gray">
            <div className="flex flex-col md:flex-row gap-4">
              {!claimMode && (
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
              )}
              <div className="flex-1 relative">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  {claimMode ? 'ZIP code' : 'City or ZIP (optional)'}
                </label>
                <MapPin className="absolute left-3 top-11 transform text-charcoal/40" size={20} />
                <input
                  type="text"
                  placeholder={claimMode ? 'e.g., 75201' : `${locationExample.cityState} or ${locationExample.zip}`}
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => !claimMode && location.trim() && setShowSuggestions(true)}
                  onBlur={() => !claimMode && setTimeout(() => setShowSuggestions(false), 150)}
                  className="w-full pl-10 pr-4 py-3 border border-warm-gray rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-warm-gray"
                />
                {!claimMode && showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-warm-gray rounded-xl shadow-lg text-left">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.label}-${index}`}
                        className="w-full px-4 py-2 text-sm text-charcoal hover:bg-warm-gray flex items-center justify-between"
                        onMouseDown={() => handleSuggestionSelect(suggestion)}
                      >
                        <span>{suggestion.label}</span>
                        <span className="text-sm text-charcoal/60 uppercase">
                          {suggestion.type === 'zip' ? 'ZIP' : suggestion.type === 'state' ? 'State' : 'City'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {claimMode && (
                <button
                  type="button"
                  className="self-end border border-warm-gray bg-white text-charcoal px-4 py-3 rounded-md font-medium transition-colors whitespace-nowrap hover:bg-warm-gray disabled:opacity-60"
                  onClick={handleUseMyLocation}
                  disabled={geoLoading || geoLookupLoading}
                >
                  <span className="inline-flex items-center gap-2">
                    <LocateFixed size={18} />
                    {geoLoading || geoLookupLoading ? 'Locating...' : 'Use my location'}
                  </span>
                </button>
              )}
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
            {!claimMode && (
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
            )}
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            {claimMode && geoLookupError && <p className="text-sm text-amber-700 mt-3">{geoLookupError}</p>}
            {claimMode && geoError && <p className="text-sm text-red-600 mt-3">{geoError}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-2xl shadow p-6 border border-warm-gray">
          <h2 className="text-xl font-bold text-charcoal mb-2">Search results</h2>
          <p className="text-charcoal/70 mb-6">
            {resultsLoading
              ? 'Searching facilities...'
              : claimMode
                ? 'Select your listing from nearby ZIP matches.'
                : 'Showing the best matches based on your search.'}
          </p>
          {resultsError && (
            <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              {resultsError}
            </div>
          )}
          {resultsLoading ? (
            <div className="text-sm text-charcoal/60">Loading results...</div>
          ) : results.length === 0 ? (
            <NoResults requestedLocation={location || stateOptions.find((s) => s.value === stateSlug)?.label || 'this area'} />
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
                    {claimMode && Number.isFinite(facility.distance_miles) && (
                      <p className="text-sm text-charcoal/60">{facility.distance_miles!.toFixed(1)} miles away</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest">
                      {facility.website_url ? (
                        <span className="rounded-full bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1">
                          Verified community
                        </span>
                      ) : (
                        <span className="rounded-full bg-warm-gray text-charcoal/60 border border-warm-gray px-2 py-1">
                          Website unavailable
                        </span>
                      )}
                      {FEATURE_FLAGS.qa_waiting_badges && Number(facility.waiting_question_count || 0) > 0 && (
                        <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1">
                          {facility.waiting_question_count} waiting
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      className="bg-charcoal text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-black"
                      onClick={() => navigate(`/facility/${facility.id}`)}
                    >
                      View details
                    </button>
                    {!facility.owner_id && isUuid(facility.id) && (
                      <button
                        className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                        onClick={() => navigate(`/claim/${facility.id}`)}
                      >
                        Claim this listing
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!claimMode && (
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
      )}
    </div>
  );
};

export default DirectorySearch;
