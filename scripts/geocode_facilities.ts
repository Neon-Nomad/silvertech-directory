import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

type FacilityRow = {
  id: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
};

type GeoPoint = {
  lat: number;
  lng: number;
};

type CityAccumulator = {
  latSum: number;
  lngSum: number;
  count: number;
};

type StateAccumulator = {
  latSum: number;
  lngSum: number;
  count: number;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const pageSize = Number(process.env.GEOCODE_PAGE_SIZE || 1000);
const maxUpdates = Number(process.env.GEOCODE_MAX || 0);
const requestDelayMs = Number(process.env.GEOCODE_DELAY_MS || 1100);
const userAgent = process.env.GEOCODE_USER_AGENT || 'SilverTechDirectory/1.0 (ops@silvertechdirectory.com)';
const unresolvedAuditPath = path.resolve(process.cwd(), 'artifacts', 'geocode_unresolved.json');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeKeyPart = (value: string | null | undefined): string =>
  (value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const toCityKey = (state: string | null, city: string | null): string =>
  `${normalizeKeyPart(state).toUpperCase()}|${normalizeKeyPart(city)}`;

const toStateKey = (state: string | null): string => normalizeKeyPart(state).toUpperCase();

const addCityPoint = (map: Map<string, CityAccumulator>, state: string | null, city: string | null, point: GeoPoint) => {
  const cityKey = toCityKey(state, city);
  if (!cityKey || cityKey === '|') return;
  if (!map.has(cityKey)) {
    map.set(cityKey, { latSum: 0, lngSum: 0, count: 0 });
  }
  const accumulator = map.get(cityKey)!;
  accumulator.latSum += point.lat;
  accumulator.lngSum += point.lng;
  accumulator.count += 1;
};

const cityCenterFromMap = (map: Map<string, CityAccumulator>, state: string | null, city: string | null): GeoPoint | null => {
  const accumulator = map.get(toCityKey(state, city));
  if (!accumulator || accumulator.count === 0) return null;
  return {
    lat: accumulator.latSum / accumulator.count,
    lng: accumulator.lngSum / accumulator.count,
  };
};

const addStatePoint = (map: Map<string, StateAccumulator>, state: string | null, point: GeoPoint) => {
  const stateKey = toStateKey(state);
  if (!stateKey) return;
  if (!map.has(stateKey)) {
    map.set(stateKey, { latSum: 0, lngSum: 0, count: 0 });
  }
  const accumulator = map.get(stateKey)!;
  accumulator.latSum += point.lat;
  accumulator.lngSum += point.lng;
  accumulator.count += 1;
};

const stateCenterFromMap = (map: Map<string, StateAccumulator>, state: string | null): GeoPoint | null => {
  const accumulator = map.get(toStateKey(state));
  if (!accumulator || accumulator.count === 0) return null;
  return {
    lat: accumulator.latSum / accumulator.count,
    lng: accumulator.lngSum / accumulator.count,
  };
};

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
};

const fuzzyCityCenterFromMap = (
  map: Map<string, CityAccumulator>,
  state: string | null,
  city: string | null,
): GeoPoint | null => {
  const targetState = toStateKey(state);
  const targetCity = normalizeKeyPart(city);
  if (!targetState || !targetCity) return null;

  let bestCity: string | null = null;
  let bestDistance = Number.MAX_SAFE_INTEGER;

  for (const key of map.keys()) {
    const [candidateState, candidateCity] = key.split('|');
    if (candidateState !== targetState || !candidateCity) continue;
    const distance = levenshteinDistance(targetCity, candidateCity);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCity = candidateCity;
      if (distance === 0) break;
    }
  }

  if (!bestCity) return null;
  const maxDistance = Math.max(1, Math.floor(bestCity.length * 0.25));
  if (bestDistance > maxDistance) return null;
  return cityCenterFromMap(map, targetState, bestCity);
};

const isValidGeoPoint = (point: GeoPoint | null): point is GeoPoint =>
  Boolean(
    point &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180,
  );

