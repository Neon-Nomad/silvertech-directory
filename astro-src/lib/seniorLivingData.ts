import fs from 'node:fs';
import path from 'node:path';
import { ALL_STATES } from '../../src/data/states';
import { cityContent } from '../../src/data/city_content';

export type CareTypeSlug =
  | 'assisted-living'
  | 'memory-care'
  | 'nursing-homes'
  | 'independent-living'
  | 'residential-care'
  | 'adult-day-services'
  | 'ccrc';

export type CareTypeDefinition = {
  slug: CareTypeSlug;
  label: string;
  shortLabel: string;
  mapColor: string;
  badgeColorClass: string;
  aliases: string[];
};

export type HospitalRecord = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  type?: string;
  ownership?: string;
  emergency_services?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type FacilityRecord = {
  id: string;
  publicSlug: string;
  publicRouteId: number;
  name: string;
  city: string;
  citySlug: string;
  state: string;
  stateSlug: string;
  stateName: string;
  street: string;
  zip: string;
  county: string;
  phone: string;
  verifiedPhone: string;
  email: string;
  websiteUrl: string;
  googleMapsUrl: string;
  listingTier: string;
  businessStatus: string;
  onlinePresenceUpdatedAt: string;
  beds: number | null;
  ownershipType: string;
  ownershipBucket: 'for_profit' | 'non_profit' | 'government' | 'other';
  latitude: number | null;
  longitude: number | null;
  licenseNumber: string;
  cmsCertificationNumber: string;
  issuingAgency: string;
  licenseType: string;
  lastVerifiedDate: string;
  dataSource: string;
  careTypes: CareTypeSlug[];
  primaryCareType: CareTypeSlug;
  hasProfile: boolean;
};

export type StatsBundle = {
  totalFacilities: number;
  withPhone: number;
  withWebsite: number;
  phoneCoveragePct: number;
  websiteCoveragePct: number;
  medicareCertifiedPct: number;
  ownershipSplitPct: {
    forProfit: number;
    nonProfit: number;
    government: number;
    other: number;
  };
  dominantCareType: CareTypeSlug;
  careTypeCounts: Record<CareTypeSlug, number>;
  topZips: string[];
};

export type CitySummary = {
  key: string;
  cityName: string;
  citySlug: string;
  stateAbbr: string;
  stateSlug: string;
  stateName: string;
  county: string;
  facilities: FacilityRecord[];
  facilityCount: number;
  careTypeCounts: Record<CareTypeSlug, number>;
  center: { lat: number; lng: number } | null;
  topZips: string[];
  nearbyCities: Array<{
    cityName: string;
    citySlug: string;
    stateSlug: string;
    stateAbbr: string;
    distanceMiles: number | null;
    facilityCount: number;
  }>;
  richContent:
    | {
        intro: string;
        demographics: { seniorPopulation: string; averageAge: string; costOfLiving: string };
        hospitals: string[];
        localResources: string[];
      }
    | undefined;
  stats: StatsBundle;
};

export type StateSummary = {
  stateName: string;
  stateAbbr: string;
  stateSlug: string;
  facilities: FacilityRecord[];
  facilityCount: number;
  cityCount: number;
  cities: CitySummary[];
  topCities: CitySummary[];
  stats: StatsBundle;
};

export type RegulatoryContext = {
  licensing: {
    agencyName: string;
    websiteUrl: string;
    phone: string;
    complaintIntakeUrl: string;
    verifyLicenseUrl: string;
  } | null;
  ombudsman: {
    programName: string;
    phone: string;
    website: string;
    email: string;
  } | null;
  medicaid: {
    programName: string;
    status: string;
    description: string;
    website: string;
    phone: string;
  } | null;
  agingAgency: {
    programName: string;
    website: string;
    phone: string;
    findLocalUrl: string;
  } | null;
};

type SeniorLivingStore = {
  facilities: FacilityRecord[];
  states: StateSummary[];
  stateBySlug: Map<string, StateSummary>;
  cityByKey: Map<string, CitySummary>;
};

