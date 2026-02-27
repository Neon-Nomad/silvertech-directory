export type FacilityIndexItem = {
  id: string;
  name: string;
  city: string;
  state: string;
  address_line1?: string;
  postal_code?: string;
  phone?: string;
  website_url?: string;
  google_maps_url?: string;
  verified_phone?: string;
  business_status?: string;
  online_presence_updated_at?: string;
};

export type CityIndexEntry = {
  stateSlug: string;
  citySlug: string;
  stateAbbr: string;
  stateName: string;
  cityName: string;
  count: number;
};

let facilityIndexCache: FacilityIndexItem[] | null = null;
const facilityStateShardCache = new Map<string, FacilityIndexItem[]>();
const missingFacilityShards = new Set<string>();
let cityIndexCache: CityIndexEntry[] | null = null;

const fetchJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const loadFacilityIndex = async (): Promise<FacilityIndexItem[]> => {
  if (facilityIndexCache) return facilityIndexCache;
  facilityIndexCache = await fetchJson<FacilityIndexItem[]>('/facilities_index.json');
  return facilityIndexCache;
};

type FacilityIndexLoadOptions = {
  stateAbbr?: string | null;
};

const loadFacilityIndexShard = async (stateAbbr: string): Promise<FacilityIndexItem[] | null> => {
  const key = stateAbbr.trim().toUpperCase();
  if (!key || missingFacilityShards.has(key)) return null;
  const cached = facilityStateShardCache.get(key);
  if (cached) return cached;

  try {
    const shard = await fetchJson<FacilityIndexItem[]>(`/facilities_index_shards/${key}.json`);
    facilityStateShardCache.set(key, shard);
    return shard;
  } catch (error: any) {
    if (String(error?.message || '').includes('404')) {
      missingFacilityShards.add(key);
      return null;
    }
    throw error;
  }
};

export const loadFacilityIndexWithOptions = async (
  options?: FacilityIndexLoadOptions
): Promise<FacilityIndexItem[]> => {
  const stateAbbr = options?.stateAbbr?.trim();
  if (stateAbbr) {
    const shard = await loadFacilityIndexShard(stateAbbr);
    if (shard) return shard;
  }
  return loadFacilityIndex();
};

export const loadCityIndex = async (): Promise<CityIndexEntry[]> => {
  if (cityIndexCache) return cityIndexCache;
  cityIndexCache = await fetchJson<CityIndexEntry[]>('/city_index.json');
  return cityIndexCache;
};

const normalizeField = (v?: string | null) =>
  (v || '').toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '');

/**
 * Given a facility object (typically from Supabase with a UUID id),
 * look up its canonical slug from the facility index.
 * Returns the slug string, or the original id if no match is found.
 */
export const resolveSlug = async (
  facility: { id: string; name?: string | null; city?: string | null; state?: string | null; postal_code?: string | null }
): Promise<string> => {
  try {
    const index = await loadFacilityIndexWithOptions({ stateAbbr: facility.state });
    const match = index.find(
      (entry) =>
        normalizeField(entry.name) === normalizeField(facility.name) &&
        normalizeField(entry.city) === normalizeField(facility.city) &&
        (entry.state || '').trim().toUpperCase() === (facility.state || '').trim().toUpperCase() &&
        (entry.postal_code || '').trim() === (facility.postal_code || '').trim()
    );
    return match ? match.id : facility.id;
  } catch {
    return facility.id;
  }
};

/**
 * Batch-resolve slugs for an array of facilities.
 * Loads the index once per state and resolves all matches.
 */
export const resolveSlugs = async <T extends { id: string; name?: string | null; city?: string | null; state?: string | null; postal_code?: string | null }>(
  facilities: T[]
): Promise<T[]> => {
  if (facilities.length === 0) return facilities;

  // Group by state to load each shard only once
  const states = new Set(facilities.map((f) => (f.state || '').trim().toUpperCase()).filter(Boolean));
  const indexByState = new Map<string, FacilityIndexItem[]>();

  await Promise.all(
    Array.from(states).map(async (stateAbbr) => {
      try {
        const index = await loadFacilityIndexWithOptions({ stateAbbr });
        indexByState.set(stateAbbr, index);
      } catch {
        // skip — facilities in this state will keep their original id
      }
    })
  );

  return facilities.map((facility) => {
    const stateKey = (facility.state || '').trim().toUpperCase();
    const index = indexByState.get(stateKey);
    if (!index) return facility;

    const match = index.find(
      (entry) =>
        normalizeField(entry.name) === normalizeField(facility.name) &&
        normalizeField(entry.city) === normalizeField(facility.city) &&
        (entry.state || '').trim().toUpperCase() === stateKey &&
        (entry.postal_code || '').trim() === (facility.postal_code || '').trim()
    );

    return match ? { ...facility, id: match.id } : facility;
  });
};

export const filterFacilitiesByLocation = (
  facilities: FacilityIndexItem[],
  stateAbbr: string,
  cityName?: string
) => {
  const state = stateAbbr.trim().toLowerCase();
  const city = cityName?.trim().toLowerCase();
  return facilities.filter((f) => {
    if (!f.state) return false;
    if (f.state.trim().toLowerCase() !== state) return false;
    if (!city) return true;
    return (f.city || '').trim().toLowerCase() === city;
  });
};
