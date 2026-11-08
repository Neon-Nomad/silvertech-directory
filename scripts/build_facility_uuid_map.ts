// Builds data/facility-uuid-map.tsv: one row per canonical facility identity, mapped to a Supabase UUID
// only when the evidence is unambiguous. Run from the repository root:
//   npx tsx scripts/build_facility_uuid_map.ts
// Reads public facility listings with the anon key from .env (read-only). Writes only the two data files.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  matchIdentities,
  reconcile,
  serialize,
  summarize,
  type Decision,
  type DatabaseRow,
  type StaticIdentity,
} from './lib/facilityUuidMap';

const root = process.cwd();
const MAP_PATH = path.join(root, 'data/facility-uuid-map.tsv');
const META_PATH = path.join(root, 'data/facility-uuid-map.meta.json');
const DECISIONS_PATH = path.join(root, 'data/facility-uuid-decisions.json');
const COLUMNS = 'id,name,address_line1,city,state,postal_code,phone,state_license_number,cms_certification_number';

function readEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const file = path.join(root, '.env');
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/["\r]/g, '');
  }
  return env;
}

async function fetchDatabaseRows(): Promise<DatabaseRow[]> {
  const env = { ...readEnv(), ...process.env } as Record<string, string>;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required (public anon values only)');
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const rows: DatabaseRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${url}/rest/v1/facilities?select=${COLUMNS}&order=id&limit=1000&offset=${offset}`, { headers });
    if (!res.ok) throw new Error(`facilities read failed at offset ${offset}: HTTP ${res.status}`);
    const page = (await res.json()) as DatabaseRow[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

async function loadStaticIdentities(): Promise<StaticIdentity[]> {
  const store: any = await import(pathToFileURL(path.join(root, 'astro-src/lib/seniorLivingData.ts')).href);
  return store.getAllFacilities().map((f: any) => ({
    path: `${f.primaryCareType}/${f.stateSlug}/${f.citySlug}/${f.publicSlug}-${f.publicRouteId}`,
    name: f.name,
    city: f.city,
    state: f.state,
    street: f.street ?? null,
    zip: f.zip ?? null,
    phone: f.phone ?? null,
    licenseNumber: f.licenseNumber ?? null,
    cmsCertificationNumber: f.cmsCertificationNumber ?? null,
  }));
}

async function main() {
  const statics = await loadStaticIdentities();
  const database = await fetchDatabaseRows();
  const decisions: Decision[] = fs.existsSync(DECISIONS_PATH) ? JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf8')) : [];
  const rows = reconcile(matchIdentities(statics, database), decisions);
  const text = serialize(rows);
  const dbDigest = crypto.createHash('sha256').update(JSON.stringify([...database].sort((a, b) => (a.id < b.id ? -1 : 1)))).digest('hex');
  const meta = {
    schemaVersion: 1,
    canonicalIdentities: statics.length,
    databaseRows: database.length,
    databaseRowsSha256: dbDigest,
    decisionsApplied: decisions.length,
    mapSha256: crypto.createHash('sha256').update(text).digest('hex'),
    summary: summarize(rows),
  };
  fs.writeFileSync(MAP_PATH, text);
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2) + '\n');
  console.log(JSON.stringify(meta.summary, null, 2));
  console.log(`wrote ${path.relative(root, MAP_PATH)} (${rows.length} rows) and ${path.relative(root, META_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