const CARE_TYPES: CareTypeDefinition[] = [
  {
    slug: 'assisted-living',
    label: 'Assisted Living',
    shortLabel: 'Assisted',
    mapColor: '#2e7d32',
    badgeColorClass: 'care-assisted',
    aliases: ['assisted living', 'assisted'],
  },
  {
    slug: 'memory-care',
    label: 'Memory Care',
    shortLabel: 'Memory',
    mapColor: '#1e88e5',
    badgeColorClass: 'care-memory',
    aliases: ['memory care', 'dementia', 'alzheim'],
  },
  {
    slug: 'nursing-homes',
    label: 'Nursing Homes / Skilled Nursing',
    shortLabel: 'Skilled Nursing',
    mapColor: '#e53935',
    badgeColorClass: 'care-nursing',
    aliases: ['nursing home', 'skilled nursing', 'snf', 'nursing'],
  },
  {
    slug: 'independent-living',
    label: 'Independent Living',
    shortLabel: 'Independent',
    mapColor: '#8e24aa',
    badgeColorClass: 'care-independent',
    aliases: ['independent living', 'independent'],
  },
  {
    slug: 'residential-care',
    label: 'Residential Care Home',
    shortLabel: 'Residential Care',
    mapColor: '#fb8c00',
    badgeColorClass: 'care-residential',
    aliases: ['residential care home', 'board and care', 'residential care'],
  },
  {
    slug: 'adult-day-services',
    label: 'Adult Day Services',
    shortLabel: 'Adult Day',
    mapColor: '#00acc1',
    badgeColorClass: 'care-adult-day',
    aliases: ['adult day', 'adult day services', 'adult day care'],
  },
  {
    slug: 'ccrc',
    label: 'CCRC / Life Plan Community',
    shortLabel: 'CCRC',
    mapColor: '#6d4c41',
    badgeColorClass: 'care-ccrc',
    aliases: ['ccrc', 'life plan', 'continuing care'],
  },
];

const CARE_TYPE_BY_SLUG = new Map(CARE_TYPES.map((item) => [item.slug, item]));
const STATE_BY_ABBR = new Map(ALL_STATES.map((item) => [item.abbreviation, item]));
const STATE_BY_NAME = new Map(ALL_STATES.map((item) => [item.name.toLowerCase(), item]));

const COST_BANDS: Record<CareTypeSlug, { low: number; high: number }> = {
  'assisted-living': { low: 3800, high: 5200 },
  'memory-care': { low: 4800, high: 6900 },
  'nursing-homes': { low: 8500, high: 11200 },
  'independent-living': { low: 2500, high: 4200 },
  'residential-care': { low: 3200, high: 4800 },
  'adult-day-services': { low: 1300, high: 3000 },
  ccrc: { low: 3500, high: 7000 },
};

let storeCache: SeniorLivingStore | null = null;
const hospitalsByStateCache = new Map<string, Record<string, HospitalRecord[]>>();
let licensingCache: Array<Record<string, string>> | null = null;
let ombudsmanCache: Record<string, Record<string, string>> | null = null;
let medicaidCache: Array<Record<string, any>> | null = null;
let agingAgencyCache: Array<Record<string, any>> | null = null;
let warnedMissingCsv = false;

const ROOT = process.cwd();

const emptyCareCounts = (): Record<CareTypeSlug, number> => ({
  'assisted-living': 0,
  'memory-care': 0,
  'nursing-homes': 0,
  'independent-living': 0,
  'residential-care': 0,
  'adult-day-services': 0,
  ccrc: 0,
});

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');

const parseMaybeNumber = (value: string): number | null => {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const detectOwnershipBucket = (
  rawValue: string,
): 'for_profit' | 'non_profit' | 'government' | 'other' => {
  const value = rawValue.toLowerCase();
  if (value.includes('for profit')) return 'for_profit';
  if (value.includes('non profit') || value.includes('non-profit')) return 'non_profit';
  if (value.includes('government')) return 'government';
  return 'other';
};

const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && inQuotes && line[i + 1] === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  fields.push(current);
  return fields;
};

const hashString = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

