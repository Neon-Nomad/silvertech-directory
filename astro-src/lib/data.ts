import fs from 'node:fs';
import path from 'node:path';
import { ALL_STATES } from '../../src/data/states';

type Facility = {
  id: string;
  name: string;
  city: string;
  state: string;
  address_line1?: string;
  postal_code?: string;
  phone?: string;
};

const facilitiesPath = path.resolve(process.cwd(), 'src/data/seeds/assisted_living_facilities_national.json');
const facilitiesRaw = fs.readFileSync(facilitiesPath, 'utf-8');
const facilities: Facility[] = JSON.parse(facilitiesRaw);

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
    name: f.name,
    city: f.city,
    state: f.state,
    address_line1: f.address_line1,
    postal_code: f.postal_code,
    phone: f.phone
  }));
};
