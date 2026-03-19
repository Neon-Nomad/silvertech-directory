import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BedDouble, Globe2, Hash, LocateFixed, MapPin, Phone, Search, ShieldCheck } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';
import zipToCity from '@/src/data/zip_to_city.json';
import { getLocationSuggestions, LocationSuggestion } from '@/src/utils/locationSuggestions';
import { supabase } from '@/src/lib/supabase';
import { FacilityIndexItem, loadFacilityIndexWithOptions, resolvePublicIdentities } from '@/src/utils/facilityIndex';
import { hasTypesense, typesenseClient } from '@/src/lib/typesense';
import { NoResults } from '@/features/family/discovery/NoResults';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { buildFacilityDetailPath, getCareTypeRouteLabel } from '@/src/utils/facilityPath';

type SearchFacilityResult = FacilityIndexItem & {
  owner_id?: string | null;
  listing_tier?: string;
  waiting_question_count?: number;
  latitude?: number | null;
  longitude?: number | null;
  distance_miles?: number;
};

type SearchFacilityDetailRow = {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website_url?: string | null;
  state_license_number?: string | null;
  cms_certification_number?: string | null;
  canonical_payload?: Record<string, unknown> | string | null;
  facility_licensing?: Array<{
    license_number?: string | null;
    bed_capacity?: number | null;
  } | null> | null;
  facility_care_types?: Array<{
    care_types?: {
      name?: string | null;
      slug?: string | null;
    } | null;
  } | null> | null;
};

type EnrichedSearchFacilityResult = SearchFacilityResult & {
  licenseNumber: string | null;
  certifiedBeds: number | null;
  careTypeLabels: string[];
  primaryCareLabel: string | null;
  medicareCertified: boolean;
  medicaidCertified: boolean;
  ownershipLabel: string | null;
  officialWebsiteVerified: boolean;
};

type ReverseGeocodeResult = {
  zip?: string;
  city?: string;
  state?: string;
};

type SearchIntent = 'city' | 'zip' | 'state' | 'nameOnly' | 'national';

type SearchSnapshot = {
  claimMode: boolean;
  rawLocation: string;
  rawName: string;
  stateSlug: string;
  stateAbbr: string;
  city: string;
  zip: string;
  zipCity: string;
  intent: SearchIntent;
  locationLabel: string;
  exactCitySlug: string;
};

type NearbySection = {
  key: string;
  city: string;
  state: string;
  facilities: EnrichedSearchFacilityResult[];
  distanceMiles: number | null;
};

const LOCAL_RESULTS_TARGET = 3;
const MAX_NEARBY_CITIES = 3;
const MAX_NEARBY_RESULTS_PER_CITY = 3;

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalizeFacilityKey = (facility: SearchFacilityResult): string => {
  const state = (facility.state || '').trim().toUpperCase();
  const city = toSlug(facility.city || '');
  const name = (facility.name || '').toLowerCase().trim();
  const address = (facility.address_line1 || '').toLowerCase().trim();
  const postal = (facility.postal_code || '').trim();
  return `${name}|${address}|${city}|${state}|${postal}`;
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

const reverseGeocodeToLocation = async (
  lat: number,
  lng: number,
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
      address.city || address.town || address.village || address.hamlet || address.county || '',
    ).trim();
    const stateCode = String(address.state_code || '').trim();
    const stateFromCode = stateCode.includes('-') ? stateCode.split('-')[1] : stateCode;
    const state = (stateFromCode || String(address.state || '')).trim();
    return { zip, city, state };
  } catch {
    return null;
  }
};

const safeJson = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

const toNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeOwnershipLabel = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (!normalized) return null;
  if (normalized === 'for profit') return 'For-Profit';
  if (normalized === 'nonprofit') return 'Nonprofit';
  if (normalized === 'government') return 'Government';
  return toTitleCase(normalized);
};

const findStateByInput = (input: string) => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  return (
    ALL_STATES.find((entry) => entry.abbreviation.toLowerCase() === normalized) ||
    ALL_STATES.find((entry) => entry.name.toLowerCase() === normalized) ||
    ALL_STATES.find((entry) => entry.slug === normalized)
  );
};

const extractCareTypeLabels = (
  detail: SearchFacilityDetailRow | undefined,
  fallbackSlug?: string | null,
): string[] => {
  const labels = new Set<string>();
  for (const entry of detail?.facility_care_types || []) {
    const careType = entry?.care_types;
    const slug = String(careType?.slug || '').trim().toLowerCase();
    const name = String(careType?.name || '').trim();
    if (slug) labels.add(getCareTypeRouteLabel(slug));
    else if (name) labels.add(name);
  }
  if (labels.size === 0 && fallbackSlug) {
    labels.add(getCareTypeRouteLabel(fallbackSlug));
  }
  return Array.from(labels).slice(0, 4);
};

