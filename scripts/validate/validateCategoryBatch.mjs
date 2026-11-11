// Independent validator for category-cleanup batches. Deliberately separate from scripts/lib/nyCategoryRules.mjs:
// it re-reads the raw reference data, uses its own evidence rules, and reconciles the published inventory
// against the frozen manifest. Any single error rejects the whole batch.
// Usage (CLI): node scripts/validate/validateCategoryBatch.mjs data/category-batches/<batch>.tsv
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const readLines = (file) => fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nameKey = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Evidence rules (independent of the cleanup rules).
const isSeniorResidentialType = (t) => /^(Adult Home|Enriched Housing|Assisted Living)/.test(t) || /Residential Health Care Facility/.test(t);
const careForType = (t) => (/Residential Health Care Facility/.test(t) ? 'nursing-homes' : /^(Adult Home|Enriched Housing|Assisted Living)/.test(t) ? 'assisted-living' : null);
const CHILD_OR_YOUTH_AUTHORITIES = ['OFFICE OF CHILDREN AND FAMILY SERVICES', 'NYC DEPARTMENT OF HEALTH AND MENTAL HYGIENE', 'UNLICENSED: SCHOOL-RUN', 'UNLICENSED: TEEN ONLY'];
const NON_SENIOR_SERVICE_AUTHORITIES = ['OFFICE FOR PEOPLE WITH DEVELOPMENTAL DISABILITIES', 'OFFICE OF MENTAL HEALTH'];

export function validateCategoryBatch({ root, batch, simulateMissingPages = [] }) {
  const errors = [];
  const doh = JSON.parse(fs.readFileSync(path.join(root, 'data/reference/ny-doh-health-facilities-2026-11-10.json'), 'utf8')).records;
  const ocfs = JSON.parse(fs.readFileSync(path.join(root, 'data/reference/ny-ocfs-child-care-centers-2026-11-11.json'), 'utf8')).records;
  const dohById = new Map(doh.map((r) => [String(r.fac_id), r]));
  const ocfsCenters = new Set(ocfs.map((p) => `${nameKey(p.facility_name)}|${slug(p.city)}`));

  const mLines = readLines(path.join(root, 'data/manifest/facility-manifest-2026-11-11.tsv'));
  const h = mLines[0].split('\t');
  const manifest = new Map(mLines.slice(1).map((l) => { const c = l.split('\t'); return [c[h.indexOf('path')], Object.fromEntries(h.map((k, i) => [k, c[i]]))]; }));

  const inventory = new Set(readLines(path.join(root, 'data/facility-uuid-map.tsv')).slice(1).map((l) => l.split('\t')[0]));
  for (const p of simulateMissingPages) inventory.delete(p);
  const redirects = new Set(readLines(path.join(root, 'public/_redirects')).filter((l) => !l.startsWith('#')));

  const batchPaths = new Set();
  const newPaths = new Set();
  for (const item of batch) {
    const where = `${item.path} (${item.action})`;
    if (batchPaths.has(item.path)) { errors.push(`duplicate batch entry: ${where}`); continue; }
    batchPaths.add(item.path);
    const m = manifest.get(item.path);
    if (!m) { errors.push(`not in the frozen manifest: ${where}`); continue; }
    if (m.state !== 'NY' || !['adult-day-services', 'assisted-living'].includes(m.care)) { errors.push(`outside the approved scope (state ${m.state}, care ${m.care}): ${where}`); continue; }
    const reg = m.ny_doh_fac_id ? dohById.get(m.ny_doh_fac_id) : undefined;
    const type = reg ? reg.description : '';
    const [, state, city, slugId] = item.path.split('/');

    if (item.action === 'retire') {
      if (reg && isSeniorResidentialType(type)) { errors.push(`retiring a registered senior residential facility (${type}): ${where}`); continue; }
      const evidence =
        (reg && !isSeniorResidentialType(type)) ||
        ocfsCenters.has(`${nameKey(m.name)}|${city}`) ||
        CHILD_OR_YOUTH_AUTHORITIES.includes(m.license) ||
        NON_SENIOR_SERVICE_AUTHORITIES.includes(m.license);
      if (!evidence) { errors.push(`no authoritative evidence that this listing is out of scope: ${where}`); continue; }
      if (!redirects.has(`/${item.path}/ /410.html 410!`)) errors.push(`missing 410 rule: ${where}`);
    } else if (item.action.startsWith('consolidate:') || item.action.startsWith('reclassify:')) {
      const expectedCare = reg ? careForType(type) : null;
      if (!expectedCare) { errors.push(`no register type supports moving this listing: ${where}`); continue; }
      const existing = [...manifest.values()].filter((x) => x.path !== item.path && x.care === expectedCare && x.ny_doh_fac_id === m.ny_doh_fac_id).map((x) => x.path).sort();
      let target;
      if (item.action.startsWith('consolidate:')) {
        target = item.action.slice('consolidate:'.length);
        const t = manifest.get(target);
        if (!t || t.care !== expectedCare || t.ny_doh_fac_id !== m.ny_doh_fac_id) { errors.push(`consolidation target is not the same registered facility in ${expectedCare}: ${where}`); continue; }
        if (!inventory.has(target)) errors.push(`consolidation target is not published: ${where}`);
      } else {
        const care = item.action.slice('reclassify:'.length);
        if (care !== expectedCare) { errors.push(`register type ${type} implies ${expectedCare}, not ${care}: ${where}`); continue; }
        if (existing.length) { errors.push(`would duplicate existing page ${existing[0]}; consolidate instead: ${where}`); continue; }
        target = `${care}/${state}/${city}/${slugId}`;
        newPaths.add(target);
        if (!inventory.has(target)) errors.push(`reclassified page not published at ${target}: ${where}`);
      }
      const rule = [...redirects].find((r) => r.startsWith(`/${item.path}/ `));
      if (!rule || !rule.includes(` /${target}/ `) || !rule.endsWith(' 301!')) errors.push(`missing 301 to /${target}/: ${where}`);
    } else {
      errors.push(`action not allowed in a batch: ${where}`);
      continue;
    }
    if (inventory.has(item.path)) errors.push(`still published: ${where}`);
  }

  // Full reconciliation: nothing outside the batch may change.
  for (const p of manifest.keys()) {
    if (!batchPaths.has(p) && !inventory.has(p)) errors.push(`page outside the batch is missing: ${p}`);
  }
  for (const p of inventory) {
    if (!manifest.has(p) && !newPaths.has(p)) errors.push(`unexpected new page outside the batch: ${p}`);
  }
  return { ok: errors.length === 0, errors };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const file = process.argv[2];
  const batch = readLines(file).slice(1).map((l) => { const [p, action] = l.split('\t'); return { path: p, action }; });
  const result = validateCategoryBatch({ root: process.cwd(), batch });
  for (const e of result.errors.slice(0, 50)) console.error(' - ' + e);
  console.log(result.ok ? `ACCEPTED: ${batch.length} records` : `REJECTED: ${result.errors.length} problem(s); the whole batch is rejected`);
  process.exit(result.ok ? 0 : 1);
}
