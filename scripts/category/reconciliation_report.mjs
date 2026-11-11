// Before/after reconciliation for approved category batches. "Before" is a git ref (default origin/main),
// "after" is the working tree. Every difference is attributed to a batch record or reported as UNEXPECTED.
// Usage: node scripts/category/reconciliation_report.mjs [beforeRef] [url-checks.json] > report.md
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [,, BEFORE = 'origin/main', CHECKS] = process.argv;
const root = process.cwd();
const atRef = (file) => execFileSync('git', ['show', `${BEFORE}:${file}`], { cwd: root, maxBuffer: 1 << 30 }).toString().replace(/\r\n/g, '\n');
const now = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const lines = (t) => t.split('\n').filter(Boolean);

const items = fs.readdirSync(path.join(root, 'data/category-batches')).filter((f) => f.endsWith('.tsv')).sort()
  .flatMap((f) => lines(now(`data/category-batches/${f}`)).slice(1).map((l) => { const [p, action, evidence, name] = l.split('\t'); return { batch: f, path: p, action, evidence, name }; }));
const finalOf = (b) => (b.action.startsWith('consolidate:') ? b.action.slice('consolidate:'.length)
  : b.action.startsWith('reclassify:') ? `${b.action.slice('reclassify:'.length)}/${b.path.split('/').slice(1).join('/')}` : null);
const batchPaths = new Set(items.map((b) => b.path));
const newPaths = new Set(items.filter((b) => b.action.startsWith('reclassify:')).map(finalOf));
const unexpected = [];
const out = [];
const p = (s = '') => out.push(s);

// Registry
const regBefore = JSON.parse(atRef('data/facility-identity-registry.json')).entries;
const regAfter = JSON.parse(now('data/facility-identity-registry.json')).entries;
const beforeByK = new Map(regBefore.map((e) => [e.k, e]));
const regChanges = [];
for (const e of regAfter) {
  const b = beforeByK.get(e.k);
  if (!b) { unexpected.push(`registry: new identity ${e.p}`); continue; }
  if (JSON.stringify(b) !== JSON.stringify(e)) {
    regChanges.push({ before: b, after: e });
    if (!batchPaths.has(b.p)) unexpected.push(`registry: identity outside the batch changed: ${b.p}`);
  }
}
if (regAfter.length !== regBefore.length) unexpected.push(`registry size ${regBefore.length} -> ${regAfter.length}`);

// UUID map
const mapRows = (t) => new Map(lines(t).slice(1).map((l) => { const c = l.split('\t'); return [c[0], `${c[1]}:${c[2] || ''}`]; }));
const mapBefore = mapRows(atRef('data/facility-uuid-map.tsv'));
const mapAfter = mapRows(now('data/facility-uuid-map.tsv'));
const mapRemoved = [...mapBefore.keys()].filter((k) => !mapAfter.has(k));
const mapAdded = [...mapAfter.keys()].filter((k) => !mapBefore.has(k));
const mapChanged = [...mapAfter.keys()].filter((k) => mapBefore.has(k) && mapBefore.get(k) !== mapAfter.get(k));
for (const k of mapRemoved) if (!batchPaths.has(k)) unexpected.push(`map: row removed outside the batch: ${k}`);
for (const k of mapAdded) if (!newPaths.has(k)) unexpected.push(`map: row added outside the batch: ${k}`);
for (const k of mapChanged) unexpected.push(`map: row changed: ${k} ${mapBefore.get(k)} -> ${mapAfter.get(k)}`);

// Legacy manifest
const legacy = (t) => new Map(lines(t).filter((l) => !l.startsWith('#')).map((l) => { const c = l.split('\t'); return [c[0], c[1]]; }));
const legBefore = legacy(atRef('data/facility-legacy-redirects.tsv'));
const legAfter = legacy(now('data/facility-legacy-redirects.tsv'));
const legRemoved = [...legBefore.keys()].filter((k) => !legAfter.has(k));
const legRetargeted = [...legAfter.keys()].filter((k) => legBefore.has(k) && legBefore.get(k) !== legAfter.get(k));
for (const k of legRemoved) if (!batchPaths.has(legBefore.get(k))) unexpected.push(`legacy: row removed whose destination is not in the batch: ${k}`);
for (const k of legRetargeted) if (!batchPaths.has(legBefore.get(k))) unexpected.push(`legacy: row retargeted outside the batch: ${k}`);
if ([...legAfter.keys()].some((k) => !legBefore.has(k))) unexpected.push('legacy: new rows added');

