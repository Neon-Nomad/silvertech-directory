// Build gate: no facility page may be produced that the cleanup rules reject, unless it is part of the frozen
// baseline (existing pages are handled through reviewed batches, not by the gate).
// Fails the build when a new import reintroduces an out-of-scope listing or a duplicate of an existing page,
// or when a page retired or consolidated by an approved batch is produced again.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const store: any = await import(pathToFileURL(path.join(root, 'astro-src/lib/seniorLivingData.ts')).href);
const rules: any = await import(pathToFileURL(path.join(root, 'scripts/lib/nyCategoryRules.mjs')).href);

const manifestLines = fs.readFileSync(path.join(root, 'data/manifest/facility-manifest-2026-11-11.tsv'), 'utf8').split(/\r?\n/).filter(Boolean);
const pathCol = manifestLines[0].split('\t').indexOf('path');
const baseline = new Set(manifestLines.slice(1).map((l) => l.split('\t')[pathCol]));

const batchDir = path.join(root, 'data/category-batches');
const removed = new Set(
  fs.readdirSync(batchDir).filter((f) => f.endsWith('.tsv'))
    .flatMap((f) => fs.readFileSync(path.join(batchDir, f), 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split('\t')))
    .filter(([, action]) => action === 'retire' || action.startsWith('consolidate:'))
    .map(([p]) => p),
);

const listings = store.getAllFacilities().map((f: any) => ({
  path: `${f.primaryCareType}/${f.stateSlug}/${f.citySlug}/${f.publicSlug}-${f.publicRouteId}`,
  state: f.state,
  currentCare: f.primaryCareType,
  license: f.licenseNumber || '',
  name: f.name,
  city: f.city,
}));
const problems: string[] = [];
for (const l of listings) if (removed.has(l.path)) problems.push(`page removed by an approved batch is produced again: ${l.path}`);
const fresh = listings.filter((l: any) => !baseline.has(l.path));
for (const v of rules.findGateViolations(fresh, rules.loadRegisters(root))) problems.push(`new listing rejected by the cleanup rules (${v.decision}): ${v.path}`);

// Emptied city pages: every baseline care-type city page that is no longer built must have a 410 rule, only a
// batch may empty a page, and no built or never-existing city page may carry a 410.
const cityBaseline = fs.readFileSync(path.join(root, 'data/manifest/care-city-pages-2026-11-11.txt'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#'));
const builtCities = new Set(store.getCareCityStaticPaths().map((e: any) => `${e.care}/${e.state}/${e.city}`));
const redirectRules = new Set(fs.readFileSync(path.join(root, 'public/_redirects'), 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')));
const batchCities = new Set(
  fs.readdirSync(batchDir).filter((f) => f.endsWith('.tsv'))
    .flatMap((f) => fs.readFileSync(path.join(batchDir, f), 'utf8').split(/\r?\n/).slice(1).filter(Boolean))
    .map((l) => l.split('\t')[0].split('/').slice(0, 3).join('/')),
);
const emptiedCities = new Set(cityBaseline.filter((p) => !builtCities.has(p)));
for (const p of emptiedCities) {
  if (!batchCities.has(p)) problems.push(`city page emptied without an approved batch: ${p}`);
  if (!redirectRules.has(`/${p}/ /410.html 410!`) || !redirectRules.has(`/${p} /410.html 410!`)) problems.push(`emptied city page has no 410 rule: ${p}`);
}
for (const r of redirectRules) {
  const m = r.match(/^\/([a-z-]+\/[a-z0-9-]+\/[a-z0-9-]+)\/? \/410\.html 410!$/);
  if (m && !emptiedCities.has(m[1])) problems.push(`410 rule on a city page that is built or never existed: ${m[1]}`);
}

for (const p of problems.slice(0, 50)) console.error(' - ' + p);
console.log(`import gate: ${listings.length} pages, ${fresh.length} not in the baseline: ${problems.length ? `FAIL (${problems.length})` : 'PASS'}`);
process.exit(problems.length ? 1 : 0);