const resolveState = (
  stateAbbrRaw: string,
  stateNameRaw: string,
): { abbr: string; name: string; slug: string } | null => {
  const directAbbr = stateAbbrRaw.trim().toUpperCase();
  if (directAbbr && STATE_BY_ABBR.has(directAbbr)) {
    const state = STATE_BY_ABBR.get(directAbbr)!;
    return { abbr: state.abbreviation, name: state.name, slug: state.slug };
  }

  const stateByName = STATE_BY_NAME.get(stateNameRaw.trim().toLowerCase());
  if (stateByName) {
    return { abbr: stateByName.abbreviation, name: stateByName.name, slug: stateByName.slug };
  }
  return null;
};

const toFacilityMatchKey = (
  name: string,
  city: string,
  state: string,
  street: string,
  zip: string,
  phone = '',
): string =>
  [
    normalize(name),
    normalize(city),
    normalize(state),
    normalize(street),
    normalize(zip),
    normalize(phone),
  ].join('|');

const inferCareType = (rawValue: string): CareTypeSlug => {
  const value = rawValue.toLowerCase();
  if (value.includes('memory') || value.includes('dementia') || value.includes('alzheim')) return 'memory-care';
  if (value.includes('skilled') || value.includes('nursing') || value.includes('snf')) return 'nursing-homes';
  if (value.includes('independent')) return 'independent-living';
  if (value.includes('residential') || value.includes('board and care')) return 'residential-care';
  if (value.includes('adult day')) return 'adult-day-services';
  if (value.includes('ccrc') || value.includes('life plan') || value.includes('continuing care')) return 'ccrc';
  return 'assisted-living';
};

const readJsonFile = <T>(relativePath: string): T | null => {
  const targetPath = path.resolve(ROOT, relativePath);
  if (!fs.existsSync(targetPath)) return null;
  return JSON.parse(fs.readFileSync(targetPath, 'utf-8')) as T;
};

const loadFacilitiesIndex = (): Array<Record<string, any>> =>
  readJsonFile<Array<Record<string, any>>>('public/facilities_index.json') || [];

const roundPct = (value: number): number => Math.round(value * 10) / 10;

const computeStats = (facilities: FacilityRecord[]): StatsBundle => {
  const careCounts = emptyCareCounts();
  let withPhone = 0;
  let withWebsite = 0;
  let medicareCertified = 0;
  let forProfit = 0;
  let nonProfit = 0;
  let government = 0;
  let other = 0;
  const zipCounts = new Map<string, number>();

  for (const facility of facilities) {
    for (const care of facility.careTypes) careCounts[care] += 1;
    if (facility.phone || facility.verifiedPhone) withPhone += 1;
    if (facility.websiteUrl) withWebsite += 1;
    if (facility.cmsCertificationNumber) medicareCertified += 1;
    if (facility.zip) zipCounts.set(facility.zip, (zipCounts.get(facility.zip) || 0) + 1);

    if (facility.ownershipBucket === 'for_profit') forProfit += 1;
    else if (facility.ownershipBucket === 'non_profit') nonProfit += 1;
    else if (facility.ownershipBucket === 'government') government += 1;
    else other += 1;
  }

  const total = facilities.length || 1;
  const dominantCareType = (Object.keys(careCounts) as CareTypeSlug[]).sort(
    (a, b) => careCounts[b] - careCounts[a],
  )[0];
  const topZips = Array.from(zipCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([zip]) => zip);

  return {
    totalFacilities: facilities.length,
    withPhone,
    withWebsite,
    phoneCoveragePct: roundPct((withPhone / total) * 100),
    websiteCoveragePct: roundPct((withWebsite / total) * 100),
    medicareCertifiedPct: roundPct((medicareCertified / total) * 100),
    ownershipSplitPct: {
      forProfit: roundPct((forProfit / total) * 100),
      nonProfit: roundPct((nonProfit / total) * 100),
      government: roundPct((government / total) * 100),
      other: roundPct((other / total) * 100),
    },
    dominantCareType,
    careTypeCounts: careCounts,
    topZips,
  };
};

