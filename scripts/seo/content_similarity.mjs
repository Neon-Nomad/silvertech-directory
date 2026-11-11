// Measures main-content similarity of built SilverTech pages (dist output). Read-only.
// Usage: node content-similarity.mjs <distDir> <outJson>
import fs from 'node:fs';
import path from 'node:path';

const [,, DIST, OUT] = process.argv;
const CARE = ['assisted-living','memory-care','nursing-homes','independent-living','residential-care','adult-day-services','ccrc'];

// Seeded RNG so the sample is repeatable.
let seed = 20261110;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const decode = (s) => s.replace(/&amp;/g,'&').replace(/&#39;|&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&mdash;/g,'—').replace(/&nbsp;/g,' ');
const text = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/g,' ').replace(/<style[\s\S]*?<\/style>/g,' ').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();
const words = (t) => t.toLowerCase().match(/[a-z0-9#]+/g) || [];

function listPages() {
  const fac = {}, city = {}, careState = {};
  for (const care of CARE) {
    fac[care] = []; city[care] = []; careState[care] = [];
    const careDir = path.join(DIST, care);
    if (!fs.existsSync(careDir)) continue;
    for (const st of fs.readdirSync(careDir)) {
      const stDir = path.join(careDir, st);
      if (!fs.statSync(stDir).isDirectory()) continue;
      if (fs.existsSync(path.join(stDir, 'index.html'))) careState[care].push(path.join(stDir, 'index.html'));
      for (const c of fs.readdirSync(stDir)) {
        const cDir = path.join(stDir, c);
        if (!fs.statSync(cDir).isDirectory()) continue;
        if (fs.existsSync(path.join(cDir, 'index.html'))) city[care].push(path.join(cDir, 'index.html'));
        for (const f of fs.readdirSync(cDir)) {
          const fDir = path.join(cDir, f);
          if (fs.statSync(fDir).isDirectory() && fs.existsSync(path.join(fDir, 'index.html'))) fac[care].push(path.join(fDir, 'index.html'));
        }
      }
    }
  }
  return { fac, city, careState };
}

function mainOf(html) {
  const s = html.indexOf('<main'); const e = html.lastIndexOf('</main>');
  return s >= 0 && e > s ? html.slice(s, e) : html;
}

// Replace the page's own identity values with placeholders so only the template remains.
function skeleton(mainText, ids) {
  let t = ' ' + mainText.toLowerCase() + ' ';
  const subs = ids.filter(Boolean).map((v) => v.toLowerCase().trim()).filter((v) => v.length > 1).sort((a, b) => b.length - a.length);
  for (const v of subs) t = t.split(v).join(' ‹x› ');
  return t.replace(/[0-9]+/g, '#').replace(/\s+/g, ' ').trim();
}

const shingles = (ws, k = 5) => { const s = new Set(); for (let i = 0; i + k <= ws.length; i++) s.add(ws.slice(i, i + k).join(' ')); return s; };
const jaccard = (a, b) => { let inter = 0; for (const x of a) if (b.has(x)) inter++; return inter / (a.size + b.size - inter || 1); };
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const mean = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

function analyze(files, kind) {
  const pages = [];
  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const main = mainOf(html);
    const mt = text(main);
    const rel = path.relative(DIST, f).replace(/\\/g, '/');
    const segs = rel.split('/');
    const h1 = text((main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [,''])[1]);
    const addr = text((main.match(/class="fp-hero-address"[^>]*>([\s\S]*?)<\/p>/) || [,''])[1]);
    const cityWords = (segs[2] || '').replace(/-/g, ' ');
    const stateWords = (segs[1] || '').replace(/-/g, ' ');
    const stateAbbr = (mt.match(/,\s([A-Z]{2})\b/) || [,''])[1];
    const ids = [h1, addr, cityWords, stateWords, stateAbbr && ` ${stateAbbr} `];
    const sk = skeleton(mt, ids);
    const title = text((html.match(/<title>([\s\S]*?)<\/title>/) || [,''])[1]);
    const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [,''])[1];
    pages.push({ rel, words: words(mt).length, sk, skWords: words(sk), title, desc, mt,
      flags: kind === 'facility' ? {
        license: /State License|License Number/.test(mt),
        cms: /CMS Certification/.test(mt),
        beds: /Certified Beds|Bed Capacity/.test(mt),
        website: /Official Website|Visit official site/.test(mt),
        phone: /☎|Phone/.test(mt),
        nearby: /More .* in .*View profile/.test(mt),
        lastVerified: /Last Verified/.test(mt),
        dataSource: /Data Source/.test(mt),
        careServicesMulti: /Care services include:/.test(mt),
        activeClaim: /Regulatory Standing Active/.test(mt),
        verifiedBadgeNoId: /Verified Identifiers/.test(mt) && !/State License|CMS Certification/.test(mt),
        ownershipOther: /operates as a other organization/i.test(mt),
        grammarAOrAn: / is a (assisted|independent|adult|ccrc)/i.test(mt),
      } : {
        typicalLocalRange: /Typical local range/.test(mt),
        cityRich: false,
      } });
  }
  // Template vocabulary: skeleton words that occur in >= 50% of pages.
  const df = new Map();
  for (const p of pages) for (const w of new Set(p.skWords)) df.set(w, (df.get(w) || 0) + 1);
  const common = new Set([...df].filter(([, n]) => n >= pages.length * 0.5).map(([w]) => w));
  for (const p of pages) {
    const specific = p.skWords.filter((w) => !common.has(w) && w !== 'x' && w !== '#');
    p.specificShare = p.skWords.length ? specific.length / p.skWords.length : 0;
    p.sh = shingles(p.skWords);
  }
  // Exact skeleton duplicates.
  const skCount = new Map(); for (const p of pages) skCount.set(p.sk, (skCount.get(p.sk) || 0) + 1);
  const dupPages = pages.filter((p) => skCount.get(p.sk) > 1).length;
  // Random pair Jaccard on skeleton 5-shingles.
  const js = []; for (let i = 0; i < Math.min(3000, pages.length * 3); i++) { const a = pages[Math.floor(rand() * pages.length)], b = pages[Math.floor(rand() * pages.length)]; if (a !== b) js.push(jaccard(a.sh, b.sh)); }
  const titles = new Map(); for (const p of pages) titles.set(p.title, (titles.get(p.title) || 0) + 1);
  const descs = new Map(); for (const p of pages) descs.set(p.desc, (descs.get(p.desc) || 0) + 1);
  const flagNames = pages[0] ? Object.keys(pages[0].flags) : [];
  const flagRates = Object.fromEntries(flagNames.map((k) => [k, +(pages.filter((p) => p.flags[k]).length / pages.length).toFixed(3)]));
  return {
    sampled: pages.length,
    mainWords: { median: median(pages.map((p) => p.words)), mean: Math.round(mean(pages.map((p) => p.words))) },
    distinctSkeletons: skCount.size,
    pagesSharingExactSkeleton: dupPages,
    pageSpecificWordShare: { median: +median(pages.map((p) => p.specificShare)).toFixed(3), mean: +mean(pages.map((p) => p.specificShare)).toFixed(3) },
    pairJaccard5: { median: +median(js).toFixed(3), mean: +mean(js).toFixed(3), pairs: js.length },
    duplicateTitles: [...titles.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0),
    duplicateDescriptions: [...descs.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0),
    flagRates,
    examples: shuffle([...pages]).slice(0, 3).map((p) => ({ rel: p.rel, words: p.words, specificShare: +p.specificShare.toFixed(3) })),
  };
}

