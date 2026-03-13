import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ALL_STATES } from '../src/data/states';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

type FacilityRedirectSeedRow = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  address_line1: string | null;
  postal_code: string | null;
  phone: string | null;
  state_license_number: string | null;
};

const toSlug = (value?: string | null) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const resolveStateSlug = (state?: string | null) => {
  const raw = (state || '').toString().trim();
  if (!raw) return '';

  const normalized = raw.toLowerCase();
  return (
    ALL_STATES.find((entry) => entry.slug === normalized)?.slug ||
    ALL_STATES.find((entry) => entry.abbreviation.toLowerCase() === normalized)?.slug ||
    ALL_STATES.find((entry) => entry.name.toLowerCase() === normalized)?.slug ||
    toSlug(raw)
  );
};

const hashString = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

const buildFacilityRouteId = (facility: FacilityRedirectSeedRow): string => {
  const keyParts = [
    facility.name || '',
    facility.city || '',
    facility.state || '',
    facility.state_license_number || '',
    facility.phone || '',
    facility.address_line1 || '',
    facility.postal_code || '',
    facility.id || '',
  ];
  const key = keyParts.filter(Boolean).join('|');
  const baseParts = [
    facility.name || '',
    facility.city || '',
    facility.state || '',
    facility.state_license_number || facility.postal_code || facility.phone || '',
  ];
  const base = toSlug(baseParts.filter(Boolean).join(' '));
  const hash = hashString(key || facility.id);
  return base ? `${base}-${hash}` : `facility-${hash}`;
};

const rootDir = process.cwd();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const fetchFacilities = async () => {
  const pageSize = 1000;
  let page = 0;
  const rows: FacilityRedirectSeedRow[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,city,state,address_line1,postal_code,phone,state_license_number,created_at')
      .order('created_at', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

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
    page += 1;
  }

  return rows;
};

const buildRedirects = async () => {
  const facilities = await fetchFacilities();

  const redirectLines: string[] = [];
  const seenRouteIds = new Map<string, number>();
  let matched = 0;
  let missing = 0;

  for (const facility of facilities) {
    const stateSlug = resolveStateSlug(facility.state);
    const citySlug = toSlug(facility.city);
    if (!stateSlug || !citySlug) {
      missing += 1;
      continue;
    }

    const baseRouteId = buildFacilityRouteId(facility);
    const currentCount = seenRouteIds.get(baseRouteId) || 0;
    seenRouteIds.set(baseRouteId, currentCount + 1);
    const routeId = currentCount === 0 ? baseRouteId : `${baseRouteId}-${currentCount + 1}`;

    matched += 1;
    redirectLines.push(
      `/facility/${encodeURIComponent(facility.id)} /senior-living/${stateSlug}/${citySlug}/${encodeURIComponent(
        routeId
      )}/ 301`
    );
  }

  const outputLines = [
    '# Auto-generated redirect rules. Do not edit manually.',
    '# Canonical host redirects',
    'http://www.silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!',
    'http://silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!',
    'https://www.silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!',
    '# Legacy URL shape redirects',
    '/assisted-living/:state/cities/:city /senior-living/:state/:city/ 301',
    '/assisted-living/:state/cities/:city/ /senior-living/:state/:city/ 301',
    '# Static trust artifacts must bypass SPA fallback',
    '/help-registry.json /help-registry.json 200!',
    '/sitemap.xml /sitemap.xml 200!',
    '/sitemap-index.xml /sitemap-index.xml 200!',
    '/sitemap-* /sitemap-:splat 200!',
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
