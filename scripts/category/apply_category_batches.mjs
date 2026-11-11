// Applies every approved batch in data/category-batches/ to the identity registry and the legacy redirect
// manifest. Deterministic and idempotent: the legacy manifest is rebuilt from the frozen pre-cleanup snapshot,
// and registry entries already carrying a decision are recognised and left as they are.
// Usage: node scripts/category/apply_category_batches.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const rel = (f) => path.join(root, f);
const batchDir = rel('data/category-batches');
const items = fs.readdirSync(batchDir).filter((f) => f.endsWith('.tsv')).sort()
  .flatMap((f) => fs.readFileSync(path.join(batchDir, f), 'utf8').split(/\r?\n/).slice(1).filter(Boolean)
    .map((l) => { const [p, action] = l.split('\t'); return { path: p, action, batch: f }; }));
const finalOf = (b) => (b.action.startsWith('consolidate:') ? b.action.slice('consolidate:'.length)
  : b.action.startsWith('reclassify:') ? `${b.action.slice('reclassify:'.length)}/${b.path.split('/').slice(1).join('/')}` : null);

// 1. Identity registry: give removed identities a status; move reclassified identities to their new path.
const registryFile = rel('data/facility-identity-registry.json');
const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
const byPath = new Map(registry.entries.map((e) => [e.p, e]));
const byWas = new Map(registry.entries.filter((e) => e.was).map((e) => [e.was, e]));
for (const b of items) {
  const e = byPath.get(b.path) || byWas.get(b.path);
  if (!e) throw new Error(`batch ${b.batch}: ${b.path} is not a registry identity`);
  if (b.action === 'retire') {
    if (e.s && e.s !== 'retired') throw new Error(`conflicting decision for ${b.path}: already ${e.s}`);
    e.s = 'retired';
  } else if (b.action.startsWith('consolidate:')) {
    const target = finalOf(b);
    const t = byPath.get(target);
    if (!t || t.s) throw new Error(`batch ${b.batch}: consolidation target ${target} is not a live identity`);
    if (e.s && (e.s !== 'consolidated' || e.to !== target)) throw new Error(`conflicting decision for ${b.path}`);
    e.s = 'consolidated';
    e.to = target;
  } else if (b.action.startsWith('reclassify:')) {
    const target = finalOf(b);
    if (e.was === b.path && e.p === target) continue; // already applied
    if (byPath.has(target)) throw new Error(`batch ${b.batch}: reclassification target ${target} already exists`);
    e.was = e.p;
    e.p = target;
    byPath.delete(b.path);
    byPath.set(target, e);
  } else {
    throw new Error(`batch ${b.batch}: unsupported action ${b.action} for ${b.path}`);
  }
}
const livePaths = registry.entries.filter((e) => !e.s).map((e) => e.p).sort();
registry.canonicalPathsSha256 = createHash('sha256').update(livePaths.join('\n')).digest('hex');
fs.writeFileSync(registryFile, JSON.stringify(registry) + '\n');

// 2. Legacy redirect manifest: rebuilt from the frozen snapshot. Destinations retired by a batch leave the
//    301 manifest (their legacy URLs get 410 rules); moved destinations point straight at the surviving page.
const retired = new Set(items.filter((b) => b.action === 'retire').map((b) => b.path));
const moved = new Map(items.filter((b) => finalOf(b)).map((b) => [b.path, finalOf(b)]));
const snapshot = fs.readFileSync(rel('data/manifest/facility-legacy-redirects-2026-11-11.tsv'), 'utf8').split(/\r?\n/).filter(Boolean);
const out = [];
let removed = 0, retargeted = 0;
for (const line of snapshot) {
  if (line.startsWith('#')) { out.push(line); continue; }
  const cols = line.split('\t');
  if (retired.has(cols[1])) { removed++; continue; }
  if (moved.has(cols[1])) { cols[1] = moved.get(cols[1]); retargeted++; }
  out.push(cols.join('\t'));
}
fs.writeFileSync(rel('data/facility-legacy-redirects.tsv'), out.join('\n') + '\n');
console.log(`batches: ${new Set(items.map((b) => b.batch)).size}, items: ${items.length}; live identities: ${livePaths.length}; legacy 301 rows removed: ${removed}, retargeted: ${retargeted}`);