const toMiles = (km: number): number => km * 0.621371;

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const ensureStore = (): SeniorLivingStore => {
  if (storeCache) return storeCache;

  const csvPath = path.resolve(ROOT, 'all_senior_living_complete.csv');
  if (!fs.existsSync(csvPath)) {
    if (!warnedMissingCsv) {
      console.warn(
        '[seniorLivingData] all_senior_living_complete.csv not found; using empty local store and route-level DB fallback.',
      );
      warnedMissingCsv = true;
    }
    storeCache = { facilities: [], states: [], stateBySlug: new Map(), cityByKey: new Map() };
    return storeCache;
  }

  const rawCsv = fs.readFileSync(csvPath, 'utf-8');
  const lines = rawCsv.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) {
    storeCache = { facilities: [], states: [], stateBySlug: new Map(), cityByKey: new Map() };
    return storeCache;
  }

  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let i = 0; i < header.length; i += 1) {
      row[header[i]] = (values[i] || '').trim();
    }
    return row;
  });

  const enrichedIndex = loadFacilitiesIndex();
  const enrichedStrict = new Map<string, Record<string, any>[]>();
  const enrichedLoose = new Map<string, Record<string, any>[]>();
  for (const entry of enrichedIndex) {
    const strictKey = toFacilityMatchKey(
      entry.name || '',
      entry.city || '',
      entry.state || '',
      entry.address_line1 || '',
      entry.postal_code || '',
      entry.phone || '',
    );
    const looseKey = toFacilityMatchKey(
      entry.name || '',
      entry.city || '',
      entry.state || '',
      entry.address_line1 || '',
      entry.postal_code || '',
      '',
    );
    if (!enrichedStrict.has(strictKey)) enrichedStrict.set(strictKey, []);
    if (!enrichedLoose.has(looseKey)) enrichedLoose.set(looseKey, []);
    enrichedStrict.get(strictKey)!.push(entry);
    enrichedLoose.get(looseKey)!.push(entry);
  }

  const aggregated = new Map<
    string,
    Omit<FacilityRecord, 'id' | 'publicSlug' | 'publicRouteId' | 'careTypes' | 'primaryCareType'> & {
      careTypeSet: Set<CareTypeSlug>;
    }
  >();

  for (const row of rows) {
    const name = row.name || '';
    const city = row.city || '';
    const street = row.street || '';
    const zip = row.zip || '';
    const stateResolved = resolveState(row.state_abbr || '', row.state || '');
    if (!name || !city || !stateResolved) continue;

    const key = toFacilityMatchKey(name, city, stateResolved.abbr, street, zip, row.phone || '');
    const careType = inferCareType(row.care_type || row.license_type || '');

    const existing = aggregated.get(key);
    if (existing) {
      existing.careTypeSet.add(careType);
      if (!existing.phone && row.phone) existing.phone = row.phone;
      if (!existing.email && row.email) existing.email = row.email;
      if (!existing.county && row.county) existing.county = row.county;
      if (!existing.beds && row.beds) existing.beds = parseMaybeNumber(row.beds);
      if (!existing.latitude && row.latitude) existing.latitude = parseMaybeNumber(row.latitude);
      if (!existing.longitude && row.longitude) existing.longitude = parseMaybeNumber(row.longitude);
      if (!existing.licenseNumber && row.state_license_number) existing.licenseNumber = row.state_license_number;
      continue;
    }

    aggregated.set(key, {
      name,
      city,
      citySlug: slugify(city),
      state: stateResolved.abbr,
      stateSlug: stateResolved.slug,
      stateName: stateResolved.name,
      street,
      zip,
      county: row.county || '',
      phone: row.phone || '',
      verifiedPhone: '',
      email: row.email || '',
      websiteUrl: '',
      googleMapsUrl: '',
      listingTier: '',
      businessStatus: '',
      onlinePresenceUpdatedAt: '',
      beds: parseMaybeNumber(row.beds || ''),
      ownershipType: row.ownership_type || '',
      ownershipBucket: detectOwnershipBucket(row.ownership_type || ''),
      latitude: parseMaybeNumber(row.latitude || ''),
      longitude: parseMaybeNumber(row.longitude || ''),
      licenseNumber: row.state_license_number || '',
      cmsCertificationNumber: row.cms_certification_number || '',
      issuingAgency: row.issuing_agency || '',
      licenseType: row.license_type || '',
      lastVerifiedDate: row.last_verified_date || '',
      dataSource: row.data_source || '',
      careTypeSet: new Set<CareTypeSlug>([careType]),
    });
  }

  const facilities: FacilityRecord[] = [];
  const seenIds = new Set<string>();

  for (const [key, facilityBase] of aggregated.entries()) {
    const strictKey = toFacilityMatchKey(
      facilityBase.name,
      facilityBase.city,
      facilityBase.state,
      facilityBase.street,
      facilityBase.zip,
      facilityBase.phone,
    );
    const looseKey = toFacilityMatchKey(
      facilityBase.name,
      facilityBase.city,
      facilityBase.state,
      facilityBase.street,
      facilityBase.zip,
      '',
    );
    const enriched = enrichedStrict.get(strictKey)?.[0] || enrichedLoose.get(looseKey)?.[0];

    const careTypes = Array.from(facilityBase.careTypeSet).sort((a, b) => {
      const aCount = CARE_TYPES.findIndex((item) => item.slug === a);
      const bCount = CARE_TYPES.findIndex((item) => item.slug === b);
      return aCount - bCount;
    });

    const publicSlug = (enriched?.public_slug || slugify(facilityBase.name) || 'facility').toLowerCase();
    const hasProfile = !!(enriched && Number(enriched.public_route_id));
    const publicRouteId =
      Number(enriched?.public_route_id) || parseInt(hashString(key || facilityBase.name), 36) || facilities.length + 1;
    let id = enriched?.id || `${publicSlug}-${publicRouteId}`;
    if (seenIds.has(id)) id = `${id}-${hashString(`${id}-${facilityBase.city}`)}`;
    seenIds.add(id);

    facilities.push({
      id,
      publicSlug,
      publicRouteId,
      hasProfile,
      name: facilityBase.name,
      city: facilityBase.city,
      citySlug: facilityBase.citySlug,
      state: facilityBase.state,
      stateSlug: facilityBase.stateSlug,
      stateName: facilityBase.stateName,
      street: facilityBase.street,
      zip: facilityBase.zip,
      county: facilityBase.county,
      phone: facilityBase.phone || enriched?.phone || '',
      verifiedPhone: enriched?.verified_phone || '',
      email: facilityBase.email,
      websiteUrl: enriched?.website_url || '',
      googleMapsUrl: enriched?.google_maps_url || '',
      listingTier: enriched?.listing_tier || facilityBase.listingTier || '',
      businessStatus: enriched?.business_status || '',
      onlinePresenceUpdatedAt: enriched?.online_presence_updated_at || '',
      beds: facilityBase.beds,
      ownershipType: facilityBase.ownershipType,
      ownershipBucket: facilityBase.ownershipBucket,
      latitude: facilityBase.latitude,
      longitude: facilityBase.longitude,
      licenseNumber: facilityBase.licenseNumber,
      cmsCertificationNumber: facilityBase.cmsCertificationNumber,
      issuingAgency: facilityBase.issuingAgency,
      licenseType: facilityBase.licenseType,
      lastVerifiedDate: facilityBase.lastVerifiedDate,
      dataSource: facilityBase.dataSource,
      careTypes,
      primaryCareType: careTypes[0] || 'assisted-living',
    });
  }

  facilities.sort((a, b) => {
    if (a.stateSlug !== b.stateSlug) return a.stateSlug.localeCompare(b.stateSlug);
    if (a.citySlug !== b.citySlug) return a.citySlug.localeCompare(b.citySlug);
    return a.name.localeCompare(b.name);
  });

  const stateMap = new Map<string, StateSummary>();
  const cityByKey = new Map<string, CitySummary>();

  for (const facility of facilities) {
    if (!stateMap.has(facility.stateSlug)) {
      stateMap.set(facility.stateSlug, {
        stateName: facility.stateName,
        stateAbbr: facility.state,
        stateSlug: facility.stateSlug,
        facilities: [],
        facilityCount: 0,
        cityCount: 0,
        cities: [],
        topCities: [],
        stats: computeStats([]),
      });
    }
    const stateSummary = stateMap.get(facility.stateSlug)!;
    stateSummary.facilities.push(facility);

    const cityKey = `${facility.stateSlug}/${facility.citySlug}`;
    if (!cityByKey.has(cityKey)) {
      const richKey = `${facility.citySlug}-${facility.state.toLowerCase()}`;
      cityByKey.set(cityKey, {
        key: cityKey,
        cityName: facility.city,
        citySlug: facility.citySlug,
        stateAbbr: facility.state,
        stateSlug: facility.stateSlug,
        stateName: facility.stateName,
        county: facility.county || '',
        facilities: [],
        facilityCount: 0,
        careTypeCounts: emptyCareCounts(),
        center: null,
        topZips: [],
        nearbyCities: [],
        richContent: cityContent[richKey],
        stats: computeStats([]),
      });
    }
    const citySummary = cityByKey.get(cityKey)!;
    citySummary.facilities.push(facility);
  }

  for (const city of cityByKey.values()) {
    city.facilityCount = city.facilities.length;
    city.stats = computeStats(city.facilities);
    city.careTypeCounts = city.stats.careTypeCounts;
    city.topZips = city.stats.topZips;

    const points = city.facilities.filter((item) => item.latitude !== null && item.longitude !== null);
    if (points.length > 0) {
      const lat = points.reduce((sum, item) => sum + (item.latitude || 0), 0) / points.length;
      const lng = points.reduce((sum, item) => sum + (item.longitude || 0), 0) / points.length;
      city.center = { lat, lng };
    }
  }

  const states = Array.from(stateMap.values()).sort((a, b) => a.stateName.localeCompare(b.stateName));
  for (const state of states) {
    state.facilityCount = state.facilities.length;
    state.stats = computeStats(state.facilities);
    state.cities = Array.from(cityByKey.values())
      .filter((city) => city.stateSlug === state.stateSlug)
      .sort((a, b) => {
        if (b.facilityCount !== a.facilityCount) return b.facilityCount - a.facilityCount;
        return a.cityName.localeCompare(b.cityName);
      });
    state.cityCount = state.cities.length;
    state.topCities = state.cities.slice(0, 8);

    for (const city of state.cities) {
      city.nearbyCities = state.cities
        .filter((candidate) => candidate.citySlug !== city.citySlug)
        .map((candidate) => {
          let distanceMiles: number | null = null;
          if (city.center && candidate.center) {
            distanceMiles = roundPct(toMiles(haversineKm(city.center, candidate.center)));
          }
          return {
            cityName: candidate.cityName,
            citySlug: candidate.citySlug,
            stateSlug: candidate.stateSlug,
            stateAbbr: candidate.stateAbbr,
            distanceMiles,
            facilityCount: candidate.facilityCount,
          };
        })
        .sort((a, b) => {
          if (a.distanceMiles !== null && b.distanceMiles !== null) return a.distanceMiles - b.distanceMiles;
          if (a.distanceMiles !== null) return -1;
          if (b.distanceMiles !== null) return 1;
          if (b.facilityCount !== a.facilityCount) return b.facilityCount - a.facilityCount;
          return a.cityName.localeCompare(b.cityName);
        })
        .slice(0, 6);
    }
  }

  storeCache = {
    facilities,
    states,
    stateBySlug: new Map(states.map((state) => [state.stateSlug, state])),
    cityByKey,
  };
  return storeCache;
};

