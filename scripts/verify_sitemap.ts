import fs from 'node:fs';
import path from 'node:path';

const sitemapIndexPath = path.join(process.cwd(), 'public', 'sitemap-index.xml');
const sitemapFallbackPath = path.join(process.cwd(), 'public', 'sitemap.xml');
const sitemapPath = fs.existsSync(sitemapIndexPath) ? sitemapIndexPath : sitemapFallbackPath;
const publicDir = path.join(process.cwd(), 'public');
const legacySitemapFiles = ['sitemap-cities.xml', 'sitemap-states.xml'];

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
  legacySeniorLiving: 0,
  facilityUuid: 0,
  careTypeRootCanonical: 0,
  careTypeStateCanonical: 0,
  careTypeCityCanonical: 0,
  communityCanonical: 0,
  regulationsRootCanonical: 0,
  regulationsStateCanonical: 0,
  regulationsTopicCanonical: 0,
  legacyStateRegulations: 0,
  sitemapFilesChecked: 0,
};

const extractLocs = (xmlContent: string) =>
  [...xmlContent.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

const checkUrl = (url: string) => {
  findings.total += 1;
  if (!url.startsWith('https://')) findings.nonHttps += 1;
  if (url.includes('/login')) findings.hasLogin += 1;
  if (url.includes('/signup')) findings.hasSignup += 1;
  if (/\/senior-living(?:\/|$)/.test(url)) findings.legacySeniorLiving += 1;
  if (/\/facility\//.test(url) && uuidRegex.test(url)) findings.facilityUuid += 1;
  if (/\/community\/[a-z0-9]+(?:-[a-z0-9]+)*-\d+\/?$/.test(url)) findings.communityCanonical += 1;
  if (/\/regulations\/?$/.test(url)) findings.regulationsRootCanonical += 1;
  if (/\/regulations\/[^/]+\/?$/.test(url)) findings.regulationsStateCanonical += 1;
  if (/\/regulations\/[^/]+\/[^/]+\/?$/.test(url)) findings.regulationsTopicCanonical += 1;
  if (/\/states\/[^/]+\/regulations(?:\/|$)/.test(url)) findings.legacyStateRegulations += 1;
  if (/https?:\/\/[^/]+\/(assisted-living|memory-care|nursing-homes|independent-living|residential-care|adult-day-services|ccrc)\/?$/.test(url)) {
    findings.careTypeRootCanonical += 1;
  }
  if (/https?:\/\/[^/]+\/(assisted-living|memory-care|nursing-homes|independent-living|residential-care|adult-day-services|ccrc)\/[^/]+\/?$/.test(url)) {
    findings.careTypeStateCanonical += 1;
  }
  if (/https?:\/\/[^/]+\/(assisted-living|memory-care|nursing-homes|independent-living|residential-care|adult-day-services|ccrc)\/[^/]+\/[^/]+\/?$/.test(url)) {
    findings.careTypeCityCanonical += 1;
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
  `Care-type root canonical URLs: ${findings.careTypeRootCanonical}`,
  `Care-type state canonical URLs: ${findings.careTypeStateCanonical}`,
  `Care-type city canonical URLs: ${findings.careTypeCityCanonical}`,
  `Community canonical URLs: ${findings.communityCanonical}`,
  `Facility UUID URLs (non-canonical): ${findings.facilityUuid}`,
  `Regulations root canonical URLs: ${findings.regulationsRootCanonical}`,
  `Regulations state canonical URLs: ${findings.regulationsStateCanonical}`,
  `Regulations topic canonical URLs: ${findings.regulationsTopicCanonical}`,
  `Legacy /senior-living URLs (non-canonical): ${findings.legacySeniorLiving}`,
  `Legacy state regulations URLs (non-canonical): ${findings.legacyStateRegulations}`,
];

const staleLegacySitemaps = legacySitemapFiles.filter((file) =>
  fs.existsSync(path.join(publicDir, file)),
);

if (staleLegacySitemaps.length > 0) {
  report.push(`Stale legacy sitemap files: ${staleLegacySitemaps.join(', ')}`);
}

console.log(report.join('\n'));

if (
  findings.nonHttps > 0 ||
  findings.hasLogin > 0 ||
  findings.hasSignup > 0 ||
  findings.legacySeniorLiving > 0 ||
  findings.facilityUuid > 0 ||
  findings.legacyStateRegulations > 0 ||
  staleLegacySitemaps.length > 0
) {
  console.error('Sitemap verification failed. Resolve the issues above.');
  process.exit(1);
}

console.log('Sitemap verification passed.');
