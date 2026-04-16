import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_STATES } from '../src/data/states';
import {
  getCareCityStaticPaths,
  getFacilityStaticPaths,
  getSeniorLivingStates,
} from '../astro-src/lib/seniorLivingData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://silvertechdirectory.com';
const PUBLIC_DIR = path.join(__dirname, '../public');
const buildTime = new Date().toISOString();
const LEGACY_SITEMAP_FILES = ['sitemap-cities.xml', 'sitemap-states.xml'];

const CARE_TYPE_CITY_CHUNK_SIZE = 50000;
const DEFAULT_CHUNK_SIZE = 50000;
const FACILITY_CHUNK_SIZE = 5000;
const CARE_TYPE_SLUGS = [
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
] as const;

const CARE_TYPE_PAGE_PRIORITY = 1.0;
const CARE_TYPE_STATE_PRIORITY = 0.9;
const CARE_TYPE_CITY_PRIORITY = 0.8;

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

type SitemapEntry = {
  url: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: number;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatPriority = (priority: number): string => priority.toFixed(1);

const writeSitemap = (filename: string, entries: SitemapEntry[]): void => {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${buildTime}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${formatPriority(entry.priority)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, filename), content);
  console.log(`Generated ${filename} with ${entries.length} URLs`);
};

const writeSitemapIndex = (filename: string, sitemapFiles: string[]): void => {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapFiles
  .map(
    (sitemapFile) => `  <sitemap>
    <loc>${BASE_URL}/${sitemapFile}</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>`;

  fs.writeFileSync(path.join(PUBLIC_DIR, filename), content);
  console.log(`Generated ${filename} linking to ${sitemapFiles.length} files`);
};

const removeFileIfExists = (filename: string): void => {
  const fullPath = path.join(PUBLIC_DIR, filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

const removeStaleChunkFiles = (prefix: string): void => {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapedPrefix}-\\d+\\.xml$`);
  const staleFiles = fs.readdirSync(PUBLIC_DIR).filter((file) => pattern.test(file));

  for (const file of staleFiles) {
    fs.unlinkSync(path.join(PUBLIC_DIR, file));
  }

  if (staleFiles.length > 0) {
    console.log(`Removed ${staleFiles.length} stale ${prefix} chunk file(s)`);
  }
};

const uniqueEntries = (entries: SitemapEntry[]): SitemapEntry[] => {
  const byUrl = new Map<string, SitemapEntry>();
  for (const entry of entries) {
    if (!byUrl.has(entry.url)) byUrl.set(entry.url, entry);
  }
  return Array.from(byUrl.values()).sort((a, b) => a.url.localeCompare(b.url));
};

type ChunkOptions = {
  baseName: string;
  entries: SitemapEntry[];
  chunkSize?: number;
  forceNumbered?: boolean;
};

const writeChunkedSitemaps = ({
  baseName,
  entries,
  chunkSize = DEFAULT_CHUNK_SIZE,
  forceNumbered = false,
}: ChunkOptions): string[] => {
  removeStaleChunkFiles(baseName);
  removeFileIfExists(`${baseName}.xml`);

  if (entries.length === 0) return [];

  if (!forceNumbered && entries.length <= chunkSize) {
    const singleFile = `${baseName}.xml`;
    writeSitemap(singleFile, entries);
    return [singleFile];
  }

  const files: string[] = [];
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    const index = Math.floor(i / chunkSize) + 1;
    const filename = `${baseName}-${index}.xml`;
    writeSitemap(filename, chunk);
    files.push(filename);
  }

  return files;
};

const toStaticEntry = (url: string, priority = 0.6): SitemapEntry => ({
  url,
  changefreq: 'weekly',
  priority,
});

async function generateSitemaps() {
  console.log('Starting sitemap generation...');

  for (const legacyFile of LEGACY_SITEMAP_FILES) {
    removeFileIfExists(legacyFile);
  }

  const regulatoryEntries = ALL_STATES.map((state) => toStaticEntry(`${BASE_URL}/regulations/${state.slug}/`, 0.7));

  const careTypeEntries = CARE_TYPE_SLUGS.map((careTypeSlug) =>
    toStaticEntry(`${BASE_URL}/${careTypeSlug}/`, CARE_TYPE_PAGE_PRIORITY),
  );

  const staticEntries = uniqueEntries(
    [
      `${BASE_URL}/`,
      `${BASE_URL}/regulations/`,
      `${BASE_URL}/search`,
      `${BASE_URL}/tools/pricing-audit`,
      `${BASE_URL}/claim-business`,
      `${BASE_URL}/survey`,
      `${BASE_URL}/pricing`,
      `${BASE_URL}/providers`,
      `${BASE_URL}/products`,
      `${BASE_URL}/products/affiliate`,
      `${BASE_URL}/faq`,
      `${BASE_URL}/advertise`,
      `${BASE_URL}/honest-care`,
      `${BASE_URL}/about/`,
      `${BASE_URL}/badges/`,
      `${BASE_URL}/why-this-exists/`,
      `${BASE_URL}/editorial-policy/`,
      `${BASE_URL}/blog`,
      `${BASE_URL}/guides/`,
      `${BASE_URL}/guides/what-families-miss-state-regulations/`,
      `${BASE_URL}/guides/assisted-living-vs-nursing-home-real-differences/`,
      `${BASE_URL}/guides/senior-care-definitions-plain-english-regulations/`,
      `${BASE_URL}/guides/senior-care-costs-explained-what-you-actually-pay/`,
      `${BASE_URL}/guides/how-families-pay-for-senior-living-financial-options/`,
      `${BASE_URL}/guides/how-to-choose/`,
      `${BASE_URL}/guides/what-it-costs/`,
      `${BASE_URL}/guides/tour-questions/`,
      `${BASE_URL}/guides/hidden-costs-of-memory-care/`,
      `${BASE_URL}/guides/guilt-about-placing-parent-in-memory-care/`,
      `${BASE_URL}/guides/grief-while-parent-is-still-alive-dementia/`,
      `${BASE_URL}/guides/caregiver-resentment-toward-parent/`,
      `${BASE_URL}/guides/sibling-not-helping-parent-care/`,
      `${BASE_URL}/guides/caregiver-at-breaking-point/`,
      ...ALL_STATES.flatMap((state) => [
        `${BASE_URL}/guides/costs/assisted-living/${state.slug}/`,
        `${BASE_URL}/guides/costs/memory-care/${state.slug}/`,
      ]),
      `${BASE_URL}/products/bathroom-safety`,
      `${BASE_URL}/products/mobility-aids`,
      `${BASE_URL}/products/bedroom-comfort`,
      `${BASE_URL}/products/kitchen-aids`,
      `${BASE_URL}/products/monitoring-safety`,
      `${BASE_URL}/products/personal-hygiene`,
      `${BASE_URL}/products/medical-supplies`,
      `${BASE_URL}/products/dementia-care`,
      `${BASE_URL}/products/daily-living-aids`,
      `${BASE_URL}/products/outdoor-travel`,
    ]
      .map((url) => toStaticEntry(url, url === `${BASE_URL}/` ? 0.7 : 0.6))
      .concat(regulatoryEntries, careTypeEntries),
  );

  console.log('Loading route seeds from static seniorLivingData inventory...');
  const states = getSeniorLivingStates();
  const cityCarePaths = getCareCityStaticPaths();
  const facilityPaths = getFacilityStaticPaths();

  const careTypeStateEntries = uniqueEntries(
    states.flatMap((state) =>
      CARE_TYPE_SLUGS
        .filter((careTypeSlug) => state.stats.careTypeCounts[careTypeSlug] > 0)
        .map((careTypeSlug) => ({
          url: `${BASE_URL}/${careTypeSlug}/${state.stateSlug}/`,
          changefreq: 'weekly' as const,
          priority: CARE_TYPE_STATE_PRIORITY,
        })),
    ),
  );

  const stateHubEntries = uniqueEntries(
    states.map((state) => ({
      url: `${BASE_URL}/states/${state.stateSlug}/`,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
  );

  const careTypeCityEntries = uniqueEntries(
    cityCarePaths.map((routePath) => ({
      url: `${BASE_URL}/${routePath.care}/${routePath.state}/${routePath.city}/`,
      changefreq: 'weekly' as const,
      priority: CARE_TYPE_CITY_PRIORITY,
    })),
  );

  const facilityEntries = uniqueEntries(
    facilityPaths.map((routePath) => ({
      url: `${BASE_URL}/${routePath.care}/${routePath.state}/${routePath.city}/${routePath.facilitySlug}/`,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
  );

  if (careTypeStateEntries.length === 0 || careTypeCityEntries.length === 0 || facilityEntries.length === 0) {
    throw new Error(
      `Static route inventory returned empty seeds (careTypeStates=${careTypeStateEntries.length}, careTypeCities=${careTypeCityEntries.length}, facilities=${facilityEntries.length}). Refusing to emit incomplete sitemap.`,
    );
  }

  console.log(
    `Prepared URLs: care-type-states=${careTypeStateEntries.length}, state-hubs=${stateHubEntries.length}, care-type-cities=${careTypeCityEntries.length}, facilities=${facilityEntries.length}`,
  );

  writeSitemap('sitemap-static.xml', staticEntries);

  const stateHubSitemapFiles = writeChunkedSitemaps({
    baseName: 'sitemap-states',
    entries: stateHubEntries,
  });
  const careTypeStateSitemapFiles = writeChunkedSitemaps({
    baseName: 'sitemap-care-type-states',
    entries: careTypeStateEntries,
  });
  const careTypeSitemapFiles = writeChunkedSitemaps({
    baseName: 'sitemap-care-type-cities',
    entries: careTypeCityEntries,
    chunkSize: CARE_TYPE_CITY_CHUNK_SIZE,
    forceNumbered: true,
  });
  const facilitySitemapFiles = writeChunkedSitemaps({
    baseName: 'sitemap-facilities',
    entries: facilityEntries,
    chunkSize: FACILITY_CHUNK_SIZE,
  });

  const sitemapFiles = [
    'sitemap-static.xml',
    ...stateHubSitemapFiles,
    ...careTypeStateSitemapFiles,
    ...careTypeSitemapFiles,
    ...facilitySitemapFiles,
  ];

  writeSitemapIndex('sitemap-index.xml', sitemapFiles);
  writeSitemapIndex('sitemap.xml', sitemapFiles);

  console.log('Sitemap generation complete.');
  console.log('Submit only https://silvertechdirectory.com/sitemap-index.xml in Search Console.');
}

generateSitemaps().catch((error) => {
  console.error('Failed to generate sitemaps:', error);
  process.exit(1);
});