const { fac, city, careState } = listPages();
const inventory = Object.fromEntries(CARE.map((c) => [c, { facility: fac[c].length, city: city[c].length, careState: careState[c].length }]));
const result = { generatedAt: new Date().toISOString(), dist: DIST, inventory, facility: {}, city: {}, careState: {} };
for (const c of CARE) {
  result.facility[c] = analyze(shuffle([...fac[c]]).slice(0, 200), 'facility');
  result.city[c] = analyze(shuffle([...city[c]]).slice(0, 100), 'city');
}
result.careState.all = analyze(CARE.flatMap((c) => careState[c]), 'city');
const allFac = CARE.flatMap((c) => shuffle([...fac[c]]).slice(0, 200));
result.facility.ALL = analyze(allFac, 'facility');
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));

const row = (name, r) => `${name.padEnd(20)} n=${String(r.sampled).padStart(4)}  words(med)=${String(r.mainWords.median).padStart(5)}  pageSpecific(med)=${r.pageSpecificWordShare.median}  pairJaccard(med)=${r.pairJaccard5.median}  exactSkeletonDupPages=${r.pagesSharingExactSkeleton}  dupTitles=${r.duplicateTitles}  dupDesc=${r.duplicateDescriptions}`;
console.log('INVENTORY', JSON.stringify(inventory));
console.log('\nFACILITY PAGES');
for (const c of [...CARE, 'ALL']) console.log(row(c, result.facility[c]));
console.log('\nFACILITY FLAG RATES (ALL)', JSON.stringify(result.facility.ALL.flagRates));
console.log('\nCITY PAGES');
for (const c of CARE) console.log(row(c, result.city[c]), ' typicalLocalRange=', result.city[c].flagRates.typicalLocalRange);
console.log('\nCARE-STATE PAGES');
console.log(row('all', result.careState.all));
