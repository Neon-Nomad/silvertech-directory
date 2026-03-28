import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { ALL_STATES } from '../src/data/states';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://silvertechdirectory.com';
const PUBLIC_DIR = path.join(__dirname, '../public');
const buildTime = new Date().toISOString();
const LEGACY_SITEMAP_FILES = ['sitemap-cities.xml', 'sitemap-states.xml'];

const CARE_TYPE_CITY_CHUNK_SIZE = 50000;
const DEFAULT_CHUNK_SIZE = 50000;
const FACILITY_CHUNK_SIZE = 5000;
const REGULATIONS_TOPIC_SLUGS = ['licensing', 'inspections', 'staffing', 'resident-rights', 'complaints', 'memory-care'];
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing Supabase credentials. Ensure .env has SUPABASE_URL/VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

type SitemapEntry = {
  url: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: number;
};

type FacilitySeedRow = {
  id: string;
  public_slug: string | null;
  public_route_id: number | null;
  primary_care_type_slug: string | null;
  name: string | null;
  city: string | null;
  state: string | null;
  address_line1: string | null;
  postal_code: string | null;
  phone: string | null;
  state_license_number: string | null;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const formatPriority = (priority: number): string => priority.toFixed(1);

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const STATE_SLUG_BY_ABBR = new Map(
  ALL_STATES.map((state) => [state.abbreviation.toLowerCase(), state.slug]),
);

const resolveStateSlug = (state: string | null): string => {
  const raw = (state || '').trim();
  if (!raw) return '';
  const normalized = raw.toLowerCase();
  return STATE_SLUG_BY_ABBR.get(normalized) || toSlug(raw);
};

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

type FacilityUrlSeed = {
  careTypeSlug: string;
  stateSlug: string;
  citySlug: string;
  facilitySlug: string;
};

const loadFacilityRows = async (): Promise<FacilityUrlSeed[]> => {
  console.log('Loading facility sitemap seeds directly from Supabase facilities table...');
  const allFacilities: FacilitySeedRow[] = [];
  const pageSize = 1000;
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select(
        'id,public_slug,public_route_id,primary_care_type_slug,name,city,state,address_line1,postal_code,phone,state_license_number,created_at',
      )
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      break;
    }

    allFacilities.push(...(data as FacilitySeedRow[]));
    console.log(`Fetched batch ${page + 1}: ${data.length} facilities`);

    if (data.length < pageSize) {
      break;
    }

    page += 1;
  }

  const routeSeeds = allFacilities
    .map((facility): FacilityUrlSeed | null => {
      const publicSlug = toSlug(facility.public_slug || facility.name || '');
      const publicRouteId = Number(facility.public_route_id);
      const careTypeSlug = facility.primary_care_type_slug?.trim();
      const citySlug = toSlug(facility.city || '');
      const stateSlug = resolveStateSlug(facility.state);

      if (!publicSlug || !Number.isFinite(publicRouteId) || !careTypeSlug || !citySlug || !stateSlug) return null;

      return {
        careTypeSlug,
        stateSlug,
        citySlug,
        facilitySlug: `${publicSlug}-${Math.trunc(publicRouteId)}`,
      };
    })
    .filter((facility): facility is FacilityUrlSeed => Boolean(facility));

  console.log(`Loaded ${routeSeeds.length} facilities from Supabase.`);
  return routeSeeds;
};

async function generateSitemaps() {
  console.log('Starting sitemap generation...');

  for (const legacyFile of LEGACY_SITEMAP_FILES) {
    removeFileIfExists(legacyFile);
  }

  const regulatoryEntries = ALL_STATES.flatMap((state) => [
    toStaticEntry(`${BASE_URL}/regulations/${state.slug}/`, 0.7),
    ...REGULATIONS_TOPIC_SLUGS.map((topicSlug) =>
      toStaticEntry(`${BASE_URL}/regulations/${state.slug}/${topicSlug}/`, 0.6),
    ),
  ]);

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
      // State cost guides — assisted-living and memory-care for every state
      ...ALL_STATES.flatMap((s) => [
        `${BASE_URL}/guides/costs/assisted-living/${s.slug}/`,
        `${BASE_URL}/guides/costs/memory-care/${s.slug}/`,
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

  console.log('Loading state/city/care-type path seeds from data contract...');
  const { getAllStates, getAllCities, getAllCityCareCombos } = await import(
    '../astro-src/lib/seniorDataContract'
  );
  const [states, cityCareCombos, facilities] = await Promise.all([
    getAllStates(),
    getAllCityCareCombos(),
    loadFacilityRows(),
  ]);

  const careTypeStateEntries = uniqueEntries(
    CARE_TYPE_SLUGS.flatMap((careTypeSlug) =>
      states.map((stateSlug) => ({
        url: `${BASE_URL}/${careTypeSlug}/${stateSlug}/`,
        changefreq: 'weekly' as const,
        priority: CARE_TYPE_STATE_PRIORITY,
      })),
    ),
  );

  const stateHubEntries = uniqueEntries(
    states.map((stateSlug) => ({
      url: `${BASE_URL}/states/${stateSlug}/`,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
  );

  const careTypeCityEntries = uniqueEntries(
    cityCareCombos.map(({ state, city, careTypeSlug }) => ({
      url: `${BASE_URL}/${careTypeSlug}/${state}/${city}/`,
      changefreq: 'weekly',
      priority: CARE_TYPE_CITY_PRIORITY,
    })),
  );

  const facilityEntries = uniqueEntries(
    facilities.map((facility) => ({
      url: `${BASE_URL}/${facility.careTypeSlug}/${facility.stateSlug}/${facility.citySlug}/${facility.facilitySlug}/`,
      changefreq: 'weekly' as const,
      priority: 0.7,
    })),
  );

  if (careTypeStateEntries.length === 0 || careTypeCityEntries.length === 0) {
    throw new Error(
      `Data contract returned empty directory seeds (careTypeStates=${careTypeStateEntries.length}, careTypeCities=${careTypeCityEntries.length}). Refusing to emit incomplete sitemap.`,
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
