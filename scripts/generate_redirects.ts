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
  '# Return unresolved care-type state/city routes as not found (valid static pages still shadow these rules)',
  ...staleCareTypeLocationRules,
  '# Return stale facility-detail route IDs as gone (valid static pages still shadow these rules)',
  ...staleFacilityRules,
  '# SPA fallback',
  '/* /index.html 200',
];

const outPath = path.join(rootDir, 'public', '_redirects');
fs.writeFileSync(outPath, `${outputLines.join('\n')}\n`, 'utf-8');

console.log(`Redirects written to ${outPath}`);