// Redirect rules
const rulesBefore = new Set(lines(atRef('public/_redirects')).filter((l) => !l.startsWith('#')));
const rulesAfter = new Set(lines(now('public/_redirects')).filter((l) => !l.startsWith('#')));
const rulesAdded = [...rulesAfter].filter((r) => !rulesBefore.has(r));
const rulesRemoved = [...rulesBefore].filter((r) => !rulesAfter.has(r));
const legacySources = new Set([...legRemoved, ...legRetargeted]);
const attributable = (rule) => { const from = rule.split(/\s+/)[0].replace(/^\//, '').replace(/\/$/, ''); return batchPaths.has(from) || legacySources.has(from); };
for (const r of [...rulesAdded, ...rulesRemoved]) if (!attributable(r)) unexpected.push(`redirect rule outside the batch: ${r}`);

// URL checks (optional, from a deploy preview run)
const checks = CHECKS && fs.existsSync(CHECKS) ? JSON.parse(fs.readFileSync(CHECKS, 'utf8')) : null;
if (checks) for (const c of checks.results) if (!c.pass) unexpected.push(`URL check failed: ${c.url} expected ${c.expected} got ${c.got}${c.location ? ' -> ' + c.location : ''}`);

p(`# Category cleanup reconciliation: ${[...new Set(items.map((b) => b.batch))].join(', ')}`);
p();
p(`Before: \`${BEFORE}\`. After: working tree. Generated ${new Date().toISOString()}.`);
p();
p(`**Result: ${unexpected.length ? `${unexpected.length} UNEXPECTED difference(s)` : 'every difference is attributed to an approved batch record; no unexpected differences'}.**`);
p();
p('| Measure | Before | After | Change |');
p('|---|---|---|---|');
const liveBefore = regBefore.filter((e) => !e.s).length, liveAfter = regAfter.filter((e) => !e.s).length;
p(`| Registry identities | ${regBefore.length} | ${regAfter.length} | ${regAfter.length - regBefore.length} |`);
p(`| Live canonical pages | ${liveBefore} | ${liveAfter} | ${liveAfter - liveBefore} |`);
p(`| UUID map rows | ${mapBefore.size} | ${mapAfter.size} | ${mapAfter.size - mapBefore.size} (removed ${mapRemoved.length}, added ${mapAdded.length}, changed ${mapChanged.length}) |`);
p(`| Legacy 301 sources | ${legBefore.size} | ${legAfter.size} | ${legAfter.size - legBefore.size} (to 410: ${legRemoved.length}, retargeted: ${legRetargeted.length}) |`);
p(`| Redirect rules | ${rulesBefore.size} | ${rulesAfter.size} | +${rulesAdded.length} / -${rulesRemoved.length} |`);
p();
p('## Every changed identity');
p();
p('| Decision | Facility | Old URL | Now | Evidence |');
p('|---|---|---|---|---|');
for (const b of items) {
  const now = b.action === 'retire' ? '410 Gone' : `301 → /${finalOf(b)}/`;
  p(`| ${b.action.split(':')[0]} | ${b.name} | /${b.path}/ | ${now} | ${b.evidence} |`);
}
p();
p('## Legacy URLs changed');
p();
p('| Legacy URL | Before | After |');
p('|---|---|---|');
for (const k of legRemoved) p(`| /${k}/ | 301 → /${legBefore.get(k)}/ | 410 Gone |`);
for (const k of legRetargeted) p(`| /${k}/ | 301 → /${legBefore.get(k)}/ | 301 → /${legAfter.get(k)}/ |`);
p();
p('## Registry entries changed');
p();
for (const c of regChanges) p(`- \`${c.before.p}\`: ${c.after.s ? `status **${c.after.s}**${c.after.to ? ` → \`${c.after.to}\`` : ''}` : `moved to \`${c.after.p}\` (was \`${c.after.was}\`)`}`);
p();
p('## UUID map rows');
p();
for (const k of mapRemoved) p(`- removed \`${k}\` (${mapBefore.get(k)})`);
for (const k of mapAdded) p(`- added \`${k}\` (${mapAfter.get(k)})`);
if (checks) {
  p();
  p(`## URL checks on ${checks.base}`);
  p();
  p(`${checks.results.filter((c) => c.pass).length} of ${checks.results.length} passed.`);
  p();
  p('| Group | URL | Expected | Got | Pass |');
  p('|---|---|---|---|---|');
  for (const c of checks.results) p(`| ${c.group} | ${c.url} | ${c.expected} | ${c.got}${c.location ? ' → ' + c.location : ''} | ${c.pass ? 'yes' : '**NO**'} |`);
}
p();
p('## Unexpected differences');
p();
p(unexpected.length ? unexpected.map((u) => `- ${u}`).join('\n') : 'None.');
process.stdout.write(out.join('\n') + '\n');
process.exitCode = unexpected.length ? 1 : 0;
