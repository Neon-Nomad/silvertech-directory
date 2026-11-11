// Verifies a built site (dist) against approved category batches: pages, canonical tags, sitemaps, internal links.
// Written before the pilot implementation. Exit 0 only when every check passes.
// Usage: node scripts/validate/verifyCategoryBuild.mjs <distDir> <batch.tsv> [more batches...]
import fs from 'node:fs';
import path from 'node:path';

const [,, DIST, ...BATCHES] = process.argv;
const items = BATCHES.flatMap((f) => fs.readFileSync(f, 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((l) => { const [p, action] = l.split('\t'); return { path: p, action }; }));
const finalTarget = (b) => (b.action.startsWith('consolidate:') ? b.action.slice('consolidate:'.length)
  : b.action.startsWith('reclassify:') ? `${b.action.slice('reclassify:'.length)}/${b.path.split('/').slice(1).join('/')}` : null);
const errors = [];
const page = (p) => path.join(DIST, p, 'index.html');

// 1. Pages: removed paths are not built; final targets are built with a self canonical.
for (const b of items) {
  if (fs.existsSync(page(b.path))) errors.push(`page still built: /${b.path}/`);
  const t = finalTarget(b);
  if (t) {
    if (!fs.existsSync(page(t))) { errors.push(`target page not built: /${t}/ (from ${b.path})`); continue; }
    const html = fs.readFileSync(page(t), 'utf8');
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canon !== `https://silvertechdirectory.com/${t}/`) errors.push(`target canonical is ${canon}, expected /${t}/`);
  }
}

// 2. Sitemaps: no removed path listed; every final target listed exactly once.
const sitemapText = fs.readdirSync(DIST).filter((f) => /^sitemap.*\.xml$/.test(f)).map((f) => fs.readFileSync(path.join(DIST, f), 'utf8')).join('\n');
const locCount = (p) => (sitemapText.match(new RegExp(`<loc>https://silvertechdirectory\\.com/${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/</loc>`, 'g')) || []).length;
for (const b of items) {
  if (locCount(b.path)) errors.push(`sitemap still lists /${b.path}/`);
  const t = finalTarget(b);
  if (t && locCount(t) !== 1) errors.push(`sitemap lists /${t}/ ${locCount(t)} times (expected 1)`);
}

// 3. Internal links: no built page links to a removed path.
const removedHrefs = new Set(items.map((b) => `href="/${b.path}/"`));
const walk = (dir) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.html')) scan(f); } };
let scanned = 0;
const scan = (file) => { scanned++; const html = fs.readFileSync(file, 'utf8'); if (!html.includes('href="/')) return; for (const h of removedHrefs) if (html.includes(h)) errors.push(`${path.relative(DIST, file)} links to ${h.slice(6, -1)}`); };
walk(DIST);

for (const e of errors.slice(0, 60)) console.error(' - ' + e);
console.log(`checked ${items.length} batch records, ${scanned} HTML files: ${errors.length ? `FAIL (${errors.length} problems)` : 'PASS'}`);
process.exit(errors.length ? 1 : 0);
