// Regenerates the facility UUID map from the current facility data, and promotes it only after review.
// Run from the repository root. The workflow and its review rules are in docs/uuid-map-maintenance.md.
//
//   npx tsx scripts/build_facility_uuid_map.ts
//       Builds a candidate in .cache/facility-uuid-map/, compares it with the committed map, and reports every
//       identity change. Writes nothing under data/. Exits 1 when the candidate has unreviewed identity changes.
//
//   npx tsx scripts/build_facility_uuid_map.ts --reviewed docs/uuid-map-reviews/<file>.tsv --promote
//       Re-runs the same checks against the reviewed file, and installs the candidate into data/ only if every
//       identity change is listed in the reviewed file.
//
// Inputs: all_senior_living_complete.csv (run `npm run export-facilities` first) and the public anon key in .env.
// The anon key is used on purpose: this script is read-only and never needs the service role.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  changesAgainst,
  matchIdentities,
  parse,
  parseReviewed,
  reconcile,
  serialize,
  summarize,
  validate,
  type Decision,
  type DatabaseRow,
  type MapRow,
  type StaticIdentity,
} from './lib/facilityUuidMap';

const root = process.cwd();
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const MAP_PATH = path.join(root, 'data/facility-uuid-map.tsv');
const META_PATH = path.join(root, 'data/facility-uuid-map.meta.json');
const DECISIONS_PATH = path.join(root, 'data/facility-uuid-decisions.json');
const CACHE_DIR = path.join(root, '.cache/facility-uuid-map');
const COLUMNS = 'id,name,address_line1,city,state,postal_code,phone,state_license_number,cms_certification_number';
// A candidate with fewer than this share of the committed identities is treated as a broken input, not a change.
const MIN_IDENTITY_SHARE = 0.9;
// More identity changes than this in one update are split up, not reviewed as a single batch.
const MAX_REVIEWABLE_CHANGES = 200;

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

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

function describe(rows: MapRow[]) {
  return summarize(rows);
}

async function main() {
  const promote = args.includes('--promote');
  const reviewedFile = flag('--reviewed');

  const statics = await loadStaticIdentities();
  if (statics.length === 0) {
    throw new Error('no static facility identities loaded: run `npm run export-facilities` first (refusing to write an empty map)');
  }
  const database = await fetchDatabaseRows();
  if (database.length === 0) throw new Error('the facilities read returned no rows (refusing to write an empty map)');

  const committed: MapRow[] = parse(fs.readFileSync(MAP_PATH, 'utf8'));
  if (committed.length && statics.length < committed.length * MIN_IDENTITY_SHARE) {
    throw new Error(`identities fell from ${committed.length} to ${statics.length} (more than ${Math.round((1 - MIN_IDENTITY_SHARE) * 100)}% drop): investigate the export before regenerating`);
  }

  const decisions: Decision[] = fs.existsSync(DECISIONS_PATH) ? JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf8')) : [];
  const rows = reconcile(matchIdentities(statics, database), decisions);
  const text = serialize(rows);
  const staticsDigest = sha256(statics.map((s) => s.path).sort().join('\n'));
  const dbDigest = sha256(JSON.stringify([...database].sort((a, b) => (a.id < b.id ? -1 : 1))));
  const meta = {
    schemaVersion: 1,
    canonicalIdentities: statics.length,
    canonicalPathsSha256: staticsDigest,
    databaseRows: database.length,
    databaseRowsSha256: dbDigest,
    decisionsApplied: decisions.length,
    mapSha256: sha256(text),
    summary: describe(rows),
  };

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, 'candidate.tsv'), text);
  fs.writeFileSync(path.join(CACHE_DIR, 'candidate.meta.json'), JSON.stringify(meta, null, 2) + '\n');

  const reviewed = reviewedFile ? parseReviewed(fs.readFileSync(path.join(root, reviewedFile), 'utf8')) : [];
  const changes = changesAgainst(committed, rows);
  const reviewable = changes.filter((c) => c.needsReview);
  if (reviewable.length > MAX_REVIEWABLE_CHANGES) {
    throw new Error(`${reviewable.length} identity changes need review in one update (limit ${MAX_REVIEWABLE_CHANGES}): split the update or investigate the input before regenerating`);
  }
  const problems = validate({
    rows,
    canonicalPaths: statics.map((s) => s.path),
    database,
    statics,
    decisions,
    previous: committed,
    reviewedChanges: reviewed.map((r) => r.path),
    requireComplete: true,
  });

  console.log(JSON.stringify({ committed: summarize(committed).counts, candidate: meta.summary.counts, identityChanges: changes.length, needingReview: changes.filter((c) => c.needsReview).length }, null, 2));
  for (const c of reviewable.slice(0, 50)) console.log(` change: ${c.path} | ${c.before ?? 'new'} -> ${c.after ?? 'removed'}`);
  if (reviewable.length > 50) console.log(` ... ${reviewable.length - 50} more (see the candidate under .cache)`);
  console.log(`candidate written to ${path.relative(root, path.join(CACHE_DIR, 'candidate.tsv'))}`);

  if (problems.length) {
    console.error(`candidate rejected: ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 200)) console.error(' - ' + p);
    process.exit(1);
  }

  if (!promote) {
    console.log(changes.length === 0 ? 'candidate is identical to the committed map: nothing to promote' : 'candidate passed; review the changes, then rerun with --reviewed <file> --promote to install it');
    return;
  }

  fs.writeFileSync(MAP_PATH, text);
  fs.writeFileSync(META_PATH, JSON.stringify({ ...meta, reviewedChanges: reviewed.length, reviewedBy: [...new Set(reviewed.map((r) => r.reviewer))] }, null, 2) + '\n');
  console.log(`installed ${path.relative(root, MAP_PATH)} and ${path.relative(root, META_PATH)} (${rows.length} rows, ${changes.length} identity changes reviewed)`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
