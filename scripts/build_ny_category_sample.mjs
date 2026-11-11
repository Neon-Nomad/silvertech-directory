// Builds the fixed, independently evidenced sample for the NY category cleanup tests.
// Deterministic: within each category, candidates are sorted by path and the first N with evidence are taken.
import fs from 'node:fs';

const [,, MASTER, DOH, OCFS, OUT] = process.argv;
const parse = (l) => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
const lines = fs.readFileSync(MASTER, 'utf8').split(/\r?\n/).filter(Boolean);
const h = parse(lines[0]);
const rows = lines.slice(1).map((l) => Object.fromEntries(parse(l).map((v, i) => [h[i], v]))).sort((a, b) => (a.facility_id < b.facility_id ? -1 : 1));
const doh = JSON.parse(fs.readFileSync(DOH, 'utf8'));
const ocfs = JSON.parse(fs.readFileSync(OCFS, 'utf8'));
const byFacId = new Map(doh.map((r) => [String(r.fac_id), r]));
const byOpcert = new Map(doh.filter((r) => r.opcert_num).map((r) => [r.opcert_num, r]));
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ocfsKey = new Map(ocfs.map((p) => [`${norm(p.facility_name)}|${norm(p.city)}`, p]));
const lic = (r) => ((r.alternate_identifiers || '').match(/state_license=([^;]+)/) || [, ''])[1].trim();
const reg = (r) => { const l = lic(r); return /^\d+$/.test(l) ? byFacId.get(l) : byOpcert.get(l); };
const namesAgree = (a, b) => norm(a).slice(0, 10) === norm(b).slice(0, 10);

// Existing canonical pages per (NY DOH facility, care type). A reclassification into a care type where the same
// registered facility already has a page is a consolidation (301 to that page), never a second page.
const pagesByDohAndCare = new Map();
for (const r of rows) {
  if (r.state !== 'NY') continue;
  const d = reg(r);
  if (!d) continue;
  const k = `${d.fac_id}|${r.care_type}`;
  if (!pagesByDohAndCare.has(k)) pagesByDohAndCare.set(k, []);
  pagesByDohAndCare.get(k).push(r.facility_id);
}
const reclassifyExpectation = (r, targetCare) => {
  const existing = pagesByDohAndCare.get(`${reg(r).fac_id}|${targetCare}`) || [];
  return existing.length ? `consolidate:${existing[0]}` : `reclassify:${targetCare}`;
};

const base = (r) =>({ path: r.facility_id, name: r.facility_name, state: r.state, city: r.city, currentCare: r.care_type, license: lic(r), uuid: r.supabase_facility_id || null });
const pick = (n, filter, make) => rows.filter(filter).slice(0, n).map((r) => ({ ...base(r), ...make(r) }));
const regEvidence = (r) => { const d = reg(r); return { source: 'NY DOH Health Facility General Information (health.data.ny.gov vn5v-hh5r), retrieved 2026-11-10', id: String(d.fac_id), type: d.description, registeredName: d.facility_name }; };
const isNY = (care) => (r) => r.state === 'NY' && r.care_type === care && r.identity_mapping_status === 'mapped';
const regType = (types) => (r) => { const d = reg(r); return d && types.includes(d.description) && namesAgree(d.facility_name, r.facility_name); };

