import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const careTypeSlugs = [
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
];

const staleFacilityRules = careTypeSlugs.flatMap((care) => [
  `/${care}/:state/:city/:facility /410.html 410`,
  `/${care}/:state/:city/:facility/ /410.html 410`,
]);

const staleCareTypeLocationRules = careTypeSlugs.flatMap((care) => [
  `/${care}/:state /404.html 404`,
  `/${care}/:state/ /404.html 404`,
  `/${care}/:state/:city /404.html 404`,
  `/${care}/:state/:city/ /404.html 404`,
]);

// Verified legacy facility URLs. Only rows marked emit=yes are written here (Search Console evidence);
// the remaining verified rows stay in the manifest until a lookup-based route is chosen.
const legacyManifestPath = path.join(rootDir, 'data', 'facility-legacy-redirects.tsv');
const legacyFacilityRedirectLines = fs
  .readFileSync(legacyManifestPath, 'utf-8')
  // Windows checkouts convert the manifest to CRLF; a trailing \r would make every emit flag fail.
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('\t'))
  .filter(([, , , emit]) => emit === 'yes')
  .flatMap(([from, to]) => [`/${from} /${to}/ 301`, `/${from}/ /${to}/ 301`]);

// Approved category batches (data/category-batches/*.tsv). Retired pages, and the legacy URLs that pointed at
// them (from the frozen pre-cleanup snapshot), return 410; consolidated and reclassified pages 301 straight to
// the surviving page. Forced, and placed before the legacy block, so no URL reaches them through a chain.
const categoryBatchDir = path.join(rootDir, 'data', 'category-batches');
const categoryBatchItems = fs.existsSync(categoryBatchDir)
  ? fs.readdirSync(categoryBatchDir).filter((file) => file.endsWith('.tsv')).sort()
    .flatMap((file) => fs.readFileSync(path.join(categoryBatchDir, file), 'utf-8').split(/\r?\n/).slice(1).filter(Boolean)
      .map((line) => { const [from, action] = line.split('\t'); return { from, action }; }))
  : [];
const legacySnapshotRows = fs
  .readFileSync(path.join(rootDir, 'data', 'manifest', 'facility-legacy-redirects-2026-11-11.tsv'), 'utf-8')
  .split(/\r?\n/)
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split('\t'));
const categoryBatchLines = categoryBatchItems.flatMap(({ from, action }) => {
  if (action === 'retire') {
    const legacySources = legacySnapshotRows.filter(([, to]) => to === from).map(([source]) => source);
    return [from, ...legacySources].flatMap((p) => [`/${p}/ /410.html 410!`, `/${p} /410.html 410!`]);
  }
  const target = action.startsWith('consolidate:')
    ? action.slice('consolidate:'.length)
    : `${action.slice('reclassify:'.length)}/${from.split('/').slice(1).join('/')}`;
  return [`/${from}/ /${target}/ 301!`, `/${from} /${target}/ 301!`];
});

// React (SPA) routes, read from App.tsx so this allowlist cannot drift from the router.
// Only these paths are served by the SPA shell with 200; every other unmatched path returns 404.
// Static files (Astro pages, assets) always win over these non-forced rules.
const SPA_ROUTE_EXCLUSIONS: RegExp[] = [
  /^\*$/, // React catch-all (its 404 page is served by the final rule below)
  /^\/$/, // homepage is a real file (index.html)
  /^\/:careType/, // care-type directory pages are static Astro files; unknown ones must 404 or 410
  /^\/__integrity/, // developer harness, never public
  /^\/(facility|senior-living|community|regulatory-library)(\/|$)/, // retired: 410 rules above
  /^\/states\/:state\/(regulatory|regulations)/, // retired: 301 rules above
  /^\/regulations\/:state/, // static Astro pages for valid states; unknown states must 404
  /^\/states\/:state$/, // static Astro pages for valid states; unknown states must 404
];
const appSource = fs.readFileSync(path.join(rootDir, 'App.tsx'), 'utf-8');
const spaRoutes =[...new Set([...appSource.matchAll(/<Route\s[^>]*path="([^"]+)"/g)].map((m) => m[1]))]
  .filter((routePath) => !SPA_ROUTE_EXCLUSIONS.some((pattern) => pattern.test(routePath)))
  .sort();
const spaRouteLines = spaRoutes.flatMap((routePath) =>
  routePath.endsWith('*') ? [`${routePath} /index.html 200`] : [`${routePath} /index.html 200`, `${routePath}/ /index.html 200`],
);

const outputLines = [
  '# Auto-generated redirect rules. Do not edit manually.',
  '# Canonical host redirects',
  'http://www.silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!',
  'http://silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!',
  'https://www.silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!',
  '# Static trust artifacts must bypass SPA fallback',
  '/help-registry.json /help-registry.json 200!',
  '/sitemap.xml /sitemap.xml 200!',
  '/sitemap-index.xml /sitemap-index.xml 200!',
  '/sitemap-* /sitemap-:splat 200!',
  '# Retired public directory URLs',
  '/facility/* /410.html 410!',
  '/senior-living/* /410.html 410!',
  '/community/* /410.html 410!',
  '/states/:state/regulatory /regulations/:state/ 301!',
  '/states/:state/regulatory/ /regulations/:state/ 301!',
  '/states/:state/regulations /regulations/:state/ 301!',
  '/states/:state/regulations/ /regulations/:state/ 301!',
  '/states/:state/regulations/:topic /regulations/:state/ 301!',
  '/states/:state/regulations/:topic/ /regulations/:state/ 301!',
  '/states/:state/regulations/* /regulations/:state/ 301!',
  '/regulations/:state/:topic /regulations/:state/ 301!',
  '/regulations/:state/:topic/ /regulations/:state/ 301!',
  '/regulations/:state/:topic/* /regulations/:state/ 301!',
  '/regulatory-library /410.html 410!',
  '/regulatory-library/* /410.html 410!',
  '/assisted-living/:state/cities/:city /410.html 410!',
  '/assisted-living/:state/cities/:city/ /410.html 410!',
  '# Approved category batches: retired pages 410, consolidated/reclassified pages 301 to the surviving page',
  ...categoryBatchLines,
  '# Verified legacy facility URLs: one-to-one 301 to the live canonical path. Must precede the 410 facility rules.',
  ...legacyFacilityRedirectLines,
  '# Return unresolved care-type state/city routes as not found (valid static pages still shadow these rules)',
  ...staleCareTypeLocationRules,
  '# Return stale facility-detail route IDs as gone (valid static pages still shadow these rules)',
  ...staleFacilityRules,
  '# SPA routes (from App.tsx): served by the app shell with 200',
  ...spaRouteLines,
  '# Everything else is not found: the app shell renders its not-found page (noindex) with a real 404 status',
  '/* /index.html 404',
];

const outPath = path.join(rootDir, 'public', '_redirects');
fs.writeFileSync(outPath, `${outputLines.join('\n')}\n`, 'utf-8');

console.log(`Redirects written to ${outPath}`);
