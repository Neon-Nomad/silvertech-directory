import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ALL_STATES } from '../../src/data/states';

export type NormalizedFacility = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  websiteUrl: string | null;
  licenseNumber: string | null;
  licenseExpiration: string | null;
  bedCapacity: number | null;
  careTypes: string[];
  medicareCertified: boolean;
  medicaidCertified: boolean;
  ownershipType: string | null;
  overallRating: number | null;
  certifiedBeds: number | null;
  listingTier: string | null;
  claimedAt: string | null;
  isClaimed: boolean;
};

export type CityStats = {
  totalFacilities: number;
  medicareCertifiedPct: number;
  ownershipSplit: { nonprofit: number; forProfit: number; government: number; unknown: number };
  careTypeCounts: Record<string, number>;
};

export type NearbyCity = {
  city: string;
  state: string;
  slug: string;
  distanceMiles: number;
  facilityCount: number;
};

type NearbyCityCandidate = NearbyCity & {
  hasDistance: boolean;
};

export const CARE_TYPE_SLUGS: Record<string, string> = {
  'assisted-living': 'Assisted Living',
  'memory-care': 'Memory Care',
  'nursing-homes': 'Nursing Home',
  'independent-living': 'Independent Living',
  'residential-care': 'Residential Care Home',
  'adult-day-services': 'Adult Day Services',
  ccrc: 'CCRC',
};

const CARE_TYPE_ALIASES: Record<string, string> = {
  'assisted living': 'assisted-living',
  'memory care': 'memory-care',
  'nursing home': 'nursing-homes',
  'nursing homes': 'nursing-homes',
  'skilled nursing': 'nursing-homes',
  'skilled nursing facility': 'nursing-homes',
  snf: 'nursing-homes',
  'independent living': 'independent-living',
  'residential care home': 'residential-care',
  'residential care': 'residential-care',
  'board and care': 'residential-care',
  'adult day services': 'adult-day-services',
  'adult day care': 'adult-day-services',
  'adult day': 'adult-day-services',
  'life plan community': 'ccrc',
  'continuing care': 'ccrc',
};

type FacilityRow = {
  id: string;
  name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  website_url: string | null;
  state_license_number: string | null;
  cms_certification_number: string | null;
  listing_tier: string | null;
  claimed_at: string | null;
  owner_id: string | null;
  facility_care_types?: Array<{
    care_types?: { name?: string | null; slug?: string | null } | null;
  }>;
};

type FacilityLicensingRow = {
  facility_id: string | null;
  license_number?: string | null;
  license_expiration?: string | null;
  bed_capacity?: number | null;
};

type CanonicalRow = {
  facility_id: string | null;
  canonical_payload: Record<string, unknown> | null;
  last_normalized_at: string | null;
};

type PathSeedRow = {
  state: string | null;
  city: string | null;
  facility_care_types?: Array<{
    care_types?: { name?: string | null; slug?: string | null } | null;
  }>;
};

const STATE_BY_SLUG = new Map(ALL_STATES.map((s) => [s.slug, s.abbreviation]));
const STATE_BY_NAME = new Map(ALL_STATES.map((s) => [s.name.toLowerCase(), s.abbreviation]));
const STATE_SLUG_BY_ABBR = new Map(ALL_STATES.map((s) => [s.abbreviation, s.slug]));

const META_ENV = (import.meta as { env?: Record<string, string | undefined> }).env || {};

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  META_ENV.SUPABASE_URL ||
  META_ENV.VITE_SUPABASE_URL ||
  '';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  META_ENV.SUPABASE_ANON_KEY ||
  META_ENV.VITE_SUPABASE_ANON_KEY ||
  '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  META_ENV.SUPABASE_SERVICE_ROLE_KEY ||
  META_ENV.SUPABASE_SERVICE_KEY ||
  '';

const publicClient: SupabaseClient | null =
  SUPABASE_URL && (SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const serviceClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

let facilitiesCachePromise: Promise<NormalizedFacility[]> | null = null;
let pathSeedCachePromise: Promise<PathSeedRow[]> | null = null;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
};

