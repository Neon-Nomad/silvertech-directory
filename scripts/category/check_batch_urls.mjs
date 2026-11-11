// Checks real HTTP behaviour of a deployed site (e.g. a Netlify deploy preview) for approved category batches.
// Usage: node scripts/category/check_batch_urls.mjs <baseUrl> <out.json>
import fs from 'node:fs';
import path from 'node:path';

const [,, BASE, OUT] = process.argv;
const root = process.cwd();
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const items = fs.readdirSync(path.join(root, 'data/category-batches')).filter((f) => f.endsWith('.tsv')).sort()
  .flatMap((f) => read(`data/category-batches/${f}`).split('\n').slice(1).filter(Boolean).map((l) => { const [p, action] = l.split('\t'); return { path: p, action }; }));
const finalOf = (b) => (b.action.startsWith('consolidate:') ? b.action.slice('consolidate:'.length)
  : b.action.startsWith('reclassify:') ? `${b.action.slice('reclassify:'.length)}/${b.path.split('/').slice(1).join('/')}` : null);
const legacy = read('data/manifest/facility-legacy-redirects-2026-11-11.tsv').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.split('\t'));
const legacyOf = (p) => legacy.filter(([, to]) => to === p).map(([from]) => from);
const sample = JSON.parse(read('tests/fixtures/ny-category-sample.json')).records;
const manifest = read('data/manifest/facility-manifest-2026-11-11.tsv').split('\n').filter(Boolean).slice(1).map((l) => l.split('\t'));

const checks = [];
const add = (group, url, expected, location) => checks.push({ group, url, expected, location });
for (const b of items) {
  const t = finalOf(b);
  if (b.action === 'retire') {
    add('retired page', `/${b.path}/`, 410);
    add('retired page (no slash)', `/${b.path}`, 410);
    for (const l of legacyOf(b.path)) add('legacy URL of retired page', `/${l}/`, 410);
  } else {
    add(`${b.action.split(':')[0]}d page`, `/${b.path}/`, 301, `/${t}/`);
    for (const l of legacyOf(b.path)) add('legacy URL of moved page', `/${l}/`, 301, `/${t}/`);
    add('surviving page', `/${t}/`, 200);
  }
}
for (const r of sample.filter((s) => s.expected === 'keep' || s.expected === 'unchanged')) add(`control: ${r.category}`, `/${r.path}/`, 200);
// Unrelated facilities in other states: a fixed spread across the manifest (every 4,000th row, outside the batch).
const batchSet = new Set(items.map((b) => b.path));
manifest.filter((_, i) => i % 4000 === 0).filter((c) => !batchSet.has(c[0])).forEach((c) => add(`unrelated (${c[3]})`, `/${c[0]}/`, 200));
for (const s of ['/new-york/', '/california/']) { add('state hub', `/states${s}`, 200); add('care-state hub', `/adult-day-services${s}`, 200); }

const results = [];
for (const c of checks) {
  let got = 0, loc = '', canonOk = null;
  try {
    const r = await fetch(BASE + c.url, { redirect: 'manual' });
    got = r.status;
    loc = (r.headers.get('location') || '').replace(BASE, '').replace('https://silvertechdirectory.com', '');
    if (c.group === 'surviving page' && got === 200) {
      const html = await r.text();
      const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
      canonOk = canon === `https://silvertechdirectory.com${c.url}`;
    } else await r.body?.cancel();
  } catch (e) { got = `error ${e.message}`; }
  const pass = got === c.expected && (!c.location || loc === c.location) && canonOk !== false;
  results.push({ group: c.group, url: c.url, expected: `${c.expected}${c.location ? ' → ' + c.location : ''}${c.group === 'surviving page' ? ' (self canonical)' : ''}`, got, location: loc || undefined, pass });
}

// Sitemaps: removed paths absent, surviving pages present once.
const index = await (await fetch(`${BASE}/sitemap-index.xml`)).text();
const children = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://silvertechdirectory.com', BASE));
let sitemap = '';
for (const u of children) sitemap += await (await fetch(u)).text();
const count = (p) => sitemap.split(`<loc>https://silvertechdirectory.com/${p}/</loc>`).length - 1;
for (const b of items) {
  results.push({ group: 'sitemap: removed', url: `/${b.path}/`, expected: 'absent', got: count(b.path) ? `listed ${count(b.path)}x` : 'absent', pass: count(b.path) === 0 });
  const t = finalOf(b);
  if (t && !results.some((r) => r.group === 'sitemap: surviving' && r.url === `/${t}/`)) {
    results.push({ group: 'sitemap: surviving', url: `/${t}/`, expected: 'listed once', got: `listed ${count(t)}x`, pass: count(t) === 1 });
  }
}
fs.writeFileSync(OUT, JSON.stringify({ base: BASE, checkedAt: new Date().toISOString(), results }, null, 1));
const failed = results.filter((r) => !r.pass);
for (const f of failed) console.error(` - FAIL ${f.group}: ${f.url} expected ${f.expected} got ${f.got}${f.location ? ' -> ' + f.location : ''}`);
console.log(`${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
