import fs from 'node:fs';
import readline from 'node:readline';
import dotenv from 'dotenv';
import { Client } from 'pg';
import { ALL_STATES } from '../src/data/states';
import { type ImportFacility, writeFacilityImport } from './lib/facilityImportWrites';

dotenv.config();

type CityGeoAccumulator = {
  latSum: number;
  lngSum: number;
  count: number;
};

const STATE_ABBR_BY_NAME = new Map(ALL_STATES.map((state) => [state.name.toLowerCase(), state.abbreviation]));

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ');

const toNaturalKey = (name: string, addressLine1: string, city: string, state: string): string =>
  [normalize(name), normalize(addressLine1), normalize(city), state.trim().toUpperCase()].join('|');

const toCityGeoKey = (state: string, city: string): string =>
  `${state.trim().toUpperCase()}|${normalize(city)}`;

const parseMaybeNumber = (value: string): number | null => {
  const cleaned = (value || '').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseMaybeInteger = (value: string): number | null => {
  const parsed = parseMaybeNumber(value);
  if (parsed === null) return null;
  const rounded = Math.round(parsed);
  return Number.isFinite(rounded) ? rounded : null;
};

const normalizeStateAbbr = (stateAbbrRaw: string, stateNameRaw: string): string => {
  const stateAbbr = (stateAbbrRaw || '').trim().toUpperCase();
  if (stateAbbr.length === 2) return stateAbbr;
  const byName = STATE_ABBR_BY_NAME.get((stateNameRaw || '').trim().toLowerCase());
  return byName || stateAbbr || '';
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

const setIfBetter = (current: string | null, incoming: string): string | null => {
  const next = (incoming || '').trim();
  if (!next) return current;
  if (!current || current.trim().length === 0) return next;
  return current;
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options: {
    csvPath: string;
    batchSize: number;
    dryRun: boolean;
  } = {
    csvPath: 'all_senior_living_complete.csv',
    batchSize: 3000,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--csv' && args[i + 1]) {
      options.csvPath = args[i + 1];
      i += 1;
    } else if (arg === '--batch-size' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) options.batchSize = parsed;
      i += 1;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
};

const addCityGeoPoint = (
  cityGeoMap: Map<string, CityGeoAccumulator>,
  state: string,
  city: string,
  latitude: number | null,
  longitude: number | null,
) => {
  if (latitude === null || longitude === null) return;
  const key = toCityGeoKey(state, city);
  if (!cityGeoMap.has(key)) {
    cityGeoMap.set(key, { latSum: 0, lngSum: 0, count: 0 });
  }
  const entry = cityGeoMap.get(key)!;
  entry.latSum += latitude;
  entry.lngSum += longitude;
  entry.count += 1;
};

const run = async () => {
  const { csvPath, batchSize, dryRun } = parseArgs();
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!password || !url) {
    throw new Error('Missing SUPABASE_DB_PASSWORD or SUPABASE_URL/VITE_SUPABASE_URL in env.');
  }

  const host = url.replace('https://', '').replace('http://', '');
  const connectionString = `postgresql://postgres:${password}@db.${host}:5432/postgres`;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // Ensure credential columns exist in-case migration hasn't run yet.
    await client.query(`
      alter table public.facilities add column if not exists state_license_number text;
      alter table public.facilities add column if not exists cms_certification_number text;
    `);

    const existingGeo = await client.query<{
      state: string | null;
      city: string | null;
      latitude: number | null;
      longitude: number | null;
    }>(`
      select state, city, latitude, longitude
      from public.facilities
      where latitude is not null and longitude is not null;
    `);

    const cityGeoMap = new Map<string, CityGeoAccumulator>();
    for (const row of existingGeo.rows) {
      if (!row.state || !row.city) continue;
      addCityGeoPoint(cityGeoMap, row.state, row.city, row.latitude, row.longitude);
    }

    const facilitiesByNaturalKey = new Map<string, ImportFacility>();
    let totalRows = 0;
    let skippedMissingIdentity = 0;

    const rl = readline.createInterface({
      input: fs.createReadStream(csvPath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let headers: string[] = [];
    for await (const line of rl) {
      if (!line.trim()) continue;

      if (headers.length === 0) {
        headers = parseCsvLine(line).map((h) => h.trim());
        continue;
      }

      totalRows += 1;
      const values = parseCsvLine(line);
      const row: Record<string, string> = {};
      for (let i = 0; i < headers.length; i += 1) {
        row[headers[i]] = (values[i] || '').trim();
      }

      const name = row.name || '';
      const addressLine1 = row.street || '';
      const city = row.city || '';
      const state = normalizeStateAbbr(row.state_abbr || '', row.state || '');
      if (!name || !city || !state || !addressLine1) {
        skippedMissingIdentity += 1;
        continue;
      }

      const naturalKey = toNaturalKey(name, addressLine1, city, state);
      const latitude = parseMaybeNumber(row.latitude || '');
      const longitude = parseMaybeNumber(row.longitude || '');
      addCityGeoPoint(cityGeoMap, state, city, latitude, longitude);

      const existing = facilitiesByNaturalKey.get(naturalKey);
      if (existing) {
        existing.postalCode = setIfBetter(existing.postalCode, row.zip || '');
        existing.phone = setIfBetter(existing.phone, row.phone || '');
        existing.email = setIfBetter(existing.email, row.email || '');
        existing.stateLicenseNumber = setIfBetter(existing.stateLicenseNumber, row.state_license_number || '');
        existing.cmsCertificationNumber = setIfBetter(
          existing.cmsCertificationNumber,
          row.cms_certification_number || '',
        );
        existing.issuingAgency = setIfBetter(existing.issuingAgency, row.issuing_agency || '');
        if (existing.bedCapacity === null) {
          existing.bedCapacity = parseMaybeInteger(row.beds || '');
        }
        if (existing.latitude === null && latitude !== null) existing.latitude = latitude;
        if (existing.longitude === null && longitude !== null) existing.longitude = longitude;
        continue;
      }

      facilitiesByNaturalKey.set(naturalKey, {
        naturalKey,
        name,
        addressLine1,
        city,
        state,
        postalCode: (row.zip || '').trim() || null,
        latitude,
        longitude,
        phone: (row.phone || '').trim() || null,
        email: (row.email || '').trim() || null,
        bedCapacity: parseMaybeInteger(row.beds || ''),
        stateLicenseNumber: (row.state_license_number || '').trim() || null,
        cmsCertificationNumber: (row.cms_certification_number || '').trim() || null,
        issuingAgency: (row.issuing_agency || '').trim() || null,
      });
    }

    let geocodedByCityCentroid = 0;
    let stillMissingGeo = 0;
    for (const facility of facilitiesByNaturalKey.values()) {
      if (facility.latitude !== null && facility.longitude !== null) continue;
      const cityKey = toCityGeoKey(facility.state, facility.city);
      const cityGeo = cityGeoMap.get(cityKey);
      if (cityGeo && cityGeo.count > 0) {
        facility.latitude = cityGeo.latSum / cityGeo.count;
        facility.longitude = cityGeo.lngSum / cityGeo.count;
        geocodedByCityCentroid += 1;
      } else {
        stillMissingGeo += 1;
      }
    }

    const facilities = Array.from(facilitiesByNaturalKey.values());

    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            csvPath,
            totalRows,
            uniqueFacilitiesFromCsv: facilities.length,
            skippedMissingIdentity,
            geocodedByCityCentroid,
            stillMissingGeo,
            mode: 'dry-run',
          },
          null,
          2,
        ),
      );
      return;
    }

    const writeResult = await writeFacilityImport(client, facilities, batchSize);
    const totalsAfterRes = await client.query<{ count: string }>(`
      select count(*)::text as count
      from public.facilities;
    `);

    console.log(
      JSON.stringify(
        {
          csvPath,
          totalRows,
          uniqueFacilitiesFromCsv: facilities.length,
          skippedMissingIdentity,
          geocodedByCityCentroid,
          stillMissingGeo,
          matchedExisting: writeResult.matchedExisting,
          updatedRows: writeResult.updatedRows,
          unchangedMatches: writeResult.unchangedMatches,
          insertedRows: writeResult.insertedRows,
          licensingUpserts: writeResult.licensingUpserts,
          facilitiesTotalAfterImport: Number(totalsAfterRes.rows[0]?.count || 0),
          mode: 'apply',
        },
        null,
        2,
      ),
    );
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error('Facility import failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