const normalizeOwnershipType = (value: unknown): string | null => {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('non') && normalized.includes('profit')) return 'nonprofit';
  if (normalized.includes('for') && normalized.includes('profit')) return 'for-profit';
  if (normalized.includes('government') || normalized.includes('county') || normalized.includes('state')) {
    return 'government';
  }
  return null;
};

const normalizeCareTypeSlug = (rawName: string): string | null => {
  const normalized = rawName.trim().toLowerCase();
  if (!normalized) return null;
  if (CARE_TYPE_ALIASES[normalized]) return CARE_TYPE_ALIASES[normalized];

  const slug = slugify(normalized);
  if (CARE_TYPE_SLUGS[slug]) return slug;

  if (slug.includes('memory')) return 'memory-care';
  if (slug.includes('nursing') || slug.includes('skilled')) return 'nursing-homes';
  if (slug.includes('independent')) return 'independent-living';
  if (slug.includes('residential') || slug.includes('board-care')) return 'residential-care';
  if (slug.includes('adult-day')) return 'adult-day-services';
  if (slug.includes('ccrc') || slug.includes('life-plan') || slug.includes('continuing-care')) return 'ccrc';
  if (slug.includes('assisted')) return 'assisted-living';

  return null;
};

const normalizeStateAbbr = (stateInput: string): string => {
  const value = stateInput.trim();
  if (!value) return '';
  if (value.length === 2) return value.toUpperCase();
  const bySlug = STATE_BY_SLUG.get(value.toLowerCase());
  if (bySlug) return bySlug;
  const byName = STATE_BY_NAME.get(value.toLowerCase());
  if (byName) return byName;
  return value.toUpperCase();
};

const toStateSlug = (stateAbbr: string): string => {
  const slug = STATE_SLUG_BY_ABBR.get(stateAbbr.toUpperCase());
  return slug || slugify(stateAbbr);
};

const pickLicenseRow = (rows: FacilityLicensingRow[] | undefined): FacilityLicensingRow | null => {
  if (!rows || rows.length === 0) return null;
  const withLicense = rows.find((row) => row.license_number);
  return withLicense || rows[0];
};

const normalizeFacility = (
  row: FacilityRow,
  canonicalPayload: Record<string, unknown> | null,
  licensingRows: FacilityLicensingRow[] | undefined,
): NormalizedFacility => {
  const license = pickLicenseRow(licensingRows);
  const careTypeNames = (row.facility_care_types || [])
    .map((item) => item.care_types?.slug || item.care_types?.name || '')
    .filter((name): name is string => Boolean(name));
  const careTypes = Array.from(
    new Set(careTypeNames.map(normalizeCareTypeSlug).filter((value): value is string => Boolean(value))),
  );

  const ownershipType = normalizeOwnershipType(canonicalPayload?.ownership_type);
  const addressParts = [row.address_line1 || '', row.address_line2 || ''].filter(Boolean);
  const address = addressParts.join(', ').trim();

  return {
    id: row.id,
    name: row.name || '',
    address,
    city: row.city || '',
    state: (row.state || '').toUpperCase(),
    postalCode: row.postal_code || '',
    latitude: toNumber(row.latitude),
    longitude: toNumber(row.longitude),
    phone: row.phone || null,
    websiteUrl: row.website_url || row.website || null,
    licenseNumber: license?.license_number || row.state_license_number || null,
    licenseExpiration: license?.license_expiration || null,
    bedCapacity: toNumber(license?.bed_capacity),
    careTypes,
    medicareCertified: toBoolean(canonicalPayload?.medicare_certified, Boolean(row.cms_certification_number)),
    medicaidCertified: toBoolean(canonicalPayload?.medicaid_certified, false),
    ownershipType,
    overallRating: toNumber(canonicalPayload?.overall_rating),
    certifiedBeds: toNumber(canonicalPayload?.certified_beds),
    listingTier: row.listing_tier || null,
    claimedAt: row.claimed_at || null,
    isClaimed: Boolean(row.claimed_at || row.owner_id),
  };
};

