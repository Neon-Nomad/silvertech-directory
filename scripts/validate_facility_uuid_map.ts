// Validates data/facility-uuid-map.tsv against the canonical identities, the reviewed decisions, and its provenance.
// Exit status 1 on any problem. Run from the repository root:
//   npx tsx scripts/validate_facility_uuid_map.ts
//   npx tsx scripts/validate_facility_uuid_map.ts --previous <older map file> --reviewed <file of paths>
//   npx tsx scripts/validate_facility_uuid_map.ts --verify-live   (also checks each mapped UUID against the database)
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, validate, type Decision, type DatabaseRow, type StaticIdentity } from './lib/facilityUuidMap';

const root = process.cwd();
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const MAP_PATH = path.join(root, 'data/facility-uuid-map.tsv');
const META_PATH = path.join(root, 'data/facility-uuid-map.meta.json');
const DECISIONS_PATH = path.join(root, 'data/facility-uuid-decisions.json');

async function loadStatics(): Promise<StaticIdentity[]> {
  const store: any = await import(pathToFileURL(path.join(root, 'astro-src/lib/seniorLivingData.ts')).href);
  return store.getAllFacilities().map((f: any) => ({
    path: `${f.primaryCareType}/${f.stateSlug}/${f.citySlug}/${f.publicSlug}-${f.publicRouteId}`,
    name: f.name, city: f.city, state: f.state,
    street: f.street ?? null, zip: f.zip ?? null, phone: f.phone ?? null,
    licenseNumber: f.licenseNumber ?? null, cmsCertificationNumber: f.cmsCertificationNumber ?? null,
  }));
}

async function liveRows(uuids: string[]): Promise<DatabaseRow[]> {
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n')) {
    const m = line.match(/^(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/["\r]/g, '');
  }
  const headers = { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` };
  const out: DatabaseRow[] = [];
  for (let i = 0; i < uuids.length; i += 60) {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/facilities?select=id,name,city,state,address_line1,postal_code,phone,state_license_number,cms_certification_number&id=in.(${uuids.slice(i, i + 60).join(',')})`, { headers });
    if (!res.ok) throw new Error(`live check failed: HTTP ${res.status}`);
    out.push(...((await res.json()) as DatabaseRow[]));
  }
  return out;
}

async function main() {
  const problems: string[] = [];
  const text = fs.readFileSync(MAP_PATH, 'utf8');
  const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
  if (crypto.createHash('sha256').update(text).digest('hex') !== meta.mapSha256) {
    problems.push('map file does not match its provenance hash (edited by hand, or meta not regenerated)');
  }
  const rows = parse(text);
  const statics = await loadStatics();
  const decisions: Decision[] = fs.existsSync(DECISIONS_PATH) ? JSON.parse(fs.readFileSync(DECISIONS_PATH, 'utf8')) : [];
  for (const d of decisions) if (!d.approvedBy) problems.push(`decision without approver: ${d.path}`);

  let previous: ReturnType<typeof parse> | undefined;
  const prevFile = flag('--previous');
  if (prevFile) previous = parse(fs.readFileSync(prevFile, 'utf8'));
  const reviewedFile = flag('--reviewed');
  const reviewed = reviewedFile ? fs.readFileSync(reviewedFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean) : [];

  const verifyLive = args.includes('--verify-live');
  const database = verifyLive ? await liveRows(rows.filter((r) => r.status === 'mapped').map((r) => (r as any).uuid)) : undefined;

  problems.push(...validate({ rows, canonicalPaths: statics.map((s) => s.path), statics, decisions, previous, reviewedChanges: reviewed, database }));

  if (problems.length) {
    console.error(`facility UUID map: ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 200)) console.error(' - ' + p);
    process.exit(1);
  }
  console.log(`facility UUID map: ${rows.length} identities, ${rows.filter((r) => r.status === 'mapped').length} mapped, all checks passed${verifyLive ? ' (live database verified)' : ''}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
