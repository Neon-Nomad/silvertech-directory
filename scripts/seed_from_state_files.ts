import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../all_51_states_facilities');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Ensure .env has VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const AUTHORITIES: Record<string, string> = {
  'CO': 'Colorado Department of Public Health and Environment',
  'AZ': 'Arizona Department of Health Services',
  'FL': 'Florida Agency for Health Care Administration',
  'TX': 'Texas Health and Human Services',
  'PA': 'Pennsylvania Department of Human Services',
  'AK': 'Alaska Department of Health',
  'NC': 'NC Department of Health and Human Services',
  'IL': 'Illinois Department of Public Health',
  'NY': 'New York State Department of Health',
  'AL': 'Alabama Department of Public Health',
  'HI': 'Hawaii Department of Health'
};

const makeKey = (name: string, address: string | null, city: string | null, state: string | null) =>
  `${name || ''}|${address || ''}|${city || ''}|${state || ''}`.toLowerCase();

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

async function resetTables() {
  console.log('Clearing facility_licensing and facilities...');
  const { error: licErr } = await supabase.from('facility_licensing').delete().neq('id', ZERO_UUID);
  if (licErr) throw licErr;
  const { error: facErr } = await supabase.from('facilities').delete().neq('id', ZERO_UUID);
  if (facErr) throw facErr;
}

async function seed() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`Data directory not found: ${DATA_DIR}`);
    process.exit(1);
  }

  await resetTables();

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} state files.`);

  let totalFacilities = 0;

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    const stateCode = data.state_code || (data.state || '').slice(0, 2).toUpperCase();
    const facilities = Array.isArray(data.facilities) ? data.facilities : [];

    console.log(`Seeding ${file} (${facilities.length} facilities)...`);

    const batchSize = 200;
    for (let i = 0; i < facilities.length; i += batchSize) {
      const batch = facilities.slice(i, i + batchSize);
      const facilityRows = batch
        .filter((f: any) => f?.name)
        .map((f: any) => ({
          name: f.name,
          address_line1: f.address?.street || null,
          address_line2: null,
          city: f.address?.city || null,
          state: (f.address?.state || stateCode || '').toUpperCase(),
          postal_code: f.address?.zip || null,
          latitude: f.location?.latitude ?? null,
          longitude: f.location?.longitude ?? null,
          phone: f.contact?.phone_formatted || f.contact?.phone || null,
          created_at: new Date().toISOString()
        }));

      if (facilityRows.length === 0) continue;

      const { data: inserted, error } = await supabase
        .from('facilities')
        .insert(facilityRows)
        .select('id,name,address_line1,city,state');

      if (error) {
        console.error('Insert error:', error.message);
        continue;
      }

      const idMap = new Map<string, string>();
      inserted?.forEach((row: any) => {
        idMap.set(makeKey(row.name, row.address_line1, row.city, row.state), row.id);
      });

      const licensingRows = batch
        .filter((f: any) => f?.name)
        .map((f: any) => {
          const state = (f.address?.state || stateCode || '').toUpperCase();
          const key = makeKey(f.name, f.address?.street || null, f.address?.city || null, state);
          const facilityId = idMap.get(key);
          if (!facilityId) return null;
          const bedsRaw = f.facility_details?.certified_beds;
          const bedCapacity = bedsRaw !== undefined && bedsRaw !== null ? parseInt(bedsRaw, 10) : null;
          return {
            facility_id: facilityId,
            license_number: f.license_number || null,
            bed_capacity: Number.isFinite(bedCapacity) ? bedCapacity : null,
            authority: AUTHORITIES[state] || 'State Licensing Board'
          };
        })
        .filter(Boolean);

      if (licensingRows.length > 0) {
        const { error: licError } = await supabase
          .from('facility_licensing')
          .insert(licensingRows as any[]);
        if (licError) {
          console.error('Licensing insert error:', licError.message);
        }
      }

      totalFacilities += facilityRows.length;
      if (totalFacilities % 1000 < batchSize) {
        console.log(`Inserted ${totalFacilities} facilities so far...`);
      }
    }
  }

  console.log(`Done. Total facilities inserted: ${totalFacilities}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