export const getAllFacilities = (): FacilityRecord[] => ensureStore().facilities;

let nearbyCityCache: Map<string, FacilityRecord[]> | null = null;

const buildNearbyCache = (): Map<string, FacilityRecord[]> => {
  if (nearbyCityCache) return nearbyCityCache;
  const map = new Map<string, FacilityRecord[]>();
  for (const f of ensureStore().facilities) {
    const key = `${f.citySlug}|${f.stateSlug}|${f.primaryCareType}`;
    const list = map.get(key);
    if (list) list.push(f);
    else map.set(key, [f]);
  }
  nearbyCityCache = map;
  return map;
};

export const getNearbyFacilities = (
  citySlug: string,
  stateSlug: string,
  careType: string,
  excludeSlug: string,
  limit = 4,
): FacilityRecord[] => {
  const key = `${citySlug}|${stateSlug}|${careType}`;
  const bucket = buildNearbyCache().get(key) || [];
  const results: FacilityRecord[] = [];
  for (const f of bucket) {
    if (results.length >= limit) break;
    if (`${f.publicSlug}-${f.publicRouteId}` !== excludeSlug) results.push(f);
  }
  return results;
};

export const getFacilityBySlug = (facilitySlug: string): FacilityRecord | null => {
  const match = facilitySlug.match(/^(.*)-(\d+)$/);
  if (!match) return null;
  const publicRouteId = Number(match[2]);
  const publicSlug = match[1].toLowerCase();
  return (
    ensureStore().facilities.find(
      (f) => f.publicRouteId === publicRouteId && f.publicSlug === publicSlug,
    ) || null
  );
};

