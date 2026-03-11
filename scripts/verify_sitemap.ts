import fs from 'node:fs';
import path from 'node:path';

const sitemapIndexPath = path.join(process.cwd(), 'public', 'sitemap-index.xml');
const sitemapFallbackPath = path.join(process.cwd(), 'public', 'sitemap.xml');
const sitemapPath = fs.existsSync(sitemapIndexPath) ? sitemapIndexPath : sitemapFallbackPath;

if (!fs.existsSync(sitemapPath)) {
  console.error(`Missing sitemap index at ${sitemapIndexPath} (and fallback sitemap at ${sitemapFallbackPath}).`);
  process.exit(1);
}

if (sitemapPath === sitemapFallbackPath) {
  console.warn('sitemap-index.xml not found; falling back to sitemap.xml for verification.');
}

const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const findings = {
  total: 0,
  nonHttps: 0,
  hasLogin: 0,
  hasSignup: 0,
  legacyAssistedLiving: 0,
  facilityUuid: 0,
  cityCanonical: 0,
  careTypeCityCanonical: 0,
  facilityCanonical: 0,
  stateRegulationsCanonical: 0,
  stateRegulatoryLegacy: 0,
  sitemapFilesChecked: 0,
};

const extractLocs = (xmlContent: string) =>
  [...xmlContent.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const checkUrl = (url: string) => {
  findings.total += 1;
  if (!url.startsWith('https://')) findings.nonHttps += 1;
  if (url.includes('/login')) findings.hasLogin += 1;
  if (url.includes('/signup')) findings.hasSignup += 1;
  if (/https?:\/\/[^/]+\/assisted-living\/[^/]+/i.test(url)) findings.legacyAssistedLiving += 1;
  if (/\/senior-living\/[^/]+\/[^/]+\/?$/.test(url)) findings.cityCanonical += 1;
  if (/\/senior-living\/[^/]+\/[^/]+\/[^/]+\/?$/.test(url)) findings.careTypeCityCanonical += 1;
  if (/\/states\/[^/]+\/regulations(?:\/|$)/.test(url)) findings.stateRegulationsCanonical += 1;
  if (/\/states\/[^/]+\/regulatory(?:\/|$)/.test(url)) findings.stateRegulatoryLegacy += 1;
  if (/\/facility\//.test(url)) {
    if (uuidRegex.test(url)) findings.facilityUuid += 1;
    else findings.facilityCanonical += 1;
  }
};

const readLocalSitemap = (locUrl: string) => {
  const fileName = locUrl.split('/').pop();
  if (!fileName) return null;
  const localPath = path.join(process.cwd(), 'public', fileName);
  if (!fs.existsSync(localPath)) {
    console.error(`Missing referenced sitemap file: ${localPath}`);
    process.exit(1);
  }
  return fs.readFileSync(localPath, 'utf-8');
};

const processSitemap = (xmlContent: string) => {
  findings.sitemapFilesChecked += 1;
  if (xmlContent.includes('<sitemapindex')) {
    const locs = extractLocs(xmlContent);
    for (const loc of locs) {
      const childXml = readLocalSitemap(loc);
      if (childXml) processSitemap(childXml);
    }
    return;
  }

  const urls = extractLocs(xmlContent);
  for (const url of urls) checkUrl(url);
};

const rootXml = fs.readFileSync(sitemapPath, 'utf-8');
processSitemap(rootXml);

const report = [
  `Sitemap files checked: ${findings.sitemapFilesChecked}`,
  `Total URLs: ${findings.total}`,
  `Non-HTTPS URLs: ${findings.nonHttps}`,
  `Login URLs: ${findings.hasLogin}`,
  `Signup URLs: ${findings.hasSignup}`,
  `City canonical URLs: ${findings.cityCanonical}`,
  `Care-type city canonical URLs: ${findings.careTypeCityCanonical}`,
  `Legacy assisted-living URLs (non-canonical): ${findings.legacyAssistedLiving}`,
  `Facility canonical URLs (slug): ${findings.facilityCanonical}`,
  `Facility UUID URLs (non-canonical): ${findings.facilityUuid}`,
  `State regulations canonical URLs: ${findings.stateRegulationsCanonical}`,
  `State regulatory legacy URLs (non-canonical): ${findings.stateRegulatoryLegacy}`,
];

console.log(report.join('\n'));

if (
  findings.nonHttps > 0 ||
  findings.hasLogin > 0 ||
  findings.hasSignup > 0 ||
  findings.legacyAssistedLiving > 0 ||
  findings.facilityUuid > 0 ||
  findings.stateRegulatoryLegacy > 0
) {
  console.error('Sitemap verification failed. Resolve the issues above.');
  process.exit(1);
}

console.log('Sitemap verification passed.');
