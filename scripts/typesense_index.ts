import 'dotenv/config';
import Typesense from 'typesense';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const TYPESENSE_HOST = process.env.TYPESENSE_HOST;
const TYPESENSE_PORT = Number(process.env.TYPESENSE_PORT || 443);
const TYPESENSE_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_ADMIN_API_KEY = process.env.TYPESENSE_ADMIN_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}
if (!TYPESENSE_HOST || !TYPESENSE_ADMIN_API_KEY) {
  console.error('Missing Typesense credentials.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const typesense = new Typesense.Client({
  nodes: [{ host: TYPESENSE_HOST, port: TYPESENSE_PORT, protocol: TYPESENSE_PROTOCOL }],
  apiKey: TYPESENSE_ADMIN_API_KEY,
  connectionTimeoutSeconds: 10
});

const collectionName = 'facilities';

const collectionSchema = {
  name: collectionName,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'city', type: 'string', facet: true },
    { name: 'state', type: 'string', facet: true },
    { name: 'postal_code', type: 'string', facet: true },
    { name: 'address_line1', type: 'string', optional: true },
    { name: 'phone', type: 'string', optional: true },
    { name: 'premium_tier', type: 'int32', optional: true, facet: true }
  ]
};

const ensureCollection = async () => {
  try {
    const existing = await typesense.collections(collectionName).retrieve();
    const hasPremium = existing?.fields?.some((field: any) => field?.name === 'premium_tier');
    if (!hasPremium) {
      await typesense.collections(collectionName).delete();
      await typesense.collections().create(collectionSchema as any);
    }
  } catch {
    await typesense.collections().create(collectionSchema as any);
  }
};

const fetchBatch = async (from: number, to: number) => {
  const { data, error } = await supabase
    .from('facilities')
    .select('id,name,city,state,postal_code,address_line1,phone,assigned_plan_owner_id')
    .order('name', { ascending: true })
    .range(from, to);

  if (error) throw error;
  return data || [];
};

const run = async () => {
  await ensureCollection();
  const batchSize = 500;
  let from = 0;

  while (true) {
    const to = from + batchSize - 1;
    const batch = await fetchBatch(from, to);
    if (batch.length === 0) break;

    const documents = batch.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      state: row.state,
      postal_code: row.postal_code,
      address_line1: row.address_line1,
      phone: row.phone,
      premium_tier: row.assigned_plan_owner_id ? 1 : 0
    }));

    await typesense.collections(collectionName).documents().import(documents, { action: 'upsert' });
    console.log(`Indexed ${from + batch.length} facilities...`);

    if (batch.length < batchSize) break;
    from += batchSize;
  }

  console.log('Typesense indexing complete.');
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