export const getFacilityStaticPaths = (): Array<{
  care: string;
  state: string;
  city: string;
  facilitySlug: string;
}> =>
  ensureStore().facilities.map((f) => ({
    care: f.primaryCareType,
    state: f.stateSlug,
    city: f.citySlug,
    facilitySlug: `${f.publicSlug}-${f.publicRouteId}`,
  }));

export const getCareTypes = (): CareTypeDefinition[] => CARE_TYPES;
export const getCareTypeBySlug = (slug: string): CareTypeDefinition | null =>
  CARE_TYPE_BY_SLUG.get(slug as CareTypeSlug) || null;

export const getCostBand = (careType: CareTypeSlug): { low: number; high: number } => COST_BANDS[careType];

export const getSeniorLivingStates = (): StateSummary[] => ensureStore().states;
export const getSeniorLivingState = (stateSlug: string): StateSummary | null =>
  ensureStore().stateBySlug.get(stateSlug) || null;

export const getSeniorLivingCity = (stateSlug: string, citySlug: string): CitySummary | null =>
  ensureStore().cityByKey.get(`${stateSlug}/${citySlug}`) || null;

export const getStateStaticPaths = (): Array<{ state: string }> =>
  getSeniorLivingStates().map((state) => ({ state: state.stateSlug }));