const getSearchIntent = (
  zip: string,
  city: string,
  stateSlug: string,
  rawName: string,
): SearchIntent => {
  if (zip) return 'zip';
  if (city && stateSlug) return 'city';
  if (stateSlug) return 'state';
  if (rawName) return 'nameOnly';
  return 'national';
};

const averageCoordinate = (facilities: Array<{ latitude?: number | null; longitude?: number | null }>) => {
  const points = facilities.filter(
    (facility) => Number.isFinite(facility.latitude) && Number.isFinite(facility.longitude),
  );
  if (points.length === 0) return null;
  const latSum = points.reduce((sum, facility) => sum + Number(facility.latitude), 0);
  const lngSum = points.reduce((sum, facility) => sum + Number(facility.longitude), 0);
  return {
    latitude: latSum / points.length,
    longitude: lngSum / points.length,
  };
};

const buildSearchSnapshot = (options: {
  claimMode: boolean;
  rawLocation: string;
  rawName: string;
  resolvedStateSlug: string;
  stateAbbr: string;
  city: string;
  zip: string;
  zipEntry?: { city: string; state: string } | null;
}): SearchSnapshot => {
  const stateName = ALL_STATES.find((entry) => entry.slug === options.resolvedStateSlug)?.name || options.stateAbbr;
  const locationLabel = options.zip
    ? options.zipEntry?.city && options.stateAbbr
      ? `${options.zipEntry.city}, ${options.stateAbbr}`
      : options.rawLocation || options.zip
    : options.city && options.stateAbbr
      ? `${options.city}, ${options.stateAbbr}`
      : stateName || 'the United States';

  return {
    claimMode: options.claimMode,
    rawLocation: options.rawLocation,
    rawName: options.rawName,
    stateSlug: options.resolvedStateSlug,
    stateAbbr: options.stateAbbr,
    city: options.city,
    zip: options.zip,
    zipCity: options.zipEntry?.city || '',
    intent: getSearchIntent(options.zip, options.city, options.resolvedStateSlug, options.rawName),
    locationLabel,
    exactCitySlug: toSlug(options.city || options.zipEntry?.city || ''),
  };
};

const enrichSearchResults = async (
  rows: SearchFacilityResult[],
): Promise<EnrichedSearchFacilityResult[]> => {
  const ids = Array.from(new Set(rows.map((row) => row.id).filter(Boolean)));
  if (ids.length === 0) return [];

  const detailById = new Map<string, SearchFacilityDetailRow>();
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        id,
        latitude,
        longitude,
        phone,
        website_url,
        state_license_number,
        cms_certification_number,
        canonical_payload,
        facility_licensing(license_number,bed_capacity),
        facility_care_types(care_types(name,slug))
      `)
      .in('id', ids);

    if (error) throw error;
    for (const row of (data as SearchFacilityDetailRow[] | null) || []) {
      detailById.set(row.id, row);
    }
  } catch (error) {
    console.error('Unable to enrich search results with trust fields:', error);
  }

  return rows.map((row) => {
    const detail = detailById.get(row.id);
    const canonicalPayload = safeJson(detail?.canonical_payload);
    const licensing = (detail?.facility_licensing || []).find((entry) => entry?.license_number) || null;
    const careTypeLabels = extractCareTypeLabels(detail, row.primary_care_type_slug);
    const certifiedBeds = toNumber(canonicalPayload?.certified_beds) ?? toNumber(licensing?.bed_capacity);

    return {
      ...row,
      latitude: detail?.latitude ?? row.latitude ?? null,
      longitude: detail?.longitude ?? row.longitude ?? null,
      phone: detail?.phone || row.phone,
      website_url: detail?.website_url || row.website_url,
      licenseNumber: licensing?.license_number || detail?.state_license_number || null,
      certifiedBeds,
      careTypeLabels,
      primaryCareLabel:
        careTypeLabels[0] ||
        (row.primary_care_type_slug ? getCareTypeRouteLabel(row.primary_care_type_slug) : null),
      medicareCertified: toBoolean(canonicalPayload?.medicare_certified) || Boolean(detail?.cms_certification_number),
      medicaidCertified: toBoolean(canonicalPayload?.medicaid_certified),
      ownershipLabel: normalizeOwnershipLabel(canonicalPayload?.ownership_type),
      officialWebsiteVerified: Boolean(detail?.website_url || row.website_url),
    };
  });
};

const STATE_SEARCH_EXAMPLES: Record<string, { cityState: string; zip: string }> = {
  CA: { cityState: 'Los Angeles, CA', zip: '90001' },
  FL: { cityState: 'Orlando, FL', zip: '32801' },
  TX: { cityState: 'Austin, TX', zip: '78701' },
  NY: { cityState: 'Buffalo, NY', zip: '14201' },
  IN: { cityState: 'Muncie, IN', zip: '47302' },
};

const pillStyles = {
  care: 'border-charcoal bg-white text-charcoal',
  trust: 'border-gold/50 bg-gold/10 text-gold',
  neutral: 'border-slate-200 bg-white text-charcoal/70',
} as const;

const ResultPill: React.FC<{ tone: keyof typeof pillStyles; children: React.ReactNode }> = ({ tone, children }) => (
  <span
    className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${pillStyles[tone]}`}
  >
    {children}
  </span>
);