const fetchCanonicalByFacilityIds = async (facilityIds: string[]): Promise<Map<string, Record<string, unknown>>> => {
  const out = new Map<string, Record<string, unknown>>();
  if (!serviceClient || facilityIds.length === 0) return out;

  const chunkSize = 200;
  for (let i = 0; i < facilityIds.length; i += chunkSize) {
    const chunk = facilityIds.slice(i, i + chunkSize);
    const { data, error } = await serviceClient
      .from('canonical_facility_records')
      .select('facility_id,canonical_payload,last_normalized_at')
      .in('facility_id', chunk)
      .order('last_normalized_at', { ascending: false });

    if (error) {
      return out;
    }

    for (const row of (data || []) as CanonicalRow[]) {
      const facilityId = row.facility_id || '';
      if (!facilityId || out.has(facilityId)) continue;
      out.set(facilityId, (row.canonical_payload || {}) as Record<string, unknown>);
    }
  }

  return out;
};

const fetchLicensingByFacilityIds = async (
  facilityIds: string[],
): Promise<Map<string, FacilityLicensingRow[]>> => {
  const out = new Map<string, FacilityLicensingRow[]>();
  if (!publicClient || facilityIds.length === 0) return out;

  const chunkSize = 200;
  for (let i = 0; i < facilityIds.length; i += chunkSize) {
    const chunk = facilityIds.slice(i, i + chunkSize);
    const { data, error } = await publicClient
      .from('facility_licensing')
      .select('facility_id,license_number,license_expiration,bed_capacity')
      .in('facility_id', chunk);

    if (error) continue;

    for (const row of (data || []) as FacilityLicensingRow[]) {
      const facilityId = row.facility_id || '';
      if (!facilityId) continue;
      if (!out.has(facilityId)) out.set(facilityId, []);
      out.get(facilityId)!.push(row);
    }
  }

  return out;
};

const loadAllFacilities = async (): Promise<NormalizedFacility[]> => {
  if (!publicClient) return [];

  const pageSize = 1000;
  const allRows: FacilityRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await publicClient
      .from('facilities')
      .select(
        `
          id,
          name,
          address_line1,
          address_line2,
          city,
          state,
          postal_code,
          latitude,
          longitude,
          phone,
          website,
          website_url,
          state_license_number,
          cms_certification_number,
          listing_tier,
          claimed_at,
          owner_id,
          facility_care_types(
            care_types(name,slug)
          )
        `,
      )
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = (data || []) as FacilityRow[];
    if (rows.length === 0) break;
    allRows.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  const licensingByFacility = await fetchLicensingByFacilityIds(allRows.map((row) => row.id));
  const canonicalByFacility = await fetchCanonicalByFacilityIds(allRows.map((row) => row.id));
  return allRows.map((row) =>
    normalizeFacility(
      row,
      canonicalByFacility.get(row.id) || null,
      licensingByFacility.get(row.id),
    ),
  );
};

const getAllFacilitiesCached = async (): Promise<NormalizedFacility[]> => {
  if (!facilitiesCachePromise) {
    facilitiesCachePromise = loadAllFacilities().catch((error) => {
      facilitiesCachePromise = null;
      throw error;
    });
  }
  return facilitiesCachePromise;
};

const loadPathSeedRows = async (): Promise<PathSeedRow[]> => {
  if (!publicClient) return [];

  const pageSize = 1000;
  const out: PathSeedRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await publicClient
      .from('facilities')
      .select(
        `
          state,
          city,
          facility_care_types(
            care_types(name,slug)
          )
        `,
      )
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const rows = (data || []) as PathSeedRow[];
    if (rows.length === 0) break;
    out.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return out;
};

const getPathSeedRowsCached = async (): Promise<PathSeedRow[]> => {
  if (!pathSeedCachePromise) {
    pathSeedCachePromise = loadPathSeedRows().catch((error) => {
      pathSeedCachePromise = null;
      throw error;
    });
  }
  return pathSeedCachePromise;
};

const byState = (facilities: NormalizedFacility[], stateInput: string): NormalizedFacility[] => {
  const stateAbbr = normalizeStateAbbr(stateInput);
  return facilities.filter((facility) => facility.state.toUpperCase() === stateAbbr);
};

