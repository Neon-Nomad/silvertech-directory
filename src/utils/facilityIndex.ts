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
