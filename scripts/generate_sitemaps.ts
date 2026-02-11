import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://silvertechdirectory.com';
const PUBLIC_DIR = path.join(__dirname, '../public');

// Supabase Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Ensure public dir exists
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const buildTime = new Date().toISOString();

// Helper to write XML
const writeSitemap = (filename: string, urls: string[]) => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${buildTime}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, filename), content);
    console.log(`Generated ${filename} with ${urls.length} URLs`);
};

const writeSitemapIndex = (filenames: string[]) => {
    const content = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${filenames.map(filename => `  <sitemap>
    <loc>${BASE_URL}/${filename}</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-index.xml'), content);
    console.log(`Generated sitemap-index.xml linking to ${filenames.length} sitemaps`);
};

// State Data
const ALL_STATES = [
    { name: "Alabama", abbreviation: "AL", slug: "alabama" },
    { name: "Alaska", abbreviation: "AK", slug: "alaska" },
    { name: "Arizona", abbreviation: "AZ", slug: "arizona" },
    { name: "Arkansas", abbreviation: "AR", slug: "arkansas" },
    { name: "California", abbreviation: "CA", slug: "california" },
    { name: "Colorado", abbreviation: "CO", slug: "colorado" },
    { name: "Connecticut", abbreviation: "CT", slug: "connecticut" },
    { name: "Delaware", abbreviation: "DE", slug: "delaware" },
    { name: "Florida", abbreviation: "FL", slug: "florida" },
    { name: "Georgia", abbreviation: "GA", slug: "georgia" },
    { name: "Hawaii", abbreviation: "HI", slug: "hawaii" },
    { name: "Idaho", abbreviation: "ID", slug: "idaho" },
    { name: "Illinois", abbreviation: "IL", slug: "illinois" },
    { name: "Indiana", abbreviation: "IN", slug: "indiana" },
    { name: "Iowa", abbreviation: "IA", slug: "iowa" },
    { name: "Kansas", abbreviation: "KS", slug: "kansas" },
    { name: "Kentucky", abbreviation: "KY", slug: "kentucky" },
    { name: "Louisiana", abbreviation: "LA", slug: "louisiana" },
    { name: "Maine", abbreviation: "ME", slug: "maine" },
    { name: "Maryland", abbreviation: "MD", slug: "maryland" },
    { name: "Massachusetts", abbreviation: "MA", slug: "massachusetts" },
    { name: "Michigan", abbreviation: "MI", slug: "michigan" },
    { name: "Minnesota", abbreviation: "MN", slug: "minnesota" },
    { name: "Mississippi", abbreviation: "MS", slug: "mississippi" },
    { name: "Missouri", abbreviation: "MO", slug: "missouri" },
    { name: "Montana", abbreviation: "MT", slug: "montana" },
    { name: "Nebraska", abbreviation: "NE", slug: "nebraska" },
    { name: "Nevada", abbreviation: "NV", slug: "nevada" },
    { name: "New Hampshire", abbreviation: "NH", slug: "new-hampshire" },
    { name: "New Jersey", abbreviation: "NJ", slug: "new-jersey" },
    { name: "New Mexico", abbreviation: "NM", slug: "new-mexico" },
    { name: "New York", abbreviation: "NY", slug: "new-york" },
    { name: "North Carolina", abbreviation: "NC", slug: "north-carolina" },
    { name: "North Dakota", abbreviation: "ND", slug: "north-dakota" },
    { name: "Ohio", abbreviation: "OH", slug: "ohio" },
    { name: "Oklahoma", abbreviation: "OK", slug: "oklahoma" },
    { name: "Oregon", abbreviation: "OR", slug: "oregon" },
    { name: "Pennsylvania", abbreviation: "PA", slug: "pennsylvania" },
    { name: "Rhode Island", abbreviation: "RI", slug: "rhode-island" },
    { name: "South Carolina", abbreviation: "SC", slug: "south-carolina" },
    { name: "South Dakota", abbreviation: "SD", slug: "south-dakota" },
    { name: "Tennessee", abbreviation: "TN", slug: "tennessee" },
    { name: "Texas", abbreviation: "TX", slug: "texas" },
    { name: "Utah", abbreviation: "UT", slug: "utah" },
    { name: "Vermont", abbreviation: "VT", slug: "vermont" },
    { name: "Virginia", abbreviation: "VA", slug: "virginia" },
    { name: "Washington", abbreviation: "WA", slug: "washington" },
    { name: "West Virginia", abbreviation: "WV", slug: "west-virginia" },
    { name: "Wisconsin", abbreviation: "WI", slug: "wisconsin" },
    { name: "Wyoming", abbreviation: "WY", slug: "wyoming" }
];

async function generateSitemaps() {
    console.log('Starting sitemap generation...');

    // 1. Static & Hub Pages
    const staticUrls = [
        `${BASE_URL}/`,
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
        `${BASE_URL}/blog`,
        `${BASE_URL}/veterans-benefits`,
        // Product Categories
        `${BASE_URL}/products/bathroom-safety`,
        `${BASE_URL}/products/mobility-aids`,
        `${BASE_URL}/products/bedroom-comfort`,
        `${BASE_URL}/products/kitchen-aids`,
        `${BASE_URL}/products/monitoring-safety`,
        `${BASE_URL}/products/personal-hygiene`,
        `${BASE_URL}/products/medical-supplies`,
        `${BASE_URL}/products/dementia-care`,
        `${BASE_URL}/products/daily-living-aids`,
        `${BASE_URL}/products/outdoor-travel`
    ];

    // 2. Fetch Facilities
    console.log('Loading facilities for sitemaps...');
    const facilityIndexPath = path.join(PUBLIC_DIR, 'facilities_index.json');
    let facilities: any[] = [];
    if (fs.existsSync(facilityIndexPath)) {
        facilities = JSON.parse(fs.readFileSync(facilityIndexPath, 'utf-8'));
        console.log(`Loaded ${facilities.length} facilities from facilities_index.json.`);
    } else {
        console.log('facilities_index.json not found. Falling back to Supabase.');
        let allFacilities: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('facilities')
                .select('id, state, city')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('Error fetching facilities:', error);
                break;
            }

            if (data && data.length > 0) {
                allFacilities = [...allFacilities, ...data];
                console.log(`Fetched batch ${page + 1}: ${data.length} facilities`);
                if (data.length < pageSize) hasMore = false;
                page++;
            } else {
                hasMore = false;
            }
        }

        facilities = allFacilities;
        console.log(`Fetched total ${facilities.length} facilities.`);
    }

    const stateUrls: string[] = [];
    const cityUrls: Set<string> = new Set();
    const facilityUrls: string[] = [];
    const activeStates = new Set<string>();

    if (facilities) {
        for (const facility of facilities) {
            if (!facility.state) continue;

            activeStates.add(facility.state);

            // Facility Page (canonical slug id from index if available)
            facilityUrls.push(`${BASE_URL}/facility/${facility.id}`);

            // City Page
            if (facility.city && facility.state) {
                const stateDef = ALL_STATES.find(s => s.abbreviation === facility.state);
                if (stateDef) {
                    const citySlug = facility.city.trim().toLowerCase().replace(/ /g, '-');
                    cityUrls.add(`${BASE_URL}/assisted-living/${stateDef.slug}/cities/${citySlug}`);
                }
            }
        }
    }

    // Generate State URLs for active states
    for (const abbr of activeStates) {
        const stateDef = ALL_STATES.find(s => s.abbreviation === abbr);
        if (stateDef) {
            const slug = stateDef.slug;
            // State Hub Pages
            stateUrls.push(`${BASE_URL}/states/${slug}`);
            stateUrls.push(`${BASE_URL}/states/${slug}/regulatory`);
            stateUrls.push(`${BASE_URL}/states/${slug}/medicaid`);
            stateUrls.push(`${BASE_URL}/states/${slug}/rules`);
            stateUrls.push(`${BASE_URL}/states/${slug}/ombudsman`);

            // Assisted Living State Page
            stateUrls.push(`${BASE_URL}/assisted-living/${slug}`);
        }
    }

    // Write Files
    writeSitemap('sitemap-static.xml', staticUrls);
    writeSitemap('sitemap-states.xml', stateUrls);
    writeSitemap('sitemap-cities.xml', Array.from(cityUrls));

    // Facility Chunks
    const CHUNK_SIZE = 5000;
    const facilityChunks: string[] = [];

    for (let i = 0; i < facilityUrls.length; i += CHUNK_SIZE) {
        const chunk = facilityUrls.slice(i, i + CHUNK_SIZE);
        const filename = `sitemap-facilities-${String(Math.floor(i / CHUNK_SIZE) + 1).padStart(4, '0')}.xml`;
        writeSitemap(filename, chunk);
        facilityChunks.push(filename);
    }

    // Facility Index (Nested Index)
    const facilityIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${facilityChunks.map(filename => `  <sitemap>
    <loc>${BASE_URL}/${filename}</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap-facilities.xml'), facilityIndexContent);
    console.log(`Generated sitemap-facilities.xml linking to ${facilityChunks.length} chunks`);

    // Master Index
    const masterIndexContent = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/sitemap-static.xml</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-states.xml</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-cities.xml</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/sitemap-facilities.xml</loc>
    <lastmod>${buildTime}</lastmod>
  </sitemap>
</sitemapindex>`;
    fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), masterIndexContent);
    console.log('Generated sitemap.xml (Master Index)');

    console.log('Sitemap generation complete!');
}

generateSitemaps();