const byCity = (facilities: NormalizedFacility[], cityInput: string): NormalizedFacility[] => {
  const citySlug = slugify(cityInput);
  return facilities.filter((facility) => slugify(facility.city) === citySlug);
};

const byCareType = (facilities: NormalizedFacility[], careTypeSlug: string): NormalizedFacility[] => {
  const normalized = normalizeCareTypeSlug(careTypeSlug) || careTypeSlug;
  return facilities.filter((facility) => facility.careTypes.includes(normalized));
};

const round1 = (value: number): number => Math.round(value * 10) / 10;

const haversineMiles = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusMiles * c;
};

type CityAccumulator = {
  city: string;
  state: string;
  slug: string;
  facilityCount: number;
  latSum: number;
  lngSum: number;
  geoCount: number;
};

const buildCityMap = (facilities: NormalizedFacility[]): Map<string, CityAccumulator> => {
  const cityMap = new Map<string, CityAccumulator>();
  for (const facility of facilities) {
    const citySlug = slugify(facility.city);
    if (!facility.state || !citySlug) continue;
    const key = `${facility.state}|${slugify(facility.city)}`;
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        city: facility.city,
        state: facility.state,
        slug: citySlug,
        facilityCount: 0,
        latSum: 0,
        lngSum: 0,
        geoCount: 0,
      });
    }
    const entry = cityMap.get(key)!;
    entry.facilityCount += 1;
    if (facility.latitude !== null && facility.longitude !== null) {
      entry.latSum += facility.latitude;
      entry.lngSum += facility.longitude;
      entry.geoCount += 1;
    }
  }
  return cityMap;
};

export async function getFacilitiesByCityAndCareType(
  state: string,
  city: string,
  careTypeSlug: string,
): Promise<NormalizedFacility[]> {
  const all = await getAllFacilitiesCached();
  return byCareType(byCity(byState(all, state), city), careTypeSlug);
}

export async function getFacilitiesByCity(state: string, city: string): Promise<NormalizedFacility[]> {
  const all = await getAllFacilitiesCached();
  return byCity(byState(all, state), city);
}

export async function getFacilitiesByState(state: string): Promise<NormalizedFacility[]> {
  const all = await getAllFacilitiesCached();
  return byState(all, state);
}

export async function getCityStats(
  state: string,
  city: string,
  careTypeSlug?: string,
): Promise<CityStats> {
  const facilities = careTypeSlug
    ? await getFacilitiesByCityAndCareType(state, city, careTypeSlug)
    : await getFacilitiesByCity(state, city);

  const totalFacilities = facilities.length;
  const medicareCertifiedCount = facilities.filter((facility) => facility.medicareCertified).length;

  const ownershipSplit = {
    nonprofit: 0,
    forProfit: 0,
    government: 0,
    unknown: 0,
  };

  const careTypeCounts: Record<string, number> = {};
  for (const facility of facilities) {
    if (facility.ownershipType === 'nonprofit') ownershipSplit.nonprofit += 1;
    else if (facility.ownershipType === 'for-profit') ownershipSplit.forProfit += 1;
    else if (facility.ownershipType === 'government') ownershipSplit.government += 1;
    else ownershipSplit.unknown += 1;

    for (const careType of facility.careTypes) {
      careTypeCounts[careType] = (careTypeCounts[careType] || 0) + 1;
    }
  }

  return {
    totalFacilities,
    medicareCertifiedPct: totalFacilities === 0 ? 0 : round1((medicareCertifiedCount / totalFacilities) * 100),
    ownershipSplit,
    careTypeCounts,
  };
}

