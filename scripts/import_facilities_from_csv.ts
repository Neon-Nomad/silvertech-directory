import fs from 'node:fs';
import readline from 'node:readline';
import dotenv from 'dotenv';
import { Client } from 'pg';
import { ALL_STATES } from '../src/data/states';

dotenv.config();

type ImportFacility = {
  naturalKey: string;
  name: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  bedCapacity: number | null;
  stateLicenseNumber: string | null;
  cmsCertificationNumber: string | null;
  issuingAgency: string | null;
};

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

    await client.query(`
      create temporary table tmp_facility_import (
        natural_key text primary key,
        name text not null,
        address_line1 text not null,
        city text not null,
        state text not null,
        postal_code text,
        latitude double precision,
        longitude double precision,
        phone text,
        email text,
        bed_capacity integer,
        state_license_number text,
        cms_certification_number text,
        issuing_agency text
      );
    `);

    for (let i = 0; i < facilities.length; i += batchSize) {
      const chunk = facilities.slice(i, i + batchSize);

      await client.query(
        `
          insert into tmp_facility_import (
            natural_key,
            name,
            address_line1,
            city,
            state,
            postal_code,
            latitude,
            longitude,
            phone,
            email,
            bed_capacity,
            state_license_number,
            cms_certification_number,
            issuing_agency
          )
          select *
          from unnest(
            $1::text[],
            $2::text[],
            $3::text[],
            $4::text[],
            $5::text[],
            $6::text[],
            $7::double precision[],
            $8::double precision[],
            $9::text[],
            $10::text[],
            $11::integer[],
            $12::text[],
            $13::text[],
            $14::text[]
          )
          on conflict (natural_key) do update
          set
            postal_code = coalesce(excluded.postal_code, tmp_facility_import.postal_code),
            latitude = coalesce(excluded.latitude, tmp_facility_import.latitude),
            longitude = coalesce(excluded.longitude, tmp_facility_import.longitude),
            phone = coalesce(excluded.phone, tmp_facility_import.phone),
            email = coalesce(excluded.email, tmp_facility_import.email),
            bed_capacity = coalesce(excluded.bed_capacity, tmp_facility_import.bed_capacity),
            state_license_number = coalesce(excluded.state_license_number, tmp_facility_import.state_license_number),
            cms_certification_number = coalesce(excluded.cms_certification_number, tmp_facility_import.cms_certification_number),
            issuing_agency = coalesce(excluded.issuing_agency, tmp_facility_import.issuing_agency);
        `,
        [
          chunk.map((r) => r.naturalKey),
          chunk.map((r) => r.name),
          chunk.map((r) => r.addressLine1),
          chunk.map((r) => r.city),
          chunk.map((r) => r.state),
          chunk.map((r) => r.postalCode),
          chunk.map((r) => r.latitude),
          chunk.map((r) => r.longitude),
          chunk.map((r) => r.phone),
          chunk.map((r) => r.email),
          chunk.map((r) => r.bedCapacity),
          chunk.map((r) => r.stateLicenseNumber),
          chunk.map((r) => r.cmsCertificationNumber),
          chunk.map((r) => r.issuingAgency),
        ],
      );
    }

    await client.query(`
      create temporary table tmp_existing_facility_keys
      as
      select distinct on (natural_key)
        natural_key,
        id as facility_id
      from (
        select
          f.id,
          concat_ws(
            '|',
            regexp_replace(regexp_replace(lower(trim(coalesce(f.name, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
            regexp_replace(regexp_replace(lower(trim(coalesce(f.address_line1, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
            regexp_replace(regexp_replace(lower(trim(coalesce(f.city, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
            upper(trim(coalesce(f.state, '')))
          ) as natural_key,
          f.created_at
        from public.facilities f
      ) keys
      order by natural_key, created_at asc, facility_id asc;
    `);

    await client.query(`create index on tmp_existing_facility_keys (natural_key);`);

    const matchedRes = await client.query<{ count: string }>(`
      select count(*)::text as count
      from tmp_facility_import t
      join tmp_existing_facility_keys k on k.natural_key = t.natural_key;
    `);
    const matchedExisting = Number(matchedRes.rows[0]?.count || 0);

    const updateRes = await client.query(`
      update public.facilities f
      set
        postal_code = coalesce(nullif(t.postal_code, ''), f.postal_code),
        latitude = coalesce(t.latitude, f.latitude),
        longitude = coalesce(t.longitude, f.longitude),
        phone = coalesce(nullif(t.phone, ''), f.phone),
        email = coalesce(nullif(t.email, ''), f.email),
        state_license_number = coalesce(nullif(t.state_license_number, ''), f.state_license_number),
        cms_certification_number = coalesce(
          nullif(t.cms_certification_number, ''),
          f.cms_certification_number
        ),
        updated_at = now()
      from tmp_facility_import t
      join tmp_existing_facility_keys k on k.natural_key = t.natural_key
      where f.id = k.facility_id;
    `);

    const insertRes = await client.query(`
      insert into public.facilities (
        name,
        address_line1,
        city,
        state,
        postal_code,
        latitude,
        longitude,
        phone,
        email,
        state_license_number,
        cms_certification_number
      )
      select
        t.name,
        t.address_line1,
        t.city,
        t.state,
        nullif(t.postal_code, ''),
        t.latitude,
        t.longitude,
        nullif(t.phone, ''),
        nullif(t.email, ''),
        nullif(t.state_license_number, ''),
        nullif(t.cms_certification_number, '')
      from tmp_facility_import t
      left join tmp_existing_facility_keys k on k.natural_key = t.natural_key
      where k.facility_id is null;
    `);

    const licensingRes = await client.query(`
      with deduped as (
        select distinct on (license_number)
          facility_id,
          license_number,
          bed_capacity,
          authority
        from (
          select
            f.id as facility_id,
            nullif(t.state_license_number, '') as license_number,
            t.bed_capacity,
            nullif(t.issuing_agency, '') as authority
          from tmp_facility_import t
          join public.facilities f
            on concat_ws(
              '|',
              regexp_replace(regexp_replace(lower(trim(coalesce(f.name, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
              regexp_replace(regexp_replace(lower(trim(coalesce(f.address_line1, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
              regexp_replace(regexp_replace(lower(trim(coalesce(f.city, ''))), '[^a-z0-9 ]+', '', 'g'), '\\s+', ' ', 'g'),
              upper(trim(coalesce(f.state, '')))
            ) = t.natural_key
          where nullif(t.state_license_number, '') is not null
        ) src
        order by license_number, facility_id
      )
      insert into public.facility_licensing (
        facility_id,
        license_number,
        bed_capacity,
        authority,
        updated_at
      )
      select
        facility_id,
        license_number,
        bed_capacity,
        authority,
        now()
      from deduped
      on conflict (license_number) do update
      set
        facility_id = excluded.facility_id,
        bed_capacity = coalesce(excluded.bed_capacity, public.facility_licensing.bed_capacity),
        authority = coalesce(excluded.authority, public.facility_licensing.authority),
        updated_at = now();
    `);

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
          matchedExisting,
          updatedRows: updateRes.rowCount || 0,
          insertedRows: insertRes.rowCount || 0,
          licensingUpserts: licensingRes.rowCount || 0,
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
