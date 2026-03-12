import type { Context } from 'https://edge.netlify.com';

type FacilityIndexItem = {
  id: string;
  name: string;
  city: string;
  state: string;
  address_line1?: string;
  postal_code?: string;
  phone?: string;
  website_url?: string;
};

type FacilityLicense = {
  license_number?: string | null;
  bed_capacity?: number | string | null;
  updated_at?: string | null;
};

type FacilityRecord = {
  id?: string;
  name?: string;
  city?: string;
  state?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  phone?: string;
  website_url?: string;
  ownership_type?: string;
  cms_provider_id?: string;
  cms_certification_number?: string;
  cms_certified_number?: string;
  updated_at?: string;
  facility_licensing?: FacilityLicense[];
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRODUCTION_ORIGIN = 'https://silvertechdirectory.com';
const ONE_DAY_SECONDS = 60 * 60 * 24;
const LOOKUP_CACHE_TTL_MS = ONE_DAY_SECONDS * 1000;
const SLOW_EDGE_WARN_MS = 50;
const FACILITY_CACHE_CONTROL = `public, max-age=0, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`;
const CARE_TYPE_SLUGS = new Set([
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
]);

type ParsedFacilityPath = {
  facilityPathId: string;
  stateSlug: string;
  citySlug: string;
};

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const slugEntryCache = new Map<string, TimedCacheEntry<FacilityIndexItem | null>>();
const facilityRecordCache = new Map<string, TimedCacheEntry<FacilityRecord | null>>();
const MAX_EDGE_CACHE_ITEMS = 20000;

const getCacheValue = <T>(store: Map<string, TimedCacheEntry<T>>, key: string): T | undefined => {
  const cached = store.get(key);
  if (!cached) return undefined;
  if (cached.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return cached.value;
};

const setCacheValue = <T>(store: Map<string, TimedCacheEntry<T>>, key: string, value: T): T => {
  if (store.size >= MAX_EDGE_CACHE_ITEMS) {
    store.clear();
  }
  store.set(key, {
    value,
    expiresAt: Date.now() + LOOKUP_CACHE_TTL_MS,
  });
  return value;
};

const decodePathSegment = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const parseFacilityPath = (pathname: string): ParsedFacilityPath | null => {
  const normalized = pathname.replace(/\/+$/, '');
  const match = normalized.match(/^\/senior-living\/([^/?#]+)\/([^/?#]+)\/([^/?#]+)$/i);
  if (!match) return null;

  const stateSlug = decodePathSegment((match[1] || '').trim()).toLowerCase();
  const citySlug = decodePathSegment((match[2] || '').trim()).toLowerCase();
  const leaf = decodePathSegment((match[3] || '').trim());
  if (!stateSlug || !citySlug || !leaf) return null;
  if (CARE_TYPE_SLUGS.has(leaf.toLowerCase())) return null;

  return {
    facilityPathId: leaf,
    stateSlug,
    citySlug,
  };
};

const inferStateAbbrFromSlug = (slug: string) => {
  const match = slug.match(/-([a-z]{2})-(?:\d{5}(?:-\d{4})?)-[a-z0-9]+$/i);
  return match?.[1]?.toUpperCase() || null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeScript = (value: string) => value.replace(/<\/script/gi, '<\\/script');

const toCleanString = (value: unknown, fallback = '') => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const toOptionalString = (value: unknown) => {
  const cleaned = toCleanString(value, '');
  return cleaned || undefined;
};

const toOptionalNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const getNetlifyEnv = (key: string) => {
  try {
    const value = (globalThis as any).Netlify?.env?.get?.(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  } catch {
    // ignore
  }
  try {
    const value = (globalThis as any).Deno?.env?.get?.(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  } catch {
    // ignore
  }
  return '';
};

const fetchJson = async <T>(request: Request, url: URL): Promise<T | null> => {
  try {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
        'x-edge-source': 'facility-metadata',
        'user-agent': request.headers.get('user-agent') || 'netlify-edge',
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const resolveSlugEntry = async (
  request: Request,
  slug: string,
  origin: URL
): Promise<FacilityIndexItem | null> => {
  const cached = getCacheValue(slugEntryCache, slug);
  if (cached !== undefined) return cached;

  const stateAbbr = inferStateAbbrFromSlug(slug);
  if (stateAbbr) {
    const shardUrl = new URL(`/facilities_index_shards/${stateAbbr}.json`, origin);
    const shard = await fetchJson<FacilityIndexItem[]>(request, shardUrl);
    const match = shard?.find((item) => item.id === slug);
    if (match) return setCacheValue(slugEntryCache, slug, match);
  }

  const fullIndexUrl = new URL('/facilities_index.json', origin);
  const index = await fetchJson<FacilityIndexItem[]>(request, fullIndexUrl);
  return setCacheValue(slugEntryCache, slug, index?.find((item) => item.id === slug) || null);
};

const fetchFacilityFromSupabase = async (
  supabaseUrl: string,
  supabaseAnonKey: string,
  args: { id?: string; slugEntry?: FacilityIndexItem | null }
): Promise<FacilityRecord | null> => {
  const slugEntry = args.slugEntry;
  const cacheKey = args.id && UUID_REGEX.test(args.id)
    ? `id:${args.id}`
    : slugEntry
      ? `slug:${slugEntry.name}|${slugEntry.city}|${slugEntry.state}|${slugEntry.postal_code || ''}`
      : null;
  if (cacheKey) {
    const cached = getCacheValue(facilityRecordCache, cacheKey);
    if (cached !== undefined) return cached;
  }

  const base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/facilities`;
  const headers = {
    apikey: supabaseAnonKey,
    authorization: `Bearer ${supabaseAnonKey}`,
    accept: 'application/json',
  };
  const select =
    'id,name,city,state,address_line1,address_line2,postal_code,phone,website_url,ownership_type,cms_provider_id,cms_certification_number,cms_certified_number,updated_at,facility_licensing(license_number,bed_capacity,updated_at)';

  const runQuery = async (query: string) => {
    try {
      const response = await fetch(`${base}?select=${encodeURIComponent(select)}&${query}&limit=1`, {
        headers,
      });
      if (!response.ok) return cacheKey ? setCacheValue(facilityRecordCache, cacheKey, null) : null;
      const rows = (await response.json()) as FacilityRecord[];
      const firstRow = rows?.[0] || null;
      return cacheKey ? setCacheValue(facilityRecordCache, cacheKey, firstRow) : firstRow;
    } catch {
      return cacheKey ? setCacheValue(facilityRecordCache, cacheKey, null) : null;
    }
  };

  if (args.id && UUID_REGEX.test(args.id)) {
    return runQuery(`id=eq.${encodeURIComponent(args.id)}`);
  }

  if (!slugEntry) return null;

  const strict = await runQuery(
    `name=eq.${encodeURIComponent(slugEntry.name)}&city=eq.${encodeURIComponent(
      slugEntry.city
    )}&state=eq.${encodeURIComponent(slugEntry.state)}&postal_code=eq.${encodeURIComponent(
      slugEntry.postal_code || ''
    )}`
  );
  if (strict) return strict;

  return runQuery(
    `name=eq.${encodeURIComponent(slugEntry.name)}&city=eq.${encodeURIComponent(
      slugEntry.city
    )}&state=eq.${encodeURIComponent(slugEntry.state)}`
  );
};

const buildMetadata = (
  pathParts: ParsedFacilityPath,
  record: FacilityRecord | null,
  fallback: FacilityIndexItem | null
) => {
  const { facilityPathId, stateSlug, citySlug } = pathParts;
  const name = toCleanString(record?.name ?? fallback?.name, 'Senior Living Facility');
  const city = toCleanString(record?.city ?? fallback?.city);
  const state = toCleanString(record?.state ?? fallback?.state);
  const street = toCleanString(record?.address_line1 ?? fallback?.address_line1);
  const postalCode = toCleanString(record?.postal_code ?? fallback?.postal_code);
  const phone = toOptionalString(record?.phone ?? fallback?.phone);
  const websiteUrl = toOptionalString(record?.website_url ?? fallback?.website_url);
  const ownershipType = toOptionalString(record?.ownership_type);

  const license = record?.facility_licensing?.[0] || null;
  const licenseNumber = toOptionalString(license?.license_number);
  const bedCapacity = toOptionalNumber(license?.bed_capacity);
  const cmsProviderId = toOptionalString(
    record?.cms_provider_id || record?.cms_certification_number || record?.cms_certified_number
  );

  const localText = city && state ? ` in ${city}, ${state}` : '';
  const title = `${name} | SilverTech Digital Credential`;
  const description = `View verified profile details for ${name}${localText}. License ${
    licenseNumber || 'pending'
  } and CMS credential overview.`;
  const canonical = `${PRODUCTION_ORIGIN}/senior-living/${stateSlug}/${citySlug}/${encodeURIComponent(
    facilityPathId
  )}/`;
  const shareImage = `${PRODUCTION_ORIGIN}/hero.png`;
  const fullAddress = [street, city && state ? `${city}, ${state}` : city || state, postalCode]
    .filter(Boolean)
    .join(', ');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name,
    identifier: licenseNumber,
    url: canonical,
    telephone: phone,
    sameAs: websiteUrl,
    image: shareImage,
    address: {
      '@type': 'PostalAddress',
      streetAddress: street || undefined,
      addressLocality: city || undefined,
      addressRegion: state || undefined,
      postalCode: postalCode || undefined,
      addressCountry: 'US',
    },
    additionalProperty: [
      cmsProviderId
        ? {
            '@type': 'PropertyValue',
            name: 'CMS Provider ID',
            value: cmsProviderId,
          }
        : null,
      bedCapacity !== undefined
        ? {
            '@type': 'PropertyValue',
            name: 'Authorized Capacity',
            value: `${bedCapacity}`,
          }
        : null,
      ownershipType
        ? {
            '@type': 'PropertyValue',
            name: 'Ownership Type',
            value: ownershipType,
          }
        : null,
    ].filter(Boolean),
  };

  return {
    title,
    description,
    canonical,
    name,
    shareImage,
    fullAddress,
    schema,
  };
};

const buildHeadMeta = (meta: ReturnType<typeof buildMetadata>) => {
  const tags = [
    `<meta data-edge-facility-meta="1" name="description" content="${escapeHtml(meta.description)}">`,
    `<meta data-edge-facility-meta="1" property="og:type" content="article">`,
    `<meta data-edge-facility-meta="1" property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta data-edge-facility-meta="1" property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta data-edge-facility-meta="1" property="og:url" content="${escapeHtml(meta.canonical)}">`,
    `<meta data-edge-facility-meta="1" property="og:image" content="${escapeHtml(meta.shareImage)}">`,
    `<meta data-edge-facility-meta="1" name="twitter:card" content="summary_large_image">`,
    `<meta data-edge-facility-meta="1" name="twitter:title" content="${escapeHtml(meta.title)}">`,
    `<meta data-edge-facility-meta="1" name="twitter:description" content="${escapeHtml(meta.description)}">`,
    `<meta data-edge-facility-meta="1" name="twitter:image" content="${escapeHtml(meta.shareImage)}">`,
    `<link data-edge-facility-meta="1" rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    `<script data-edge-facility-schema="1" type="application/ld+json">${escapeScript(
      JSON.stringify(meta.schema)
    )}</script>`,
  ];
  return tags.join('');
};

const hiddenH1 = (name: string) =>
  `<h1 data-edge-facility-h1="1" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;">${escapeHtml(
    name
  )}</h1>`;

const errorToMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'unknown error';
  }
};

export default async (request: Request, context: Context) => {
  try {
    const startedAt = Date.now();
    const url = new URL(request.url);
    const pathParts = parseFacilityPath(url.pathname);
    if (!pathParts) return context.next();
    const { facilityPathId } = pathParts;
    let slugLookupMs = 0;
    let supabaseLookupMs = 0;
    let rewriteMs = 0;

    const supabaseUrl = getNetlifyEnv('VITE_SUPABASE_URL');
    const supabaseAnonKey = getNetlifyEnv('VITE_SUPABASE_ANON_KEY');

    let slugEntry: FacilityIndexItem | null = null;
    if (!UUID_REGEX.test(facilityPathId)) {
      const slugLookupStartedAt = Date.now();
      slugEntry = await resolveSlugEntry(request, facilityPathId, url);
      slugLookupMs = Date.now() - slugLookupStartedAt;
    }

    const supabaseLookupStartedAt = Date.now();
    const facilityRecord =
      supabaseUrl && supabaseAnonKey
        ? await fetchFacilityFromSupabase(supabaseUrl, supabaseAnonKey, {
            id: facilityPathId,
            slugEntry,
          })
        : null;
    supabaseLookupMs = Date.now() - supabaseLookupStartedAt;

    if (!facilityRecord && !slugEntry) {
      return context.next();
    }

    const meta = buildMetadata(pathParts, facilityRecord, slugEntry);
    const response = await context.next();
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const headMeta = buildHeadMeta(meta);
    const initialH1 = hiddenH1(meta.name);
    const rewriteStartedAt = Date.now();

    let transformed: Response;
    try {
      transformed = new HTMLRewriter()
        .on('title', {
          element(element) {
            element.setInnerContent(meta.title);
          },
        })
        .on('meta[name="description"]', {
          element(element) {
            element.setAttribute('content', meta.description);
          },
        })
        .on('meta[property="og:title"]', {
          element(element) {
            element.setAttribute('content', meta.title);
          },
        })
        .on('meta[property="og:description"]', {
          element(element) {
            element.setAttribute('content', meta.description);
          },
        })
        .on('meta[property="og:url"]', {
          element(element) {
            element.setAttribute('content', meta.canonical);
          },
        })
        .on('meta[property="og:image"]', {
          element(element) {
            element.setAttribute('content', meta.shareImage);
          },
        })
        .on('meta[name="twitter:title"]', {
          element(element) {
            element.setAttribute('content', meta.title);
          },
        })
        .on('meta[name="twitter:description"]', {
          element(element) {
            element.setAttribute('content', meta.description);
          },
        })
        .on('meta[name="twitter:image"]', {
          element(element) {
            element.setAttribute('content', meta.shareImage);
          },
        })
        .on('link[rel="canonical"]', {
          element(element) {
            element.setAttribute('href', meta.canonical);
          },
        })
        .on('head', {
          element(element) {
            element.append(headMeta, { html: true });
          },
        })
        .on('body', {
          element(element) {
            element.prepend(initialH1, { html: true });
          },
        })
        .transform(response);
    } catch (rewriteError) {
      console.error(
        `[facility-metadata] html rewrite failed for ${url.pathname}: ${errorToMessage(rewriteError)}`
      );
      return response;
    }
    rewriteMs = Date.now() - rewriteStartedAt;

    const totalMs = Date.now() - startedAt;
    const headers = new Headers(transformed.headers);
    headers.set('Cache-Control', FACILITY_CACHE_CONTROL);
    headers.set(
      'Server-Timing',
      [
        `edge;dur=${totalMs.toFixed(1)}`,
        `slug;dur=${slugLookupMs.toFixed(1)}`,
        `db;dur=${supabaseLookupMs.toFixed(1)}`,
        `rewrite;dur=${rewriteMs.toFixed(1)}`,
      ].join(', ')
    );

    if (totalMs > SLOW_EDGE_WARN_MS) {
      console.warn(
        `[facility-metadata] slow edge request ${totalMs}ms for ${url.pathname} (slug=${slugLookupMs}ms db=${supabaseLookupMs}ms rewrite=${rewriteMs}ms)`
      );
    }

    return new Response(transformed.body, {
      status: transformed.status,
      statusText: transformed.statusText,
      headers,
    });
  } catch (error) {
    console.error(
      `[facility-metadata] unhandled edge error for ${request.url}: ${errorToMessage(error)}`
    );
    return context.next();
  }
};

export const config = {
  path: '/senior-living/*',
};