export const getCityStaticPaths = (): Array<{ state: string; city: string }> =>
  getSeniorLivingStates().flatMap((state) =>
    state.cities.map((city) => ({
      state: state.stateSlug,
      city: city.citySlug,
    })),
  );

export const getCareCityStaticPaths = (): Array<{ state: string; city: string; care: CareTypeSlug }> =>
  getSeniorLivingStates().flatMap((state) =>
    state.cities.flatMap((city) =>
      (Object.keys(city.careTypeCounts) as CareTypeSlug[])
        .filter((care) => city.careTypeCounts[care] > 0)
        .map((care) => ({
          state: state.stateSlug,
          city: city.citySlug,
          care,
        })),
    ),
  );

export const getCityFacilitiesByCareType = (
  stateSlug: string,
  citySlug: string,
  careType: CareTypeSlug,
): FacilityRecord[] => {
  const city = getSeniorLivingCity(stateSlug, citySlug);
  if (!city) return [];
  return city.facilities.filter((facility) => facility.careTypes.includes(careType));
};

export const getCityMapPoints = (
  stateSlug: string,
  citySlug: string,
  careType?: CareTypeSlug,
  maxPoints = Number.MAX_SAFE_INTEGER,
): Array<{
  id: string;
  name: string;
  lat: number;
  lng: number;
  careTypes: CareTypeSlug[];
  address: string;
  phone: string;
  licenseNumber: string;
  listingTier: string;
  profileUrl: string;
}> => {
  const city = getSeniorLivingCity(stateSlug, citySlug);
  if (!city) return [];
  const scoped = careType
    ? city.facilities.filter((facility) => facility.careTypes.includes(careType))
    : city.facilities;
  return scoped
    .filter((facility) => facility.latitude !== null && facility.longitude !== null)
    .slice(0, maxPoints)
    .map((facility) => ({
      id: facility.id,
      name: facility.name,
      lat: facility.latitude as number,
      lng: facility.longitude as number,
      careTypes: facility.careTypes,
      address: [facility.street, `${facility.city}, ${facility.state} ${facility.zip}`].filter(Boolean).join(', '),
      phone: facility.verifiedPhone || facility.phone || '',
      licenseNumber: facility.licenseNumber || '',
      listingTier: facility.listingTier || '',
      profileUrl: `/community/${facility.publicSlug}-${facility.publicRouteId}/`,
    }));
};

