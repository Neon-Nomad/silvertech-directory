// Cleanup rules for NY listings in the adult-day and assisted-living categories.
// Used to propose batch actions and, through findOutOfScopeListings, as the permanent import gate.
// Batches proposed with these rules are accepted only if the independent validator
// (scripts/validate/validateCategoryBatch.mjs, separate logic) agrees.
import fs from 'node:fs';
import path from 'node:path';

const SCOPE_CARE = new Set(['adult-day-services', 'assisted-living']);
const RESIDENTIAL_ASSISTED_LIVING_TYPES = new Set(['Adult Home', 'Enriched Housing Program', 'Assisted Living Residence', 'Assisted Living Program']);
const NURSING_HOME_TYPES = new Set(['Residential Health Care Facility - SNF']);
const OUT_OF_SCOPE_TYPE = /Clinic|Diagnostic and Treatment|Hospital|Home Care|Home Health|Hospice|Dialysis|Renal/;
const OUT_OF_SCOPE_AUTHORITIES = new Set([
  'OFFICE OF CHILDREN AND FAMILY SERVICES',
  'NYC DEPARTMENT OF HEALTH AND MENTAL HYGIENE',
  'UNLICENSED: SCHOOL-RUN',
  'UNLICENSED: TEEN ONLY',
  'OFFICE FOR PEOPLE WITH DEVELOPMENTAL DISABILITIES',
  'OFFICE OF MENTAL HEALTH',
]);

export function loadRegisters(root) {
  const doh = JSON.parse(fs.readFileSync(path.join(root, 'data/reference/ny-doh-health-facilities-2026-11-10.json'), 'utf8')).records;
  const manifestLines = fs.readFileSync(path.join(root, 'data/manifest/facility-manifest-2026-11-11.tsv'), 'utf8').split(/\r?\n/).filter(Boolean);
  const header = manifestLines[0].split('\t');
  const col = (name) => header.indexOf(name);
  const pagesByDohAndCare = new Map();
  for (const line of manifestLines.slice(1)) {
    const c = line.split('\t');
    const facId = c[col('ny_doh_fac_id')];
    if (!facId) continue;
    const key = `${facId}|${c[col('care')]}`;
    if (!pagesByDohAndCare.has(key)) pagesByDohAndCare.set(key, []);
    pagesByDohAndCare.get(key).push(c[col('path')]);
  }
  for (const list of pagesByDohAndCare.values()) list.sort();
  return {
    dohByFacId: new Map(doh.map((r) => [String(r.fac_id), r])),
    dohByOpcert: new Map(doh.filter((r) => r.opcert_num).map((r) => [r.opcert_num, r])),
    pagesByDohAndCare,
  };
}

const registerRecord = (license, registers) => {
  const lic = String(license || '').trim();
  if (!lic) return undefined;
  return /^\d+$/.test(lic) ? registers.dohByFacId.get(lic) : registers.dohByOpcert.get(lic);
};

const move = (listing, record, targetCare, registers) => {
  const existing = (registers.pagesByDohAndCare.get(`${record.fac_id}|${targetCare}`) || []).filter((p) => p !== listing.path);
  return existing.length ? `consolidate:${existing[0]}` : `reclassify:${targetCare}`;
};

// Returns 'unchanged', 'keep', 'retire', 'reclassify:<care>' or 'consolidate:<existing path>'.
export function classifyNyListing(listing, registers) {
  if (listing.state !== 'NY' || !SCOPE_CARE.has(listing.currentCare)) return 'unchanged';
  const record = registerRecord(listing.license, registers);
  if (record) {
    if (RESIDENTIAL_ASSISTED_LIVING_TYPES.has(record.description)) {
      return listing.currentCare === 'assisted-living' ? 'keep' : move(listing, record, 'assisted-living', registers);
    }
    if (NURSING_HOME_TYPES.has(record.description)) return move(listing, record, 'nursing-homes', registers);
    if (OUT_OF_SCOPE_TYPE.test(record.description)) return 'retire';
    return 'unchanged';
  }
  if (OUT_OF_SCOPE_AUTHORITIES.has(String(listing.license || '').trim())) return 'retire';
  return 'unchanged';
}

// Import gate: listings that the rules say must not be published.
export function findOutOfScopeListings(listings, registers) {
  return listings.filter((listing) => classifyNyListing(listing, registers) === 'retire');
}

// Import gate (full): listings that must not appear as new pages — out-of-scope listings, and duplicates of a
// registered facility that already has a page in the correct care type.
export function findGateViolations(listings, registers) {
  const violations = [];
  for (const listing of listings) {
    const decision = classifyNyListing(listing, registers);
    if (decision === 'retire' || decision.startsWith('consolidate:')) violations.push({ path: listing.path, decision });
  }
  return violations;
}
