import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.REIT_STORAGE_BUCKET || 'reits';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_* equivalents).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type FacilityRow = {
  id: string;
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  owner_id?: string | null;
  facility_licensing?: Array<{
    bed_capacity?: number | null;
    license_number?: string | null;
    license_status?: string | null;
  }> | null;
  facility_care_types?: Array<{
    care_types?: {
      name?: string | null;
    } | null;
  }> | null;
};

type PricingRow = {
  facility_id: string;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
  observed_on?: string | null;
};

type InspectionRow = {
  facility_id: string;
  inspected_on?: string | null;
  severity?: string | null;
  source?: string | null;
  findings?: string[] | null;
  url?: string | null;
};

const BATCH_SIZE = 200;

function buildAddress(f: FacilityRow) {
  const parts = [
    f.address_line1,
    f.address_line2,
    [f.city, f.state, f.postal_code].filter(Boolean).join(', '),
  ].filter(Boolean);
  return parts.join(', ');
}

function toCsv(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const esc = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'string' ? val : JSON.stringify(val);
    const needsQuote = /[",\n]/.test(str);
    return needsQuote ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => esc((row as any)[h])).join(','));
  }
  return lines.join('\n');
}

async function ensureBucketExists(bucket: string) {
  const { data, error } = await supabase.storage.getBucket(bucket);
  if (!error && data) return;
  await supabase.storage.createBucket(bucket, { public: false });
}

async function insertDataVersion(): Promise<{ id: string; snapshot_date: string }> {
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const label = `Boutique Senior Living Index - ${snapshotDate}`;
  const { data, error } = await supabase
    .from('re_data_versions')
    .insert({ snapshot_date: snapshotDate, label, status: 'in_progress' })
    .select()
    .single();

  if (error || !data) {
    console.error('Failed to create data version:', error?.message);
    process.exit(1);
  }

  return { id: data.id, snapshot_date: snapshotDate };
}

async function fetchFacilities(): Promise<FacilityRow[]> {
  let from = 0;
  const facilities: FacilityRow[] = [];
  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,address_line1,address_line2,city,state,postal_code,latitude,longitude,owner_id')
      .range(from, from + BATCH_SIZE - 1);

    if (error) {
      console.error('Failed to fetch facilities:', error.message);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    facilities.push(...(data as FacilityRow[]));
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }
  return facilities;
}

async function upsertFacilities(versionId: string, facilities: FacilityRow[]) {
  const payload = facilities.map((f) => {
    return {
      id: f.id, // reuse operational id for traceability
      external_id: f.id,
      name: f.name,
      address: buildAddress(f),
      city: f.city,
      state: f.state,
      postal_code: f.postal_code,
      latitude: f.latitude,
      longitude: f.longitude,
      capacity: null,
      care_types: [],
      owner: f.owner_id || null,
      operator: f.owner_id || null,
      license_number: null,
      data_version: versionId,
    };
  });

  const { error } = await supabase.from('re_facilities').upsert(payload, { onConflict: 'id' });
  if (error) {
    console.error('Failed to upsert re_facilities:', error.message);
    process.exit(1);
  }
  return payload.length;
}

async function upsertPricing(versionId: string, _facilities: FacilityRow[]) {
  // No pricing source in current schema; keep no-op to avoid failures.
  return 0;
}

async function upsertInspections(versionId: string) {
  // Placeholder: if you have a source table, map it here.
  // Keeping no-op to avoid failing when no inspections source exists.
  return 0;
}

async function finalizeDataVersion(versionId: string, status: 'published' | 'failed', notes?: string) {
  const { error } = await supabase
    .from('re_data_versions')
    .update({ status, notes })
    .eq('id', versionId);
  if (error) {
    console.error('Failed to update data version status:', error.message);
  }
}

async function generateAndUploadCsv(
  versionId: string,
  snapshotDate: string,
  name: string,
  rows: any[]
) {
  const csv = toCsv(rows);
  const buffer = Buffer.from(csv, 'utf8');
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
  const path = `reits/v${snapshotDate}/${name}.csv`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
    contentType: 'text/csv',
    upsert: true,
  });
  if (error) {
    console.error(`Failed to upload ${name}:`, error.message);
    return null;
  }

  const rowCount = rows.length;
  const bytes = buffer.byteLength;

  const { error: catalogError } = await supabase.from('data_catalog').insert({
    name,
    data_version: versionId,
    format: 'csv',
    url: path,
    bytes,
    row_count: rowCount,
    checksum,
  });
  if (catalogError) {
    console.error(`Failed to register ${name} in data_catalog:`, catalogError.message);
  }

  return { path, bytes, rowCount, checksum };
}

async function fetchCanonicalFacilities(versionId: string) {
  const { data, error } = await supabase
    .from('re_facilities')
    .select('*')
    .eq('data_version', versionId);
  if (error) {
    console.error('Failed to fetch canonical facilities:', error.message);
    return [];
  }
  return data || [];
}

async function fetchCanonicalInspections(versionId: string) {
  const { data, error } = await supabase
    .from('re_inspections')
    .select('*')
    .eq('data_version', versionId);
  if (error) {
    console.error('Failed to fetch canonical inspections:', error.message);
    return [];
  }
  return data || [];
}

async function publish() {
  const { id: versionId, snapshot_date } = await insertDataVersion();
  console.log('New data_version:', versionId, 'snapshot:', snapshot_date);

  try {
    await ensureBucketExists(STORAGE_BUCKET);

    const facilities = await fetchFacilities();
    console.log('Fetched facilities:', facilities.length);

    const facCount = await upsertFacilities(versionId, facilities);
    const priceCount = await upsertPricing(versionId, facilities);
    const inspCount = await upsertInspections(versionId);

    console.log(`Upserted re_facilities=${facCount}, re_pricing=${priceCount}, re_inspections=${inspCount}`);

    // Generate CSV assets from canonical tables
    const canonicalFacilities = await fetchCanonicalFacilities(versionId);
    const canonicalInspections = await fetchCanonicalInspections(versionId);

    await generateAndUploadCsv(versionId, snapshot_date, 'facility_master', canonicalFacilities);
    await generateAndUploadCsv(versionId, snapshot_date, 'regulatory_risk', canonicalInspections);

    await finalizeDataVersion(versionId, 'published', `fac=${facCount}, price=${priceCount}, insp=${inspCount}`);
    console.log('Publish completed.');
  } catch (err: any) {
    console.error('Publish failed:', err?.message || err);
    await finalizeDataVersion(versionId, 'failed', err?.message);
    process.exit(1);
  }
}

publish();
