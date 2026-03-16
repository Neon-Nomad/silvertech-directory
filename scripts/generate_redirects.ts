import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

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
  '/states/:state/regulatory /410.html 410!',
  '/states/:state/regulations /410.html 410!',
  '/states/:state/regulations/* /410.html 410!',
  '/regulatory-library /410.html 410!',
  '/regulatory-library/* /410.html 410!',
  '/assisted-living/:state/cities/:city /410.html 410!',
  '/assisted-living/:state/cities/:city/ /410.html 410!',
  '# SPA fallback',
  '/* /app.html 200',
];

const outPath = path.join(rootDir, 'public', '_redirects');
fs.writeFileSync(outPath, `${outputLines.join('\n')}\n`, 'utf-8');

console.log(`Redirects written to ${outPath}`);
