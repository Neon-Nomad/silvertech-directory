import fs from 'node:fs';
import path from 'node:path';
import { ALL_STATES } from '../../src/data/states';

type Facility = {
  id?: string;
  public_slug?: string;
  public_route_id?: number;
  primary_care_type_slug?: string;
  name: string;
  city: string;
  state: string;
  facility_type?: string;
  type?: string;
  address_line1?: string;
  postal_code?: string;
  phone?: string;
  website_url?: string;
  google_maps_url?: string;
  verified_phone?: string;
  business_status?: string;
  online_presence_updated_at?: string;
  address?: string;
  zip?: string;
  license_number?: string;
  source_url?: string;
};

const loadFacilities = (): Facility[] => {
  const root = process.cwd();
  const preferredWebsitesDir = path.resolve(root, 'FINAL_all_facilities_with_websites');
  const websitesDir = fs.existsSync(preferredWebsitesDir)
    ? preferredWebsitesDir
    : path.resolve(root, 'all_facilities_with_websites_complete');
  const stateDir = path.resolve(root, 'all_51_states_facilities');

  const loadFromDir = (dirPath: string) => {
    const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.json'));
    const merged: Facility[] = [];
    for (const file of files) {
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const data = JSON.parse(raw) as {
        state?: string;
        state_code?: string;
        facilities?: Array<{
          name?: string;
          type?: string;
          address?: { street?: string; city?: string; state?: string; zip?: string };
          contact?: { phone?: string; phone_formatted?: string };
          location?: { county?: string };
          online_presence?: {
            website?: string;
            google_maps_url?: string;
            verified_phone?: string;
            business_status?: string;
            last_updated?: string;
          };
        }>;
      };
      if (!Array.isArray(data.facilities)) continue;
      for (const facility of data.facilities) {
        const address = facility.address || {};
        const online = facility.online_presence;
        merged.push({
          name: facility.name || 'Unknown Facility',
          city: address.city || '',
          state: address.state || data.state_code || '',
          facility_type: facility.type || '',
          type: facility.type || '',
          address_line1: address.street || '',
          postal_code: address.zip || '',
          phone: facility.contact?.phone_formatted || facility.contact?.phone || '',
          website_url: online?.website,
          google_maps_url: online?.google_maps_url,
          verified_phone: online?.verified_phone,
          business_status: online?.business_status,
          online_presence_updated_at: online?.last_updated
        });
      }
    }
    return merged;
  };

  if (fs.existsSync(websitesDir)) {
    return loadFromDir(websitesDir);
  }

  if (fs.existsSync(stateDir)) {
    return loadFromDir(stateDir);
  }

  const facilitiesPath = path.resolve(root, 'src/data/seeds/assisted_living_facilities_national.json');
  const facilitiesRaw = fs.readFileSync(facilitiesPath, 'utf-8');
  const facilitiesData: unknown = JSON.parse(facilitiesRaw);
  return Array.isArray(facilitiesData)
    ? facilitiesData
    : Object.values((facilitiesData || {}) as Record<string, Facility[]>).flat();
};

const facilitiesRawArray: Facility[] = loadFacilities();

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const getStateName = (abbr: string) =>
  ALL_STATES.find((s) => s.abbreviation === abbr)?.name || abbr;

export const getStateSlug = (abbr: string) =>
  ALL_STATES.find((s) => s.abbreviation === abbr)?.slug || toSlug(getStateName(abbr));

export const toCitySlug = (city: string) => toSlug(city);

const hashString = (value: string) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

const getFacilityBaseId = (facility: Facility) => {
  const keyParts = [
    facility.name,
    facility.city,
    facility.state,
    facility.license_number,
    facility.phone,
    facility.address || facility.address_line1,
    facility.postal_code || facility.zip,
    facility.source_url
  ];
  const key = keyParts.filter(Boolean).join('|');
  const baseParts = [
    facility.name,
    facility.city,
    facility.state,
    facility.license_number || facility.postal_code || facility.zip || facility.phone
  ];
  const base = toSlug(baseParts.filter(Boolean).join(' '));
  const hash = hashString(key || `${facility.name || 'facility'}-${facility.city || ''}-${facility.state || ''}`);
  return base ? `${base}-${hash}` : `facility-${hash}`;
};

const inferPrimaryCareTypeSlug = (facility: Facility): string => {
  const value = `${facility.facility_type || ''} ${facility.type || ''}`.toLowerCase();
  if (value.includes('memory') || value.includes('dementia') || value.includes('alzheimer')) return 'memory-care';
  if (value.includes('nursing') || value.includes('skilled') || value.includes('snf')) return 'nursing-homes';
  if (value.includes('independent')) return 'independent-living';
  if (value.includes('residential') || value.includes('board and care')) return 'residential-care';
  if (value.includes('adult day')) return 'adult-day-services';
  if (value.includes('ccrc') || value.includes('continuing care') || value.includes('life plan')) return 'ccrc';
  return 'assisted-living';
};

const facilities: Facility[] = (() => {
  const seen = new Map<string, number>();
  return facilitiesRawArray.map((facility, index) => {
    const address_line1 = facility.address_line1 || facility.address || '';
    const postal_code = facility.postal_code || facility.zip || '';
    const baseId = getFacilityBaseId({ ...facility, address_line1, postal_code }) || `facility-${index + 1}`;
    const count = seen.get(baseId) || 0;
    seen.set(baseId, count + 1);
    const public_slug = toSlug(facility.name || `facility-${index + 1}`) || `facility-${index + 1}`;
    const public_route_id = index + 1;
    const id = `${public_slug}-${public_route_id}`;
    return {
      ...facility,
      id,
      public_slug,
      public_route_id,
      primary_care_type_slug: inferPrimaryCareTypeSlug(facility),
      address_line1,
      postal_code
    };
  });
})();

export const getCityIndex = () => {
  const map = new Map<string, { stateSlug: string; citySlug: string; stateAbbr: string; cityName: string; stateName: string }>();

  for (const f of facilities) {
    if (!f.city || !f.state) continue;
    const stateAbbr = f.state.trim();
    const cityName = f.city.trim();
    const stateSlug = getStateSlug(stateAbbr);
    const citySlug = toCitySlug(cityName);
    const key = `${stateSlug}/${citySlug}`;
    if (!map.has(key)) {
      map.set(key, {
        stateSlug,
        citySlug,
        stateAbbr,
        cityName,
        stateName: getStateName(stateAbbr)
      });
    }
  }

  return Array.from(map.values());
};

export const getCityFacilities = (stateSlug: string, citySlug: string, limit = 50) => {
  const matches: Facility[] = [];
  for (const f of facilities) {
    const stateName = getStateName(f.state?.trim() || '');
    const fStateSlug = getStateSlug(f.state?.trim() || '');
    const fCitySlug = toCitySlug(f.city || '');
    if (fStateSlug === stateSlug && fCitySlug === citySlug) {
      matches.push(f);
    }
    if (matches.length >= limit) break;
  }
  return matches;
};

export const getFacilityIndex = () => {
  return facilities.map((f) => ({
    id: f.id,
    public_slug: f.public_slug,
    public_route_id: f.public_route_id,
    primary_care_type_slug: f.primary_care_type_slug,
    name: f.name,
    city: f.city,
    state: f.state,
    facility_type: f.facility_type || f.type || '',
    address_line1: f.address_line1,
    postal_code: f.postal_code,
    phone: f.phone,
    website_url: f.website_url,
    google_maps_url: f.google_maps_url,
    verified_phone: f.verified_phone,
    business_status: f.business_status,
    online_presence_updated_at: f.online_presence_updated_at
  }));
};