const SearchResultCard: React.FC<{ facility: EnrichedSearchFacilityResult; claimMode?: boolean }> = ({
  facility,
  claimMode = false,
}) => {
  const communityPath = buildFacilityDetailPath({
    id: facility.id,
    publicSlug: facility.public_slug,
    publicRouteId: facility.public_route_id,
    careType: facility.primary_care_type_slug,
    state: facility.state,
    city: facility.city,
  });
  const claimPath = isUuid(facility.id) ? `/claim/${facility.id}` : communityPath;
  const primaryPath = claimMode ? claimPath : communityPath;
  const primaryLabel = claimMode && isUuid(facility.id) ? 'Claim Listing' : 'View Community';

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-6 md:p-8">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-2xl font-bold text-charcoal">
                <Link className="transition-colors hover:text-gold" to={communityPath}>
                  {facility.name}
                </Link>
              </h2>
              {claimMode && Number.isFinite(facility.distance_miles) && (
                <p className="mt-2 text-sm text-charcoal/60">{facility.distance_miles!.toFixed(1)} miles away</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {facility.primaryCareLabel && <ResultPill tone="care">{facility.primaryCareLabel}</ResultPill>}
            {facility.licenseNumber && <ResultPill tone="trust">Licensed</ResultPill>}
            {facility.medicareCertified && <ResultPill tone="neutral">Medicare</ResultPill>}
            {facility.medicaidCertified && <ResultPill tone="neutral">Medicaid</ResultPill>}
            {facility.ownershipLabel && <ResultPill tone="neutral">{facility.ownershipLabel}</ResultPill>}
          </div>

          <div className="mt-6 grid gap-5 text-sm font-medium text-charcoal/70 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <span>
                {facility.address_line1 ? `${facility.address_line1}, ` : ''}
                <br className={facility.address_line1 ? '' : 'hidden'} />
                {facility.city}, {facility.state} {facility.postal_code || ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-gold" />
              <span>{facility.phone || 'Phone not listed'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe2 className="h-4 w-4 shrink-0 text-gold" />
              {facility.website_url ? (
                <a
                  className="underline decoration-gold/30 underline-offset-4 transition-all hover:decoration-gold"
                  href={facility.website_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {facility.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                </a>
              ) : (
                <span className="text-charcoal/45">Website not listed</span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-5 text-[11px] font-bold uppercase tracking-[0.22em] text-charcoal/45">
            {facility.licenseNumber && (
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-gold" />
                <span>License: {facility.licenseNumber}</span>
              </div>
            )}
            {facility.certifiedBeds !== null && (
              <div className="flex items-center gap-2">
                <BedDouble className="h-3.5 w-3.5 text-gold" />
                <span>Certified Beds: {facility.certifiedBeds}</span>
              </div>
            )}
            {facility.officialWebsiteVerified && (
              <div className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Official Website Verified</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-slate-200 bg-warm-white p-6 lg:w-48 lg:border-l lg:border-t-0">
          <Link
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-charcoal px-4 py-4 text-center text-sm font-bold uppercase tracking-[0.26em] text-white transition-colors hover:bg-black"
            to={primaryPath}
          >
            {primaryLabel}
          </Link>
        </div>
      </div>
    </article>
  );
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
  const [results, setResults] = useState<EnrichedSearchFacilityResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [hasAutoSearched, setHasAutoSearched] = useState(false);
  const [geoLookupError, setGeoLookupError] = useState('');
  const [geoFallbackCity, setGeoFallbackCity] = useState('');
  const [geoLookupLoading, setGeoLookupLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState<SearchSnapshot | null>(null);
  const { coordinates, nearestCity, getLocation, loading: geoLoading, error: geoError } = useGeolocation();

  const stateOptions = useMemo(
    () => ALL_STATES.map((state) => ({ label: state.name, value: state.slug, abbr: state.abbreviation })),
    [],
  );
  const seededStateFromUrl = Boolean(routeState || searchParams.get('state'));
  const selectedState = useMemo(
    () => ALL_STATES.find((state) => state.slug === (stateSlug || routeState || '')),
    [stateSlug, routeState],
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
    const zipEntry = zipMatch ? (zipToCity as Record<string, { city: string; state: string }>)[zipMatch] : null;

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

    if (!zipMatch && rawLocation && !rawLocation.includes(',')) {
      const tokens = rawLocation.split(/\s+/).filter(Boolean);
      if (tokens.length >= 2) {
        const maybeState = tokens[tokens.length - 1];
        const stateMatch = findStateByInput(maybeState);
        if (stateMatch) {
          const cityPart = tokens.slice(0, -1).join(' ').trim();
          if (cityPart) city = cityPart;
          if (!resolvedStateSlug || resolvedStateSlug !== stateMatch.slug) {
            resolvedStateSlug = stateMatch.slug;
          }
        }
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
      const stateMatch = ALL_STATES.find((state) => state.slug === resolvedStateSlug);
      stateAbbr = stateMatch?.abbreviation || '';
    }

    setLastSearch(
      buildSearchSnapshot({
        claimMode,
        rawLocation,
        rawName,
        resolvedStateSlug,
        stateAbbr,
        city,
        zip: zipMatch,
        zipEntry,
      }),
    );

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

    const searchViaSupabase = async (
      filters: { city?: string; state?: string; zip?: string },
      options?: { queryText?: string | null },
    ) => {
      const effectiveQueryText = options?.queryText !== undefined ? options.queryText : rawName || null;
      try {
        const { data, error } = await supabase.rpc('search_facilities', {
          query_text: effectiveQueryText,
          state_filter: filters.state || null,
          city_filter: filters.city || null,
          postal_filter: filters.zip || null,
          limit_count: 50,
          offset_count: 0,
        });
        if (error) throw error;
        return (data as SearchFacilityResult[]) || [];
      } catch (err: any) {
        const message = String(err?.message || '');
        const code = String(err?.code || '');
        const rpcMissing =
          code === 'PGRST202' ||
          message.includes('Could not find the function') ||
          message.includes('No function matches the given name');
        if (!rpcMissing) throw err;

        let query = supabase
          .from('facilities')
          .select('id,name,city,state,address_line1,postal_code,phone,website_url,owner_id,latitude,longitude,listing_tier')
          .order('name', { ascending: true });

        if (filters.state) query = query.eq('state', filters.state);
        if (filters.city) query = query.ilike('city', filters.city);
        if (filters.zip) query = query.eq('postal_code', filters.zip);
        if (effectiveQueryText) query = query.ilike('name', `%${effectiveQueryText}%`);

        const { data, error } = await query.limit(50);
        if (error) throw error;
        setResultsError('Search RPC not ready yet. Using direct database search.');
        return ((data as SearchFacilityResult[]) || []).map((row) => ({
          ...row,
          waiting_question_count: 0,
        }));
      }
    };

    const performSearch = async (
      filters: { city?: string; state?: string; zip?: string },
      options?: { queryText?: string | null },
    ) => {
      const effectiveQueryText = options?.queryText !== undefined ? options.queryText : rawName || null;
      try {
        return await searchViaSupabase(filters, options);
      } catch (supabaseError) {
        if (!hasTypesense || !typesenseClient) throw supabaseError;

        try {
          const searchArgs: Record<string, unknown> = {
            q: effectiveQueryText || '*',
            query_by: 'name,city,state,postal_code',
            query_by_weights: '8,3,2,2',
            sort_by: 'premium_tier:desc,_text_match:desc',
            per_page: 50,
          };
          const filterParts: string[] = [];
          if (filters.state) filterParts.push(`state:=${filters.state}`);
          if (filters.city) filterParts.push(`city:=${filters.city}`);
          if (filters.zip) filterParts.push(`postal_code:=${filters.zip}`);
          if (filterParts.length > 0) {
            searchArgs.filter_by = filterParts.join(' && ');
          }

          const searchResult: any = await typesenseClient.collections('facilities').documents().search(searchArgs as any);
          setResultsError('Primary search is unavailable. Showing fallback search results.');
          return (searchResult?.hits || []).map((hit: any) => hit.document) as SearchFacilityResult[];
        } catch {
          throw supabaseError;
        }
      }
    };

    const performOfflineSearch = async (
      filters: { city?: string; state?: string; zip?: string },
      message?: string,
    ) => {
      const index = await loadFacilityIndexWithOptions({ stateAbbr: filters.state });
      let filtered = index;
      if (filters.state) {
        filtered = filtered.filter((facility) => facility.state?.toLowerCase() === filters.state?.toLowerCase());
      }
      if (filters.city) {
        filtered = filtered.filter((facility) => (facility.city || '').trim().toLowerCase() === filters.city?.toLowerCase());
      }
      if (filters.zip) {
        filtered = filtered.filter((facility) => (facility.postal_code || '').trim() === filters.zip);
      }
      if (rawName) {
        const needle = rawName.toLowerCase();
        filtered = filtered.filter((facility) => (facility.name || '').toLowerCase().includes(needle));
      }
      setResultsError(
        message || (claimMode ? 'Live search is unavailable. Showing nearby offline results.' : 'Live search is unavailable. Showing offline results.'),
      );
      return filtered.slice(0, 50);
    };

    const dedupeFacilities = (items: SearchFacilityResult[]) => {
      const seen = new Set<string>();
      const unique: SearchFacilityResult[] = [];
      for (const item of items) {
        const key = normalizeFacilityKey(item);
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
      }
      return unique;
    };

    const applyDistance = <T extends SearchFacilityResult>(items: T[]) => {
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
        (a, b) => (a.distance_miles ?? Number.POSITIVE_INFINITY) - (b.distance_miles ?? Number.POSITIVE_INFINITY),
      );
    };

    const exactCitySlug = !zipMatch && city ? toSlug(city) : '';
    const enforceExactCity = (items: SearchFacilityResult[]) => {
      if (!exactCitySlug) return items;
      return items.filter((item) => toSlug(item.city || '') === exactCitySlug);
    };

    const getGuaranteedFallback = async (options?: { preferClaimLocal?: boolean }) => {
      const stateOnly = stateAbbr || (zipEntry ? findStateByInput(zipEntry.state)?.abbreviation : undefined);
      const locationPattern = city ? `%${toSlug(city).split('-').join('%')}%` : undefined;
      const stateDef = stateOnly
        ? ALL_STATES.find((entry) => entry.abbreviation.toUpperCase() === stateOnly.toUpperCase())
        : null;
      const stateLabel = stateDef?.name || stateOnly || '';
      const cityLabel = city || zipEntry?.city || '';
      const localLabel = cityLabel && stateOnly ? `${cityLabel}, ${stateOnly}` : cityLabel || stateLabel || 'your selected area';
      const queryLabel = rawName ? `"${rawName}"` : localLabel;
      const localScopeLabel = cityLabel && stateOnly ? `${cityLabel}, ${stateOnly}` : stateLabel || localLabel;
      const attempts: Array<{ message: string; run: () => Promise<SearchFacilityResult[]> }> = [];

      if (rawName) {
        attempts.push({
          message: `No results for ${queryLabel} in ${localLabel}. Showing facilities in ${localScopeLabel} without the name filter.`,
          run: async () => {
            const rows = await performSearch(
              {
                state: stateOnly,
                city: zipMatch ? undefined : locationPattern,
                zip: zipMatch || undefined,
              },
              { queryText: null },
            );
            return enforceExactCity(rows);
          },
        });
      }

      if (options?.preferClaimLocal && zipEntry?.city && zipEntry?.state) {
        const zipState = findStateByInput(zipEntry.state);
        const zipLabel = zipState?.abbreviation ? `${zipEntry.city}, ${zipState.abbreviation}` : zipEntry.city;
        attempts.push({
          message: `No direct results for ZIP ${zipMatch}. Showing nearby facilities in ${zipLabel}.`,
          run: async () =>
            performSearch(
              {
                state: zipState?.abbreviation,
                city: `%${toSlug(zipEntry.city).split('-').join('%')}%`,
              },
              { queryText: null },
            ),
        });
      }

      if (stateOnly) {
        attempts.push({
          message: `No results for ${queryLabel} in ${localLabel}. Showing facilities across ${stateLabel}.`,
          run: async () => performSearch({ state: stateOnly }, { queryText: null }),
        });
      }

      attempts.push({
        message: `No results for ${queryLabel}${localLabel ? ` in ${localLabel}` : ''}. Showing facilities nationwide.`,
        run: async () => performSearch({}, { queryText: null }),
      });

      for (const attempt of attempts) {
        try {
          const rows = dedupeFacilities(await attempt.run());
          if (rows.length > 0) {
            setResultsError(attempt.message);
            return rows;
          }
        } catch {
          // Try the next fallback source.
        }
      }

      try {
        const offlineRows = await performOfflineSearch(
          { state: stateOnly, city: zipMatch ? zipEntry?.city : city || undefined, zip: zipMatch || undefined },
          'Live search is unavailable. Showing offline backup listings.',
        );
        if (offlineRows.length > 0) return dedupeFacilities(offlineRows);
      } catch {
        // Continue to final offline global fallback.
      }

      const offlineGlobal = await performOfflineSearch(
        {},
        'Live search is unavailable. Showing offline national backup listings.',
      );
      return dedupeFacilities(offlineGlobal);
    };

    setResultsLoading(true);
    try {
      const cityPattern = city ? `%${toSlug(city).split('-').join('%')}%` : undefined;
      const primaryFilters = {
        state: stateAbbr || undefined,
        city: zipMatch ? undefined : cityPattern,
        zip: zipMatch || undefined,
      };
      let hits = enforceExactCity(await performSearch(primaryFilters));

      if (!zipMatch && hits.length === 0 && cityPattern && stateAbbr) {
        const stateOnlyHits = await performSearch({ state: stateAbbr, zip: undefined });
        hits = enforceExactCity(stateOnlyHits);
      }

      if (zipMatch && hits.length === 0 && zipEntry?.city && zipEntry?.state) {
        const zipState = findStateByInput(zipEntry.state);
        hits = enforceExactCity(
          await performSearch({
            state: zipState?.abbreviation,
            city: `%${toSlug(zipEntry.city).split('-').join('%')}%`,
          }),
        );
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
        const offlineHits = await performOfflineSearch(
          {
            state: stateAbbr || (zipEntry ? findStateByInput(zipEntry.state)?.abbreviation : undefined),
            city: zipMatch ? zipEntry?.city : city || geoCity,
            zip: zipMatch || undefined,
          },
          'No live matches for that ZIP yet. Showing offline directory matches.',
        );
        if (offlineHits.length > 0) {
          hits = offlineHits;
        }
      }

      let supplementalHits: SearchFacilityResult[] = [];
      const shouldSupplementNearby =
        !claimMode &&
        !rawName &&
        stateAbbr &&
        hits.length > 0 &&
        hits.length < LOCAL_RESULTS_TARGET &&
        ((zipMatch && Boolean(zipEntry?.city)) || (!zipMatch && Boolean(cityPattern)));

      if (shouldSupplementNearby) {
        try {
          const broaderHits = dedupeFacilities(await performSearch({ state: stateAbbr }, { queryText: null }));
          const localKeys = new Set(hits.map(normalizeFacilityKey));
          supplementalHits = broaderHits.filter((facility) => !localKeys.has(normalizeFacilityKey(facility)));
        } catch (supplementError) {
          console.error('Unable to load nearby supplemental results:', supplementError);
        }
      }

      if (hits.length === 0) {
        hits = await getGuaranteedFallback({ preferClaimLocal: claimMode });
      }

      const combinedHits = dedupeFacilities([...hits, ...supplementalHits]);
      const resolved = await resolvePublicIdentities(combinedHits);
      const enriched = await enrichSearchResults(resolved);
      setResults(applyDistance(enriched));
    } catch (err) {
      console.error('Search failed:', err);
      try {
        const fallbackHits = await getGuaranteedFallback({ preferClaimLocal: claimMode });
        const resolved = await resolvePublicIdentities(fallbackHits);
        const enriched = await enrichSearchResults(resolved);
        setResults(applyDistance(enriched));
      } catch (fallbackError) {
        console.error('Search fallback failed:', fallbackError);
        setResultsError('Search failed. Please try again in a moment.');
        setResults([]);
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
    setGeoLookupError(
      city
        ? `Could not detect ZIP from your location. Searching near ${city} instead.`
        : 'Could not detect ZIP from your location. Enter ZIP manually.',
    );
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
    if (seededStateFromUrl || location.trim().length > 0 || nameQuery.trim().length > 0) {
      setHasAutoSearched(true);
      handleSearchRef.current();
    }
  }, [seededStateFromUrl, location, nameQuery, hasAutoSearched, claimMode, geoFallbackCity]);

  useEffect(() => {
    if (!claimMode || !coordinates) return;
    if (location.trim().length > 0) return;
    void resolveClaimLocation(coordinates.lat, coordinates.lng);
  }, [claimMode, coordinates?.lat, coordinates?.lng]);

  const searchPresentation = useMemo(() => {
    if (!lastSearch || claimMode || lastSearch.rawName || lastSearch.intent === 'state' || lastSearch.intent === 'nameOnly') {
      return {
        primaryResults: results,
        nearbySections: [] as NearbySection[],
      };
    }

    let primaryResults: EnrichedSearchFacilityResult[] = results;

    if (lastSearch.intent === 'city') {
      primaryResults = results.filter(
        (facility) =>
          toSlug(facility.city || '') === lastSearch.exactCitySlug &&
          (facility.state || '').trim().toUpperCase() === lastSearch.stateAbbr,
      );
    }

    if (lastSearch.intent === 'zip') {
      const exactZipResults = results.filter((facility) => (facility.postal_code || '').trim() === lastSearch.zip);
      primaryResults =
        exactZipResults.length > 0
          ? exactZipResults
          : results.filter(
              (facility) =>
                toSlug(facility.city || '') === lastSearch.exactCitySlug &&
                (facility.state || '').trim().toUpperCase() === lastSearch.stateAbbr,
            );
    }

    const primaryIds = new Set(primaryResults.map((facility) => facility.id));
    const nearbyCandidates = results.filter((facility) => !primaryIds.has(facility.id));
    const shouldShowNearby = primaryResults.length < LOCAL_RESULTS_TARGET && nearbyCandidates.length > 0;

    if (!shouldShowNearby) {
      return {
        primaryResults: primaryResults.length > 0 ? primaryResults : results,
        nearbySections: [] as NearbySection[],
      };
    }

    const center = averageCoordinate(primaryResults);
    const grouped = new Map<string, NearbySection>();

    for (const facility of nearbyCandidates) {
      const cityName = facility.city || 'Nearby';
      const stateCode = facility.state || lastSearch.stateAbbr;
      const key = `${toSlug(cityName)}|${stateCode}`;
      const lat = Number(facility.latitude);
      const lng = Number(facility.longitude);
      const distanceMiles =
        center && Number.isFinite(lat) && Number.isFinite(lng)
          ? milesBetween(center.latitude, center.longitude, lat, lng)
          : null;

      const existing = grouped.get(key);
      if (!existing) {
        grouped.set(key, {
          key,
          city: cityName,
          state: stateCode,
          facilities: [facility],
          distanceMiles,
        });
        continue;
      }

      existing.facilities.push(facility);
      if (distanceMiles !== null) {
        existing.distanceMiles =
          existing.distanceMiles === null ? distanceMiles : Math.min(existing.distanceMiles, distanceMiles);
      }
    }

    const nearbySections = Array.from(grouped.values())
      .map((section) => ({
        ...section,
        facilities: section.facilities
          .slice()
          .sort((a, b) => {
            const distanceDelta = (a.distance_miles ?? Number.POSITIVE_INFINITY) - (b.distance_miles ?? Number.POSITIVE_INFINITY);
            if (distanceDelta !== 0) return distanceDelta;
            return a.name.localeCompare(b.name);
          })
          .slice(0, MAX_NEARBY_RESULTS_PER_CITY),
      }))
      .sort((a, b) => {
        const distanceDelta = (a.distanceMiles ?? Number.POSITIVE_INFINITY) - (b.distanceMiles ?? Number.POSITIVE_INFINITY);
        if (distanceDelta !== 0) return distanceDelta;
        return a.city.localeCompare(b.city);
      })
      .slice(0, MAX_NEARBY_CITIES);

    return {
      primaryResults,
      nearbySections,
    };
  }, [claimMode, lastSearch, results]);

  const primaryResults = searchPresentation.primaryResults;
  const nearbySections = searchPresentation.nearbySections;

  const heroTitle = useMemo(() => {
    if (claimMode) return 'Find Your Facility By ZIP';
    if (!lastSearch) return 'Search Senior Living by City or ZIP';
    if (lastSearch.intent === 'state') {
      const stateName = ALL_STATES.find((entry) => entry.slug === lastSearch.stateSlug)?.name || lastSearch.locationLabel;
      return `Senior Living Communities in ${stateName}`;
    }
    if (lastSearch.intent === 'national') return 'Senior Living Search Results';
    return `Senior Living Communities in ${lastSearch.locationLabel}`;
  }, [claimMode, lastSearch]);

  const heroDescription = useMemo(() => {
    if (claimMode) {
      return 'Use your current location or enter a facility ZIP code to find the correct listing before you claim it.';
    }
    if (!lastSearch) {
      return `Choose a state or type a city or ZIP code (e.g., "${locationExample.cityState}" or "${locationExample.zip}") to see communities with trust data and direct profile links.`;
    }

    if (resultsLoading) {
      return `Searching ${lastSearch.locationLabel} for community matches and nearby options.`;
    }

    const licensedCount = primaryResults.filter((facility) => Boolean(facility.licenseNumber)).length;
    const medicareCount = primaryResults.filter((facility) => facility.medicareCertified).length;
    const websiteCount = primaryResults.filter((facility) => facility.officialWebsiteVerified).length;
    const communityLabel = primaryResults.length === 1 ? 'community' : 'communities';

    if (primaryResults.length > 0) {
      return `Browse ${primaryResults.length.toLocaleString()} ${communityLabel} in ${lastSearch.locationLabel}. ${licensedCount.toLocaleString()} include a listed license number, ${medicareCount.toLocaleString()} show Medicare data, and ${websiteCount.toLocaleString()} have an official website listed.`;
    }

    if (nearbySections.length > 0) {
      return `No exact matches were found in ${lastSearch.locationLabel}. Continue with nearby city options below.`;
    }

    return `Search results for ${lastSearch.locationLabel} with direct community profiles and local trust details.`;
  }, [claimMode, lastSearch, locationExample.cityState, locationExample.zip, nearbySections.length, primaryResults, resultsLoading]);

  const pageTitle = `${heroTitle} | SilverTech`;
  const pageDescription = heroDescription;
  const searchLocationLabel = lastSearch?.locationLabel || selectedState?.name || location || 'this area';

  return (
    <div className="min-h-screen bg-[#f6f6f2]">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
      </Helmet>

      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {!claimMode && lastSearch?.locationLabel && (
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
              <MapPin className="h-4 w-4" />
              <span>{lastSearch.locationLabel}</span>
            </div>
          )}

          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold text-charcoal md:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-charcoal/70">{heroDescription}</p>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row">
              {!claimMode && (
                <div className="flex-1">
                  <label className="mb-2 block text-sm font-medium text-charcoal">State</label>
                  <select
                    className="w-full rounded-md border border-warm-gray bg-warm-white px-3 py-3 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                    value={stateSlug}
                    onChange={(event) => setStateSlug(event.target.value)}
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

              <div className="relative flex-1">
                <label className="mb-2 block text-sm font-medium text-charcoal">
                  {claimMode ? 'ZIP code' : 'City or ZIP'}
                </label>
                <MapPin className="absolute left-3 top-11 h-5 w-5 text-charcoal/40" />
                <input
                  className="w-full rounded-md border border-warm-gray bg-warm-white py-3 pl-10 pr-4 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  type="text"
                  placeholder={claimMode ? 'e.g., 75201' : `${locationExample.cityState} or ${locationExample.zip}`}
                  value={location}
                  onChange={(event) => handleLocationChange(event.target.value)}
                  onFocus={() => !claimMode && location.trim() && setShowSuggestions(true)}
                  onBlur={() => !claimMode && setTimeout(() => setShowSuggestions(false), 150)}
                />
                {!claimMode && showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-2 w-full rounded-xl border border-warm-gray bg-white text-left shadow-lg">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.type}-${suggestion.label}-${index}`}
                        className="flex w-full items-center justify-between px-4 py-2 text-sm text-charcoal transition-colors hover:bg-warm-gray"
                        onMouseDown={() => handleSuggestionSelect(suggestion)}
                      >
                        <span>{suggestion.label}</span>
                        <span className="text-xs uppercase tracking-[0.2em] text-charcoal/45">
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
                  className="self-end rounded-md border border-warm-gray bg-white px-4 py-3 font-medium text-charcoal transition-colors hover:bg-warm-gray disabled:opacity-60"
                  onClick={handleUseMyLocation}
                  disabled={geoLoading || geoLookupLoading}
                >
                  <span className="inline-flex items-center gap-2">
                    <LocateFixed className="h-4 w-4" />
                    {geoLoading || geoLookupLoading ? 'Locating...' : 'Use my location'}
                  </span>
                </button>
              )}

              <button
                className="self-end rounded-md bg-charcoal px-8 py-3 font-semibold text-white transition-colors hover:bg-black"
                onClick={handleSearch}
              >
                <span className="inline-flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </span>
              </button>
            </div>

            {!claimMode && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-charcoal">Facility name (optional)</label>
                <input
                  className="w-full rounded-md border border-warm-gray bg-warm-white px-4 py-3 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  type="text"
                  placeholder="e.g., Sunrise of San Francisco"
                  value={nameQuery}
                  onChange={(event) => setNameQuery(event.target.value)}
                />
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {claimMode && geoLookupError && <p className="mt-3 text-sm text-amber-700">{geoLookupError}</p>}
            {claimMode && geoError && <p className="mt-3 text-sm text-red-600">{geoError}</p>}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {resultsError && (
          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {resultsError}
          </div>
        )}

        {resultsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <NoResults requestedLocation={searchLocationLabel} />
        ) : (
          <>
            <section className="space-y-6">
              {primaryResults.map((facility) => (
                <SearchResultCard key={facility.id} claimMode={claimMode} facility={facility} />
              ))}
            </section>

            {!claimMode && nearbySections.length > 0 && (
              <section className="mt-16 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-charcoal/55 shadow-sm">
                    Expand your search nearby
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                {nearbySections.map((section) => (
                  <div key={section.key}>
                    <div className="mb-8 flex items-center gap-4">
                      <h3 className="font-serif text-2xl font-semibold text-charcoal">
                        Nearby options in {section.city}
                      </h3>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    <div className="space-y-6">
                      {section.facilities.map((facility) => (
                        <SearchResultCard key={facility.id} facility={facility} />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {!claimMode && (
        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-charcoal">Browse all states</h2>
            <p className="mt-2 text-charcoal/70">
              Prefer to explore the full directory? Jump to the state hub and browse communities city by city.
            </p>
            <button
              className="mt-4 rounded-md bg-charcoal px-6 py-3 font-medium text-white transition-colors hover:bg-black"
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
