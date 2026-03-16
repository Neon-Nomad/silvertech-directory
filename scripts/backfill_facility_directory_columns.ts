/**
 * One-time backfill: reads all_senior_living_complete.csv and updates
 * the new directory columns in Supabase (county, beds, ownership_type,
 * license_type, issuing_agency, last_verified_date, data_source).
 *
 * Run once after applying migration 20260316120000_add_facility_directory_columns.sql:
 *   npx tsx scripts/backfill_facility_directory_columns.ts
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Requires SUPABASE_SERVICE_ROLE_KEY (not anon key) to update records.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const CSV_PATH = path.join(ROOT, 'all_senior_living_complete.csv');

if (!fs.existsSync(CSV_PATH)) {
  console.error('all_senior_living_complete.csv not found. Must be run locally.');
  process.exit(1);
}

const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; continue; }
    if (char === '"') { inQuotes = !inQuotes; continue; }
    if (char === ',' && !inQuotes) { fields.push(current); current = ''; continue; }
    current += char;
  }
  fields.push(current);
  return fields;
};

const parseMaybeInt = (value: string): number | null => {
  const n = parseInt(value.trim(), 10);
  return isNaN(n) ? null : n;
};

const parseMaybeDate = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

async function run() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = parseCsvLine(lines[0]);

  const col = (row: string[], name: string) => {
    const idx = header.indexOf(name);
    return idx >= 0 ? (row[idx] || '').trim() : '';
  };

  const BATCH = 200;
  let updated = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i += BATCH) {
    const batch = lines.slice(i, i + BATCH).map((line) => parseCsvLine(line));

    const updates = batch
      .map((row) => {
        const licenseNumber = col(row, 'state_license_number');
        const cmsNumber = col(row, 'cms_certification_number');
        if (!licenseNumber && !cmsNumber) return null;

        return {
          state_license_number: licenseNumber || null,
          cms_certification_number: cmsNumber || null,
          county: col(row, 'county') || null,
          beds: parseMaybeInt(col(row, 'beds')),
          ownership_type: col(row, 'ownership_type') || null,
          license_type: col(row, 'license_type') || null,
          issuing_agency: col(row, 'issuing_agency') || null,
          last_verified_date: parseMaybeDate(col(row, 'last_verified_date')),
          data_source: col(row, 'data_source') || null,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    for (const update of updates) {
      // Match by state_license_number first, then cms_certification_number
      let matchField: string | null = null;
      let matchValue: string | null = null;

      if (update.state_license_number) {
        matchField = 'state_license_number';
        matchValue = update.state_license_number as string;
      } else if (update.cms_certification_number) {
        matchField = 'cms_certification_number';
        matchValue = update.cms_certification_number as string;
      }

      if (!matchField || !matchValue) { skipped++; continue; }

      const { county, beds, ownership_type, license_type, issuing_agency, last_verified_date, data_source } = update;

      const { error } = await supabase
        .from('facilities')
        .update({ county, beds, ownership_type, license_type, issuing_agency, last_verified_date, data_source })
        .eq(matchField, matchValue);

      if (error) {
        console.warn(`Failed to update ${matchField}=${matchValue}: ${error.message}`);
        skipped++;
      } else {
        updated++;
      }
    }

    if (updated % 1000 === 0 && updated > 0) {
      console.log(`Progress: ${updated} updated, ${skipped} skipped...`);
    }
  }

  console.log(`Backfill complete. Updated: ${updated}, Skipped: ${skipped}`);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
