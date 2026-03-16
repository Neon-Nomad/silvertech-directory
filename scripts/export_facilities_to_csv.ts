/**
 * Build-time export: queries Supabase and writes all_senior_living_complete.csv
 * so the Astro static build can generate city/state directory pages.
 *
 * Runs as part of the Netlify build pipeline before npm run build:hybrid.
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'all_senior_living_complete.csv');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY).',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// Maps primary_care_type_slug to a care type name that inferCareType() in
// seniorLivingData.ts will correctly map back to the canonical slug.
const SLUG_TO_CARE_TYPE_NAME: Record<string, string> = {
  'assisted-living': 'Assisted Living',
  'memory-care': 'Memory Care',
  'nursing-homes': 'Nursing Home',
  'independent-living': 'Independent Living',
  'residential-care': 'Residential Care Home',
  'adult-day-services': 'Adult Day Services',
  ccrc: 'CCRC / Life Plan Community',
};

const escapeCsv = (value: string | number | null | undefined): string => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const PAGE_SIZE = 1000;

const CSV_HEADER =
  'name,care_type,state,state_abbr,street,city,zip,county,phone,email,beds,ownership_type,latitude,longitude,state_license_number,cms_certification_number,issuing_agency,license_type,last_verified_date,data_source';

async function exportFacilities(): Promise<void> {
  const rows: string[] = [CSV_HEADER];
  let offset = 0;
  let totalFacilities = 0;

  console.log('Exporting facilities from Supabase...');

  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select(
        // Core columns always present. The directory columns (county, beds,
        // ownership_type, license_type, issuing_agency, last_verified_date,
        // data_source) are added by migration 20260316120000 and backfilled
        // by npm run backfill:directory-columns. They default to null here
        // until that migration is applied.
        'id, name, city, state, address_line1, postal_code, phone, email, latitude, longitude, state_license_number, cms_certification_number, primary_care_type_slug, county, beds, ownership_type, license_type, issuing_agency, last_verified_date, data_source',
      )
      .not('name', 'is', null)
      .not('city', 'is', null)
      .not('state', 'is', null)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Supabase query error:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;

    for (const f of data) {
      const careTypeName =
        SLUG_TO_CARE_TYPE_NAME[f.primary_care_type_slug as string] ?? 'Assisted Living';

      rows.push(
        [
          escapeCsv(f.name),
          escapeCsv(careTypeName),
          escapeCsv(f.state),   // state_abbr used by resolveState()
          escapeCsv(f.state),   // state (same value — resolveState tries abbr first)
          escapeCsv(f.address_line1),
          escapeCsv(f.city),
          escapeCsv(f.postal_code),
          escapeCsv(f.county),
          escapeCsv(f.phone),
          escapeCsv(f.email),
          escapeCsv(f.beds),
          escapeCsv(f.ownership_type),
          escapeCsv(f.latitude),
          escapeCsv(f.longitude),
          escapeCsv(f.state_license_number),
          escapeCsv(f.cms_certification_number),
          escapeCsv(f.issuing_agency),
          escapeCsv(f.license_type),
          escapeCsv(f.last_verified_date),
          escapeCsv(f.data_source),
        ].join(','),
      );
    }

    totalFacilities += data.length;
    console.log(`  Fetched ${totalFacilities} facilities...`);

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  fs.writeFileSync(OUT_PATH, rows.join('\n') + '\n', 'utf-8');
  console.log(`Exported ${totalFacilities} facilities → ${OUT_PATH} (${rows.length - 1} rows)`);
}

exportFacilities().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
