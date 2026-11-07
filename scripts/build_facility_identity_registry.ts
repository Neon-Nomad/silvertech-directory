// Builds the committed facility identity registry and the legacy-facility redirect manifest.
//
// Inputs (produced by scripts/dump_facility_identity_snapshot.ts):
//   --canonical  snapshot from a build with no sitemap hint files (the live-matching output)
//   --legacy     snapshot from a build that reads the pre-April sitemap hint files
// Other inputs:
//   --hint-urls  one legacy facility URL per line (pre-April public/sitemap-facilities-*.xml)
//   --examples   Search Console Not found (404) export CSV; first column is the URL
//   --live-dir   optional directory of live child sitemaps; the canonical set must match it exactly
//
// Outputs:
//   --out-registry  data/facility-identity-registry.json (read by astro-src/lib/seniorLivingData.ts)
//   --out-manifest  data/facility-legacy-redirects.tsv   (read by scripts/generate_redirects.ts)
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const args = new Map<string, string>();
for (let i = 2; i < process.argv.length; i += 2) {
  args.set(process.argv[i].replace(/^--/, ''), process.argv[i + 1]);
}
const need = (name: string): string => {
  const value = args.get(name);
  if (!value) throw new Error(`missing --${name}`);
  return value;
};

const sha256 = (value: string): string => createHash('sha256').update(value).digest('hex');
const short = (value: string): string => sha256(value).slice(0, 32);
const looseKeyOf = (identityKey: string): string => identityKey.split('|').slice(0, 5).join('|');
const pathOf = (urlOrPath: string): string =>
  urlOrPath.trim().replace(/^https?:\/\/silvertechdirectory\.com\//, '').replace(/^\/+|\/+$/g, '');

type Snapshot = {
  path: string;
  identityKey: string;
  stateSlug: string;
  citySlug: string;
  publicSlug: string;
  publicRouteId: number;
  legacyRouteIds: number[];
};

const readSnapshot = (file: string): Snapshot[] =>
  fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Snapshot);

// 1. Canonical set: one path per entity, no duplicates.
const canonical = readSnapshot(need('canonical'));
const canonicalByKey = new Map<string, string>();
const canonicalPaths = new Set<string>();
for (const row of canonical) {
  if (canonicalPaths.has(row.path)) throw new Error(`duplicate canonical path ${row.path}`);
  canonicalPaths.add(row.path);
  canonicalByKey.set(row.identityKey, row.path);
}
const canonicalSorted = [...canonicalPaths].sort();
const canonicalSha = sha256(canonicalSorted.join('\n'));

const liveDir = args.get('live-dir');
if (liveDir) {
  const live = new Set<string>();
  for (const file of fs.readdirSync(liveDir).filter((f) => /^child-sitemap-facilities-\d+\.xml$/.test(f))) {
    const xml = fs.readFileSync(path.join(liveDir, file), 'utf8');
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) live.add(pathOf(match[1]));
  }
  const missing = canonicalSorted.filter((p) => !live.has(p));
  const extra = [...live].filter((p) => !canonicalPaths.has(p));
  if (missing.length || extra.length) {
    throw new Error(`canonical set differs from live: ${missing.length} missing, ${extra.length} extra`);
  }
  console.log(`live match: ${live.size} facility URLs identical`);
}

// 2. Legacy attribution: a legacy (state, city, slug, id) belongs to an entity only when exactly one entity claims it.
const legacy = readSnapshot(need('legacy'));
const claims = new Map<string, Set<string>>();
for (const row of legacy) {
  const canonicalPath = canonicalByKey.get(row.identityKey);
  if (!canonicalPath) continue;
  for (const id of new Set([row.publicRouteId, ...row.legacyRouteIds])) {
    const tuple = [row.stateSlug, row.citySlug, row.publicSlug, id].join('|');
    if (!claims.has(tuple)) claims.set(tuple, new Set());
    claims.get(tuple)!.add(row.identityKey);
  }
}

// 3. Legacy URL universe: pre-April sitemap URLs plus Search Console 404 examples.
const hintUrls = fs.readFileSync(need('hint-urls'), 'utf8').split(/\r?\n/).map(pathOf).filter(Boolean);
const exampleLines = fs.readFileSync(need('examples'), 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
const exampleUrls = exampleLines.map((line) => pathOf(line.split(',')[0].replace(/^"|"$/g, '')));
const exampleSet = new Set(exampleUrls);
const universe = [...new Set([...hintUrls, ...exampleUrls])];

const reasons = new Map<string, number>();
const note = (reason: string) => reasons.set(reason, (reasons.get(reason) || 0) + 1);
const manifest: Array<{ from: string; to: string; evidence: 'google' | 'sitemap'; emit: boolean }> = [];

for (const source of universe) {
  if (canonicalPaths.has(source)) {
    note('already canonical (kept)');
    continue;
  }
  const parts = source.split('/');
  const idMatch = parts.length === 4 ? parts[3].match(/^(.*)-(\d+)$/) : null;
  if (!idMatch) {
    note(parts.length === 4 ? 'no numeric facility id' : 'not facility-detail shape');
    continue;
  }
  const [, slug, id] = idMatch;
  const claimants = claims.get([parts[1], parts[2], slug, Number(id)].join('|'));
  if (!claimants || claimants.size === 0) {
    note('no hint-era entity');
    continue;
  }
  if (claimants.size > 1) {
    note('ambiguous: tuple claimed by several entities');
    continue;
  }
  const [identityKey] = claimants;
  const to = canonicalByKey.get(identityKey)!;
  const evidence = exampleSet.has(source) ? 'google' : 'sitemap';
  manifest.push({ from: source, to, evidence, emit: evidence === 'google' });
  note(`mapped (${evidence})`);
}

// 4. Registry: entity key -> live canonical path. Loose keys are kept only when they are unique.
const looseCounts = new Map<string, number>();
for (const row of canonical) {
  const loose = looseKeyOf(row.identityKey);
  looseCounts.set(loose, (looseCounts.get(loose) || 0) + 1);
}
const entries = canonical
  .map((row) => {
    const loose = looseKeyOf(row.identityKey);
    return {
      k: short(row.identityKey),
      l: looseCounts.get(loose) === 1 ? short(loose) : null,
      p: row.path,
    };
  })
  .sort((a, b) => (a.p < b.p ? -1 : a.p > b.p ? 1 : 0));

const registry = {
  schemaVersion: 1,
  description:
    'Facility identity registry. k = sha256 prefix of the entity match key; l = loose key (without phone) when unique; p = live canonical path. Generated by scripts/build_facility_identity_registry.ts.',
  facilityCount: entries.length,
  canonicalPathsSha256: canonicalSha,
  entries,
};

fs.writeFileSync(need('out-registry'), `${JSON.stringify(registry)}\n`, 'utf8');

manifest.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
const tsv = [
  '# from\tto\tevidence\temit',
  ...manifest.map((row) => `${row.from}\t${row.to}\t${row.evidence}\t${row.emit ? 'yes' : 'no'}`),
];
fs.writeFileSync(need('out-manifest'), `${tsv.join('\n')}\n`, 'utf8');

console.log(`registry entities: ${entries.length}`);
console.log(`loose keys kept unique: ${entries.filter((e) => e.l).length}`);
console.log(`canonicalPathsSha256: ${canonicalSha}`);
console.log(`legacy universe: ${universe.length}`);
for (const [reason, count] of [...reasons.entries()].sort()) console.log(`  ${reason}: ${count}`);
console.log(`manifest rows: ${manifest.length}; emitted to _redirects: ${manifest.filter((m) => m.emit).length}`);