const geocodeQuery = async (query: string): Promise<GeoPoint | null> => {
  if (!query.trim()) return null;

  try {
    const params = new URLSearchParams({
      format: 'json',
      q: query,
      limit: '1',
      countrycodes: 'us',
    });
    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    if (!data || data.length === 0) return null;

    const lat = Number(data[0].lat);
    const lng = Number(data[0].lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    return null;
  } finally {
    await delay(requestDelayMs);
  }
};

const buildStreetQuery = (facility: FacilityRow): string => {
  const parts = [facility.address_line1, facility.city, facility.state, facility.postal_code]
    .map((part) => (part || '').trim())
    .filter(Boolean);
  return parts.join(', ');
};

const buildCityQuery = (facility: FacilityRow): string => {
  const parts = [facility.city, facility.state]
    .map((part) => (part || '').trim())
    .filter(Boolean);
  return parts.join(', ');
};

const loadFacilitiesWithGeo = async (): Promise<FacilityRow[]> => {
  const rows: FacilityRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,address_line1,city,state,postal_code,latitude,longitude')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = (data || []) as FacilityRow[];
    if (batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
};

const loadFacilitiesMissingGeo = async (): Promise<FacilityRow[]> => {
  const rows: FacilityRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,address_line1,city,state,postal_code,latitude,longitude')
      .or('latitude.is.null,longitude.is.null')
      .order('created_at', { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    const batch = (data || []) as FacilityRow[];
    if (batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return rows;
};

const updateFacilityGeo = async (facilityId: string, point: GeoPoint): Promise<boolean> => {
  const { error } = await supabase
    .from('facilities')
    .update({ latitude: point.lat, longitude: point.lng, updated_at: new Date().toISOString() })
    .eq('id', facilityId);

  return !error;
};

const geocodeFacilities = async () => {
  console.log('Starting geocoding pass (street first, city fallback)...');

  const [existingGeoRows, missingGeoRows] = await Promise.all([
    loadFacilitiesWithGeo(),
    loadFacilitiesMissingGeo(),
  ]);

  console.log(
    `Loaded ${existingGeoRows.length} facilities with existing geo and ${missingGeoRows.length} missing/partial facilities.`,
  );

  const cityCenterMap = new Map<string, CityAccumulator>();
  const stateCenterMap = new Map<string, StateAccumulator>();
  for (const row of existingGeoRows) {
    if (row.latitude === null || row.longitude === null) continue;
    const point = { lat: row.latitude, lng: row.longitude };
    addCityPoint(cityCenterMap, row.state, row.city, point);
    addStatePoint(stateCenterMap, row.state, point);
  }

  const streetCache = new Map<string, GeoPoint | null>();
  const cityCache = new Map<string, GeoPoint | null>();

  let updated = 0;
  let geocodedByStreet = 0;
  let geocodedByCityApi = 0;
  let geocodedByCityCentroid = 0;
  let geocodedByFuzzyCityCentroid = 0;
  let geocodedByStateCentroid = 0;
  let attemptedStreet = 0;
  let attemptedCityApi = 0;
  const unresolved: Array<{
    id: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  }> = [];

  for (let i = 0; i < missingGeoRows.length; i += 1) {
    if (maxUpdates && updated >= maxUpdates) break;

    const facility = missingGeoRows[i];
    const streetQuery = buildStreetQuery(facility);
    const cityQuery = buildCityQuery(facility);

    let bestPoint: GeoPoint | null = null;
    let source: 'street' | 'city-api' | 'city-centroid' | 'fuzzy-city-centroid' | 'state-centroid' | null = null;

    if (streetQuery) {
      attemptedStreet += 1;
      if (!streetCache.has(streetQuery)) {
        streetCache.set(streetQuery, await geocodeQuery(streetQuery));
      }
      const streetResult = streetCache.get(streetQuery) || null;
      if (isValidGeoPoint(streetResult)) {
        bestPoint = streetResult;
        source = 'street';
      }
    }

    if (!bestPoint) {
      const centroid = cityCenterFromMap(cityCenterMap, facility.state, facility.city);
      if (isValidGeoPoint(centroid)) {
        bestPoint = centroid;
        source = 'city-centroid';
      }
    }

    if (!bestPoint && cityQuery) {
      attemptedCityApi += 1;
      if (!cityCache.has(cityQuery)) {
        cityCache.set(cityQuery, await geocodeQuery(cityQuery));
      }
      const cityResult = cityCache.get(cityQuery) || null;
      if (isValidGeoPoint(cityResult)) {
        bestPoint = cityResult;
        source = 'city-api';
      }
    }

    if (!bestPoint) {
      const fuzzyCentroid = fuzzyCityCenterFromMap(cityCenterMap, facility.state, facility.city);
      if (isValidGeoPoint(fuzzyCentroid)) {
        bestPoint = fuzzyCentroid;
        source = 'fuzzy-city-centroid';
      }
    }

    if (!bestPoint) {
      const stateCentroid = stateCenterFromMap(stateCenterMap, facility.state);
      if (isValidGeoPoint(stateCentroid)) {
        bestPoint = stateCentroid;
        source = 'state-centroid';
      }
    }

    if (!bestPoint) {
      unresolved.push({
        id: facility.id,
        address_line1: facility.address_line1,
        city: facility.city,
        state: facility.state,
        postal_code: facility.postal_code,
      });
      continue;
    }

    const updatedOk = await updateFacilityGeo(facility.id, bestPoint);
    if (!updatedOk) {
      unresolved.push({
        id: facility.id,
        address_line1: facility.address_line1,
        city: facility.city,
        state: facility.state,
        postal_code: facility.postal_code,
      });
      continue;
    }

    addCityPoint(cityCenterMap, facility.state, facility.city, bestPoint);
    addStatePoint(stateCenterMap, facility.state, bestPoint);
    updated += 1;
    if (source === 'street') geocodedByStreet += 1;
    if (source === 'city-api') geocodedByCityApi += 1;
    if (source === 'city-centroid') geocodedByCityCentroid += 1;
    if (source === 'fuzzy-city-centroid') geocodedByFuzzyCityCentroid += 1;
    if (source === 'state-centroid') geocodedByStateCentroid += 1;

    if (updated % 50 === 0) {
      console.log(`Progress: updated ${updated}/${missingGeoRows.length} missing facilities.`);
    }
  }

  fs.mkdirSync(path.dirname(unresolvedAuditPath), { recursive: true });
  fs.writeFileSync(unresolvedAuditPath, JSON.stringify(unresolved, null, 2));

  console.log(
    JSON.stringify(
      {
        totalMissingBeforePass: missingGeoRows.length,
        updated,
        geocodedByStreet,
        geocodedByCityApi,
        geocodedByCityCentroid,
        geocodedByFuzzyCityCentroid,
        geocodedByStateCentroid,
        attemptedStreet,
        attemptedCityApi,
        unresolvedCount: unresolved.length,
        unresolvedAuditPath,
      },
      null,
      2,
    ),
  );
};

geocodeFacilities().catch((error) => {
  console.error('Geocode pass failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