const sample = [
  ...pick(6, (r) => isNY('assisted-living')(r) && regType(['Adult Home', 'Enriched Housing Program'])(r), (r) => ({ category: 'legit_ny_assisted_living', expected: 'keep', evidence: regEvidence(r) })),
  ...pick(3, (r) => isNY('adult-day-services')(r) && regType(['Adult Home', 'Enriched Housing Program'])(r), (r) => ({ category: 'ny_adult_day_is_assisted_living', expected: reclassifyExpectation(r, 'assisted-living'), evidence: regEvidence(r) })),
  ...pick(3, (r) => isNY('adult-day-services')(r) && regType(['Residential Health Care Facility - SNF'])(r), (r) => ({ category: 'ny_adult_day_is_nursing_home', expected: reclassifyExpectation(r, 'nursing-homes'), evidence: regEvidence(r) })),
  // All NY assisted-living rows that resolve to a nursing home are unresolved identities (duplicate DB rows),
  // so this category deliberately includes unresolved pages: they are published and must be handled too.
  ...pick(2, (r) => r.state === 'NY' && r.care_type === 'assisted-living' && regType(['Residential Health Care Facility - SNF'])(r), (r) => ({ category: 'ny_assisted_living_is_nursing_home', expected: reclassifyExpectation(r, 'nursing-homes'), evidence: regEvidence(r) })),
  ...pick(6, (r) => isNY('adult-day-services')(r) && regType(['Hospital Extension Clinic', 'Diagnostic and Treatment Center', 'Licensed Home Care Services Agency', 'School Based Hospital Extension Clinic'])(r), (r) => ({ category: 'ny_adult_day_is_clinic_or_agency', expected: 'retire', evidence: regEvidence(r) })),
  ...pick(6, (r) => isNY('assisted-living')(r) && lic(r) === 'OFFICE OF CHILDREN AND FAMILY SERVICES' && ocfsKey.has(`${norm(r.facility_name)}|${norm(r.city)}`), (r) => { const p = ocfsKey.get(`${norm(r.facility_name)}|${norm(r.city)}`); return { category: 'ny_assisted_living_is_child_care', expected: 'retire', evidence: { source: 'NY OCFS Child Care Regulated Programs (data.ny.gov cb42-qumz), retrieved 2026-11-11', id: p.facility_id, type: `child care program type ${p.program_type}` } }; }),
  ...pick(3, (r) => isNY('assisted-living')(r) && lic(r) === 'UNLICENSED: SCHOOL-RUN' && /\b(p\.?s\.?|school|academy)\b/i.test(r.facility_name), (r) => ({ category: 'ny_assisted_living_is_school_program', expected: 'retire', evidence: { source: 'source licence authority field', id: '', type: 'UNLICENSED: SCHOOL-RUN; name identifies a school' } })),
  ...pick(3, (r) => isNY('assisted-living')(r) && lic(r) === 'OFFICE FOR THE AGING', (r) => ({ category: 'ambiguous_office_for_the_aging', expected: 'unchanged', evidence: { source: 'source licence authority field', id: '', type: 'OFFICE FOR THE AGING (possible senior program; needs manual review)' } })),
  ...pick(3, (r) => r.state !== 'NY' && r.care_type === 'adult-day-services' && r.identity_mapping_status === 'mapped', (r) => ({ category: 'control_adult_day_outside_ny', expected: 'unchanged', evidence: { source: 'outside cleanup scope (state is not NY)', id: '', type: '' } })),
  ...pick(3, (r) => r.state === 'NY' && r.care_type === 'nursing-homes' && r.identity_mapping_status === 'mapped', (r) => ({ category: 'control_ny_nursing_home', expected: 'unchanged', evidence: { source: 'outside cleanup scope (care type not in scope)', id: '', type: '' } })),
  ...pick(2, (r) => r.state === 'CA' && r.care_type === 'assisted-living' && r.identity_mapping_status === 'mapped', (r) => ({ category: 'control_assisted_living_outside_ny', expected: 'unchanged', evidence: { source: 'outside cleanup scope (state is not NY)', id: '', type: '' } })),
];
fs.writeFileSync(OUT, JSON.stringify({ description: 'Fixed, independently evidenced sample for the NY category cleanup. Do not edit expectations without documented approval.', createdAt: '2026-11-11', records: sample }, null, 2) + '\n');
const byCat = {}; for (const s of sample) byCat[s.category] = (byCat[s.category] || 0) + 1;
console.log(JSON.stringify(byCat, null, 1));
for (const s of sample) console.log(`${s.expected.padEnd(26)} ${s.name.slice(0, 48).padEnd(48)} | ${s.evidence.type.slice(0, 55)}`);
