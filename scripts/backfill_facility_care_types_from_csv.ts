import fs from 'node:fs';
import readline from 'node:readline';
import dotenv from 'dotenv';
import { Client } from 'pg';
import { ALL_STATES } from '../src/data/states';

dotenv.config();

const CANONICAL_CARE_SLUGS = [
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
] as const;

type CanonicalCareSlug = (typeof CANONICAL_CARE_SLUGS)[number];

const CARE_TYPE_ALIASES: Record<string, CanonicalCareSlug> = {
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
  'ccrc / life plan community': 'ccrc',
  'life plan community': 'ccrc',
  'continuing care': 'ccrc',
  ccrc: 'ccrc',
};

const STATE_ABBR_BY_NAME = new Map(ALL_STATES.map((state) => [state.name.toLowerCase(), state.abbreviation]));

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
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '');

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

const toFacilityMatchKey = (name: string, city: string, state: string, zip: string): string =>
  [
    normalize(name),
    normalize(city),
    (state || '').trim().toUpperCase(),
    (zip || '').trim(),
  ].join('|');

const normalizeStateAbbr = (stateAbbrRaw: string, stateNameRaw: string): string => {
  const direct = (stateAbbrRaw || '').trim().toUpperCase();
  if (direct.length === 2) return direct;
  const fromName = STATE_ABBR_BY_NAME.get((stateNameRaw || '').trim().toLowerCase());
  return fromName || direct || '';
};

const inferCareTypeSlug = (rawValue: string): CanonicalCareSlug | null => {
  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) return null;
  if (CARE_TYPE_ALIASES[normalized]) return CARE_TYPE_ALIASES[normalized];

  const slug = slugify(normalized);
  if ((CANONICAL_CARE_SLUGS as readonly string[]).includes(slug)) {
    return slug as CanonicalCareSlug;
  }

  if (slug.includes('memory') || slug.includes('dementia') || slug.includes('alzheim')) return 'memory-care';
  if (slug.includes('nursing') || slug.includes('skilled') || slug === 'snf') return 'nursing-homes';
  if (slug.includes('independent')) return 'independent-living';
  if (slug.includes('residential') || slug.includes('board-care')) return 'residential-care';
  if (slug.includes('adult-day')) return 'adult-day-services';
  if (slug.includes('ccrc') || slug.includes('life-plan') || slug.includes('continuing-care')) return 'ccrc';
  if (slug.includes('assisted')) return 'assisted-living';

  return null;
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options: {
    csvPath: string;
    batchSize: number;
    replaceMatched: boolean;
  } = {
    csvPath: 'all_senior_living_complete.csv',
    batchSize: 2000,
    replaceMatched: false,
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
    } else if (arg === '--replace-matched') {
      options.replaceMatched = true;
    }
  }

  return options;
};

const run = async () => {
  const { csvPath, batchSize, replaceMatched } = parseArgs();

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!password || !url) {
    throw new Error('Missing SUPABASE_DB_PASSWORD or SUPABASE_URL/VITE_SUPABASE_URL in environment.');
  }

  const host = url.replace('https://', '').replace('http://', '');
  const connectionString = `postgresql://postgres:${password}@db.${host}:5432/postgres`;
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const careTypeRes = await client.query<{
      id: string;
      slug: string;
    }>(`
      select id, slug
      from public.care_types
      where slug in ('assisted-living','memory-care','nursing-homes','independent-living','residential-care','adult-day-services','ccrc');
    `);

    const careTypeIdBySlug = new Map<string, string>();
    for (const row of careTypeRes.rows) {
      careTypeIdBySlug.set(row.slug, row.id);
    }

    const missingSlugs = CANONICAL_CARE_SLUGS.filter((slug) => !careTypeIdBySlug.has(slug));
    if (missingSlugs.length > 0) {
      throw new Error(
        `care_types taxonomy is missing canonical slug(s): ${missingSlugs.join(', ')}. Run migration first.`,
      );
    }

    const facilitiesRes = await client.query<{
      id: string;
      name: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
    }>(`
      select id, name, city, state, postal_code
      from public.facilities;
    `);

    const facilityIdsByKey = new Map<string, string[]>();
    for (const row of facilitiesRes.rows) {
      const key = toFacilityMatchKey(row.name || '', row.city || '', row.state || '', row.postal_code || '');
      if (!facilityIdsByKey.has(key)) facilityIdsByKey.set(key, []);
      facilityIdsByKey.get(key)!.push(row.id);
    }

    const rl = readline.createInterface({
      input: fs.createReadStream(csvPath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });

    let headers: string[] = [];
    let totalRows = 0;
    let matchedRows = 0;
    let unmatchedRows = 0;
    let ambiguousMatches = 0;
    let unmappedCareRows = 0;

    const matchedFacilityIds = new Set<string>();
    const pairSet = new Set<string>();
    const pairStats = new Map<CanonicalCareSlug, number>();

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

      const stateAbbr = normalizeStateAbbr(row.state_abbr || '', row.state || '');
      const key = toFacilityMatchKey(row.name || '', row.city || '', stateAbbr, row.zip || '');
      const facilityIds = facilityIdsByKey.get(key);

      if (!facilityIds || facilityIds.length === 0) {
        unmatchedRows += 1;
        continue;
      }

      matchedRows += 1;
      if (facilityIds.length > 1) ambiguousMatches += 1;
      const facilityId = facilityIds[0];
      matchedFacilityIds.add(facilityId);

      const careSlug = inferCareTypeSlug(row.care_type || row.license_type || '');
      if (!careSlug) {
        unmappedCareRows += 1;
        continue;
      }

      const careTypeId = careTypeIdBySlug.get(careSlug);
      if (!careTypeId) {
        unmappedCareRows += 1;
        continue;
      }

      pairSet.add(`${facilityId}|${careTypeId}|${careSlug}`);
      pairStats.set(careSlug, (pairStats.get(careSlug) || 0) + 1);
    }

    const allPairs = Array.from(pairSet).map((value) => {
      const [facilityId, careTypeId, careSlug] = value.split('|');
      return { facilityId, careTypeId, careSlug };
    });

    if (replaceMatched && matchedFacilityIds.size > 0) {
      await client.query(
        `
          delete from public.facility_care_types
          where facility_id = any($1::uuid[]);
        `,
        [Array.from(matchedFacilityIds)],
      );
    }

    let insertedPairs = 0;
    for (let i = 0; i < allPairs.length; i += batchSize) {
      const chunk = allPairs.slice(i, i + batchSize);
      const facilityIds = chunk.map((row) => row.facilityId);
      const careTypeIds = chunk.map((row) => row.careTypeId);

      const result = await client.query(
        `
          insert into public.facility_care_types (facility_id, care_type_id)
          select * from unnest($1::uuid[], $2::uuid[])
          on conflict (facility_id, care_type_id) do nothing;
        `,
        [facilityIds, careTypeIds],
      );

      insertedPairs += result.rowCount || 0;
    }

    const summary = {
      csvPath,
      facilitiesInDb: facilitiesRes.rowCount || 0,
      totalRows,
      matchedRows,
      unmatchedRows,
      ambiguousMatches,
      unmappedCareRows,
      matchedFacilityCount: matchedFacilityIds.size,
      distinctFacilityCarePairsPrepared: allPairs.length,
      insertedPairs,
      pairStatsByCareSlug: Object.fromEntries(
        Array.from(pairStats.entries()).sort((a, b) => a[0].localeCompare(b[0])),
      ),
      mode: replaceMatched ? 'replace-matched' : 'upsert',
    };

    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error('Backfill failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