export const getHospitalsForCity = (
  stateAbbr: string,
  cityName: string,
  limit = 4,
): HospitalRecord[] => {
  const abbr = stateAbbr.trim().toUpperCase();
  if (!abbr) return [];

  if (!hospitalsByStateCache.has(abbr)) {
    const hospitals = readJsonFile<Record<string, HospitalRecord[]>>(`public/data/hospitals/${abbr}.json`) || {};
    hospitalsByStateCache.set(abbr, hospitals);
  }
  const byCity = hospitalsByStateCache.get(abbr)!;
  const direct = byCity[cityName.toUpperCase()];
  if (direct && direct.length > 0) return direct.slice(0, limit);

  const normalizedCity = normalize(cityName);
  const fuzzyKey = Object.keys(byCity).find((key) => normalize(key).includes(normalizedCity));
  if (!fuzzyKey) return [];
  return byCity[fuzzyKey].slice(0, limit);
};

const getLicensingRows = (): Array<Record<string, string>> => {
  if (licensingCache) return licensingCache;
  licensingCache = readJsonFile<Array<Record<string, string>>>('src/data/licensing.json') || [];
  return licensingCache;
};

const getOmbudsmanRows = (): Record<string, Record<string, string>> => {
  if (ombudsmanCache) return ombudsmanCache;
  ombudsmanCache = readJsonFile<Record<string, Record<string, string>>>('src/data/ombudsman.json') || {};
  return ombudsmanCache;
};

const getMedicaidRows = (): Array<Record<string, any>> => {
  if (medicaidCache) return medicaidCache;
  const payload = readJsonFile<Record<string, Array<Record<string, any>>>>('src/data/medicaid_waivers.json');
  medicaidCache = payload?.medicaid_waivers || [];
  return medicaidCache;
};

const getAgingAgencyRows = (): Array<Record<string, any>> => {
  if (agingAgencyCache) return agingAgencyCache;
  const payload = readJsonFile<Record<string, Array<Record<string, any>>>>('src/data/aging_agencies.json');
  agingAgencyCache = payload?.aging_agencies || [];
  return agingAgencyCache;
};

export const getRegulatoryContext = (stateSlug: string): RegulatoryContext => {
  const state = getSeniorLivingState(stateSlug);
  if (!state) {
    return { licensing: null, ombudsman: null, medicaid: null, agingAgency: null };
  }

  const licensingRow = getLicensingRows().find((row) => normalize(row.state || '') === normalize(state.stateName));
  const ombudsmanRow = getOmbudsmanRows()[state.stateAbbr];
  const medicaidRow = getMedicaidRows().find((row) => (row.state || '').toUpperCase() === state.stateAbbr);
  const agingRow = getAgingAgencyRows().find((row) => (row.state || '').toUpperCase() === state.stateAbbr);

  return {
    licensing: licensingRow
      ? {
          agencyName: licensingRow.agency_name || '',
          websiteUrl: licensingRow.website_url || '',
          phone: licensingRow.phone || '',
          complaintIntakeUrl: licensingRow.complaint_intake_url || '',
          verifyLicenseUrl: licensingRow.verify_license_url || '',
        }
      : null,
    ombudsman: ombudsmanRow
      ? {
          programName: ombudsmanRow.program_name || '',
          phone: ombudsmanRow.phone || '',
          website: ombudsmanRow.website || '',
          email: ombudsmanRow.email || '',
        }
      : null,
    medicaid: medicaidRow
      ? {
          programName: medicaidRow.program_name || '',
          status: medicaidRow.status || '',
          description: medicaidRow.description || '',
          website: medicaidRow.contact?.website || '',
          phone: medicaidRow.contact?.phone || '',
        }
      : null,
    agingAgency: agingRow
      ? {
          programName: agingRow.program_name || '',
          website: agingRow.contact?.website || '',
          phone: agingRow.contact?.phone || '',
          findLocalUrl: agingRow.contact?.find_local_url || '',
        }
      : null,
  };
};

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export const formatDateLong = (date: Date): string =>
  date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const getBuildDate = (): Date => {
  const buildTimeRaw = process.env.BUILD_TIME;
  if (!buildTimeRaw) return new Date();
  const parsed = new Date(buildTimeRaw);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
};

export const getCareTypeLabel = (careType: CareTypeSlug): string => CARE_TYPE_BY_SLUG.get(careType)?.label || careType;
