import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

type FacilityIndexEntry = {
  id: string;
  name: string;
  city: string;
  state: string;
  postal_code?: string;
};

const normalize = (value?: string | null) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '');

const makeKey = (name?: string | null, city?: string | null, state?: string | null, postal?: string | null) =>
  `${normalize(name)}|${normalize(city)}|${(state || '').toString().trim().toUpperCase()}|${(postal || '')
    .toString()
    .trim()}`;

const rootDir = process.cwd();
const indexPath = path.join(rootDir, 'public', 'facilities_index.json');
if (!fs.existsSync(indexPath)) {
  console.error(`Missing facilities index file at ${indexPath}`);
  process.exit(1);
}

const indexEntries = JSON.parse(fs.readFileSync(indexPath, 'utf-8')) as FacilityIndexEntry[];
const indexMap = new Map<string, string>();

for (const entry of indexEntries) {
  const key = makeKey(entry.name, entry.city, entry.state, entry.postal_code);
  if (!indexMap.has(key)) {
    indexMap.set(key, entry.id);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const fetchFacilities = async () => {
  const pageSize = 1000;
  let from = 0;
  const rows: Array<{ id: string; name: string; city: string; state: string; postal_code: string | null }> = [];

  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,city,state,postal_code')
      .range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      break;
    }
    rows.push(...data);
    if (data.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return rows;
};

const buildRedirects = async () => {
  const facilities = await fetchFacilities();

  const redirectLines: string[] = [];
  let matched = 0;
  let missing = 0;

  for (const facility of facilities) {
    const key = makeKey(facility.name, facility.city, facility.state, facility.postal_code);
    const slug = indexMap.get(key);
    if (!slug) {
      missing += 1;
      continue;
    }
    matched += 1;
    redirectLines.push(`/facility/${facility.id} /facility/${slug} 301`);
  }

  const outputLines = [
    '# Auto-generated redirect rules. Do not edit manually.',
    '# Static trust artifacts must bypass SPA fallback',
    '/help-registry.json /help-registry.json 200!',
    '/sitemap.xml /sitemap.xml 200!',
    '/sitemap-index.xml /sitemap-index.xml 200!',
    '/sitemap-* /sitemap-:splat 200!',
    '# City route canonicalization',
    '/assisted-living/:state/:city /assisted-living/:state/cities/:city 301',
    '# Legacy hashed asset compatibility (prevents stale HTML from loading index fallback)',
    '/assets/index-:hash.js /assets/index.js 200',
    '/assets/maps-:hash.js /assets/maps.js 200',
    '/assets/react-:hash.js /assets/react.js 200',
    '/assets/supabase-:hash.js /assets/supabase.js 200',
    '/assets/vendor-:hash.js /assets/vendor.js 200',
    '/assets/index-:hash.css /assets/index.css 200',
    '/assets/maps-:hash.css /assets/maps.css 200',
    '# Facility UUID -> slug canonicalization',
    ...redirectLines,
    '# SPA fallback',
    '/* /index.html 200',
  ];

  const outPath = path.join(rootDir, 'public', '_redirects');
  fs.writeFileSync(outPath, `${outputLines.join('\n')}\n`, 'utf-8');

  console.log(`Redirects written to ${outPath}`);
  console.log(`Facilities matched: ${matched}`);
  console.log(`Facilities missing mapping: ${missing}`);
};

buildRedirects().catch((err) => {
  console.error('Failed to generate redirects:', err);
  process.exit(1);
});
