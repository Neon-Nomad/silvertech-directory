// Writes the frozen source-of-truth manifest: one row per canonical facility identity.
// It is a snapshot. Never edit or regenerate a dated manifest; write a new dated file instead.
// Usage: node scripts/manifest/build_facility_manifest.mjs <master.csv> <out.tsv>
//   master.csv: the canonical facility export (one row per identity in data/facility-uuid-map.tsv).
import fs from 'node:fs';
import path from 'node:path';

const [,, MASTER, OUT] = process.argv;
const root = process.cwd();
const parse = (l) => { const o = []; let c = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(c); c = ''; } else c += ch; } o.push(c); return o; };
const lines = fs.readFileSync(MASTER, 'utf8').split(/\r?\n/).filter(Boolean);
const header = parse(lines[0]);
const rows = lines.slice(1).map((l) => Object.fromEntries(parse(l).map((v, i) => [header[i], v])));

const doh = JSON.parse(fs.readFileSync(path.join(root, 'data/reference/ny-doh-health-facilities-2026-11-10.json'), 'utf8')).records;
const byFacId = new Map(doh.map((r) => [String(r.fac_id), r]));
const byOpcert = new Map(doh.filter((r) => r.opcert_num).map((r) => [r.opcert_num, r]));

const mapPaths = new Set(fs.readFileSync(path.join(root, 'data/facility-uuid-map.tsv'), 'utf8').split(/\r?\n/).slice(1).map((l) => l.split('\t')[0]).filter(Boolean));
const clean = (v) => String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();

const out = [['path', 'uuid', 'care', 'state', 'name', 'license', 'ny_doh_fac_id', 'ny_doh_type', 'status'].join('\t')];
let missingFromMap = 0;
for (const r of rows.sort((a, b) => (a.facility_id < b.facility_id ? -1 : 1))) {
  if (!mapPaths.has(r.facility_id)) missingFromMap++;
  const lic = ((r.alternate_identifiers || '').match(/state_license=([^;]+)/) || [, ''])[1].trim();
  const reg = r.state === 'NY' ? (/^\d+$/.test(lic) ? byFacId.get(lic) : byOpcert.get(lic)) : undefined;
  out.push([r.facility_id, r.supabase_facility_id, r.care_type, r.state, r.facility_name, lic, reg ? reg.fac_id : '', reg ? reg.description : '', 'live'].map(clean).join('\t'));
}
if (missingFromMap) throw new Error(`${missingFromMap} export rows are not canonical identities in data/facility-uuid-map.tsv`);
if (out.length - 1 !== mapPaths.size) throw new Error(`manifest has ${out.length - 1} rows but the identity map has ${mapPaths.size}`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out.join('\n') + '\n');
console.log(`manifest rows: ${out.length - 1}`);
