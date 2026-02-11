import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type OnlinePresence = {
  website?: string | null;
  google_maps_url?: string | null;
  verified_phone?: string | null;
  business_status?: string | null;
  last_updated?: string | null;
};

type FacilityRecord = {
  name?: string;
  address?: { street?: string; city?: string; state?: string; zip?: string };
  contact?: { phone?: string; phone_formatted?: string };
  online_presence?: OnlinePresence;
};

const normalize = (value?: string | null) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '');

const makeKey = (name?: string | null, address?: string | null, city?: string | null, state?: string | null, zip?: string | null) =>
  `${normalize(name)}|${normalize(address)}|${normalize(city)}|${(state || '').toString().trim().toUpperCase()}|${(zip || '')
    .toString()
    .trim()}`;

const loadFacilitiesWithWebsites = (dirPath: string) => {
  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith('.json'));
  const facilities: Array<FacilityRecord & { state_code?: string }> = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    const data = JSON.parse(raw) as { state_code?: string; facilities?: FacilityRecord[] };
    if (!Array.isArray(data.facilities)) continue;
    for (const facility of data.facilities) {
      facilities.push({ ...facility, state_code: data.state_code });
    }
  }
  return facilities;
};

const fetchAllFacilities = async () => {
  const pageSize = 1000;
  let from = 0;
  const rows: Array<{
    id: string;
    name: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
  }> = [];

  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,address_line1,city,state,postal_code')
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
};

const main = async () => {
  const dirPath = path.resolve(process.cwd(), 'all_facilities_with_websites_complete');
  if (!fs.existsSync(dirPath)) {
    console.error(`Missing directory: ${dirPath}`);
    process.exit(1);
  }

  console.log('Loading facilities with online presence...');
  const inputFacilities = loadFacilitiesWithWebsites(dirPath);

  console.log('Loading facilities from Supabase...');
  const supabaseFacilities = await fetchAllFacilities();
  const facilityMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      address_line1: string | null;
      city: string | null;
      state: string | null;
      postal_code: string | null;
    }
  >();
  for (const row of supabaseFacilities) {
    const key = makeKey(row.name, row.address_line1, row.city, row.state, row.postal_code);
    facilityMap.set(key, row);
  }

  const updates: Array<{
    id: string;
    name: string | null;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    website_url?: string | null;
    google_maps_url?: string | null;
    verified_phone?: string | null;
    business_status?: string | null;
    online_presence_updated_at?: string | null;
  }> = [];

  let matched = 0;
  let skipped = 0;

  for (const facility of inputFacilities) {
    const address = facility.address || {};
    const key = makeKey(
      facility.name,
      address.street,
      address.city,
      address.state || facility.state_code,
      address.zip
    );
    const record = facilityMap.get(key);
    if (!record) {
      skipped += 1;
      continue;
    }
    const online = facility.online_presence;
    if (!online) continue;
    matched += 1;
    updates.push({
      id: record.id,
      name: record.name,
      address_line1: record.address_line1,
      city: record.city,
      state: record.state,
      postal_code: record.postal_code,
      website_url: online.website || null,
      google_maps_url: online.google_maps_url || null,
      verified_phone: online.verified_phone || null,
      business_status: online.business_status || null,
      online_presence_updated_at: online.last_updated || null
    });
  }

  console.log(`Matched ${matched} facilities with online presence. Skipped ${skipped} without match.`);

  const batchSize = 500;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const { error } = await supabase
      .from('facilities')
      .upsert(batch, { onConflict: 'id' });
    if (error) throw error;
    console.log(`Updated ${Math.min(i + batchSize, updates.length)} / ${updates.length}`);
  }

  console.log('Online presence update complete.');
};

main().catch((err) => {
  console.error('Failed to update online presence:', err);
  process.exit(1);
});