export async function getNearbyCities(
  state: string,
  city: string,
  careTypeSlug?: string,
): Promise<NearbyCity[]> {
  const stateFacilities = await getFacilitiesByState(state);
  const scopedFacilities = careTypeSlug ? byCareType(stateFacilities, careTypeSlug) : stateFacilities;
  const allCityMap = buildCityMap(stateFacilities);
  const scopedCityMap = buildCityMap(scopedFacilities);

  const targetKey = `${normalizeStateAbbr(state)}|${slugify(city)}`;
  const target = allCityMap.get(targetKey);
  if (!target) return [];

  const targetCenter =
    target.geoCount > 0
      ? { latitude: target.latSum / target.geoCount, longitude: target.lngSum / target.geoCount }
      : null;

  const out: NearbyCityCandidate[] = [];
  for (const [key, entry] of scopedCityMap.entries()) {
    if (key === targetKey) continue;

    const center =
      entry.geoCount > 0
        ? { latitude: entry.latSum / entry.geoCount, longitude: entry.lngSum / entry.geoCount }
        : null;

    const hasDistance = Boolean(targetCenter && center);
    const distanceMiles = hasDistance ? round1(haversineMiles(targetCenter!, center!)) : 9999;

    out.push({
      city: entry.city,
      state: toStateSlug(entry.state),
      slug: entry.slug,
      distanceMiles,
      facilityCount: entry.facilityCount,
      hasDistance,
    });
  }

  out.sort((a, b) => {
    if (a.hasDistance !== b.hasDistance) return a.hasDistance ? -1 : 1;
    if (a.distanceMiles !== b.distanceMiles) return a.distanceMiles - b.distanceMiles;
    if (!a.hasDistance && !b.hasDistance) return a.city.localeCompare(b.city);
    if (b.facilityCount !== a.facilityCount) return b.facilityCount - a.facilityCount;
    return a.city.localeCompare(b.city);
  });

  return out.slice(0, 5).map(({ hasDistance: _hasDistance, ...cityItem }) => cityItem);
}

export async function getAllCityCareCombos(): Promise<
  { state: string; city: string; careTypeSlug: string }[]
> {
  const rows = await getPathSeedRowsCached();
  const combos = new Map<string, { state: string; city: string; careTypeSlug: string }>();

  for (const row of rows) {
    const stateSlug = toStateSlug((row.state || '').toUpperCase());
    const citySlug = slugify(row.city || '');
    if (!stateSlug || !citySlug) continue;
    const careTypeNames = (row.facility_care_types || [])
      .map((item) => item.care_types?.slug || item.care_types?.name || '')
      .filter((value): value is string => Boolean(value));
    const careTypeSlugs = Array.from(
      new Set(careTypeNames.map(normalizeCareTypeSlug).filter((value): value is string => Boolean(value))),
    );
    for (const careTypeSlug of careTypeSlugs) {
      if (!careTypeSlug) continue;
      const key = `${stateSlug}|${citySlug}|${careTypeSlug}`;
      if (!combos.has(key)) {
        combos.set(key, { state: stateSlug, city: citySlug, careTypeSlug });
      }
    }
  }

  return Array.from(combos.values()).sort((a, b) =>
    `${a.state}/${a.city}/${a.careTypeSlug}`.localeCompare(`${b.state}/${b.city}/${b.careTypeSlug}`),
  );
}

export async function getAllCities(): Promise<{ state: string; city: string }[]> {
  const rows = await getPathSeedRowsCached();
  const cities = new Map<string, { state: string; city: string }>();

  for (const row of rows) {
    const stateSlug = toStateSlug((row.state || '').toUpperCase());
    const citySlug = slugify(row.city || '');
    if (!stateSlug || !citySlug) continue;
    const key = `${stateSlug}|${citySlug}`;
    if (!cities.has(key)) cities.set(key, { state: stateSlug, city: citySlug });
  }

  return Array.from(cities.values()).sort((a, b) => `${a.state}/${a.city}`.localeCompare(`${b.state}/${b.city}`));
}

export async function getAllStates(): Promise<string[]> {
  const rows = await getPathSeedRowsCached();
  const states = new Set<string>();
  for (const row of rows) {
    const slug = toStateSlug((row.state || '').toUpperCase());
    if (slug) states.add(slug);
  }
  return Array.from(states).sort((a, b) => a.localeCompare(b));
}

export function resetSeniorDataContractCacheForTests(): void {
  facilitiesCachePromise = null;
  pathSeedCachePromise = null;
}
