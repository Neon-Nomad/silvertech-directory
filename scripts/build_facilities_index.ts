import fs from 'node:fs';
import path from 'node:path';
import { getFacilityIndex, getStateName, getStateSlug, toCitySlug } from '../astro-src/lib/data';

type CityIndexEntry = {
  stateSlug: string;
  citySlug: string;
  stateAbbr: string;
  stateName: string;
  cityName: string;
  count: number;
};

const facilities = getFacilityIndex();

const cityMap = new Map<string, CityIndexEntry>();
for (const facility of facilities) {
  if (!facility.city || !facility.state) continue;
  const stateAbbr = facility.state.trim();
  const cityName = facility.city.trim();
  if (!stateAbbr || !cityName) continue;
  const stateSlug = getStateSlug(stateAbbr);
  const citySlug = toCitySlug(cityName);
  const key = `${stateSlug}/${citySlug}`;
  const existing = cityMap.get(key);
  if (existing) {
    existing.count += 1;
  } else {
    cityMap.set(key, {
      stateSlug,
      citySlug,
      stateAbbr,
      stateName: getStateName(stateAbbr),
      cityName,
      count: 1
    });
  }
}

const cityIndex = Array.from(cityMap.values()).sort((a, b) => {
  if (a.stateSlug !== b.stateSlug) return a.stateSlug.localeCompare(b.stateSlug);
  return a.cityName.localeCompare(b.cityName);
});

const outDir = path.resolve(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'facilities_index.json'), JSON.stringify(facilities, null, 2));
fs.writeFileSync(path.join(outDir, 'city_index.json'), JSON.stringify(cityIndex, null, 2));

console.log(`Wrote ${facilities.length} facilities to public/facilities_index.json`);
console.log(`Wrote ${cityIndex.length} city entries to public/city_index.json`);
