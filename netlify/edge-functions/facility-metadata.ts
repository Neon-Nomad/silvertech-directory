type Context = {
  next(): Promise<Response>;
};

type HtmlRewriterElement = {
  setInnerContent(content: string): void;
  setAttribute(name: string, value: string): void;
  append(content: string, options?: { html?: boolean }): void;
  prepend(content: string, options?: { html?: boolean }): void;
};

declare class HTMLRewriter {
  on(
    selector: string,
    handlers: {
      element(element: HtmlRewriterElement): void;
    },
  ): HTMLRewriter;
  transform(response: Response): Response;
}

type FacilityLicense = {
  license_number?: string | null;
};

type FacilityRecord = {
  id?: string;
  public_slug?: string | null;
  public_route_id?: number | null;
  primary_care_type_slug?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  state_license_number?: string | null;
  address_line1?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  website_url?: string | null;
  ownership_type?: string | null;
  cms_provider_id?: string | null;
  cms_certification_number?: string | null;
  cms_certified_number?: string | null;
  updated_at?: string | null;
  facility_licensing?: FacilityLicense[];
};

type ParsedCommunityPath = {
  communityId: string;
  publicSlug: string;
  publicRouteId: number;
};

type TimedCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const PRODUCTION_ORIGIN = 'https://silvertechdirectory.com';
const ONE_DAY_SECONDS = 60 * 60 * 24;
const LOOKUP_CACHE_TTL_MS = ONE_DAY_SECONDS * 1000;
const FACILITY_CACHE_CONTROL = `public, max-age=0, s-maxage=${ONE_DAY_SECONDS}, stale-while-revalidate=${ONE_DAY_SECONDS}`;
const COMMUNITY_ID_PATTERN = /^(?<slug>[a-z0-9]+(?:-[a-z0-9]+)*)-(?<routeId>\d+)$/i;
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

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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

const parseCommunityPath = (pathname: string): ParsedCommunityPath | null => {
  const normalized = pathname.replace(/\/+$/, '');
  const match = normalized.match(/^\/community\/([^/?#]+)$/i);
  const rawCommunityId = match?.[1];
  if (!rawCommunityId) return null;

  const decoded = decodeURIComponent(rawCommunityId.trim());
  const communityMatch = COMMUNITY_ID_PATTERN.exec(decoded);
  if (!communityMatch?.groups) return null;

  const publicRouteId = Number(communityMatch.groups.routeId);
  if (!Number.isFinite(publicRouteId)) return null;

  return {
    communityId: decoded,
    publicSlug: communityMatch.groups.slug.toLowerCase(),
    publicRouteId,
  };
};

const fetchFacilityFromSupabase = async (
  supabaseUrl: string,
  supabaseAnonKey: string,
  publicRouteId: number,
): Promise<FacilityRecord | null> => {
  const cacheKey = `route:${publicRouteId}`;
  const cached = getCacheValue(facilityRecordCache, cacheKey);
  if (cached !== undefined) return cached;

  const base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/facilities`;
  const headers = {
    apikey: supabaseAnonKey,
    authorization: `Bearer ${supabaseAnonKey}`,
    accept: 'application/json',
  };
  const select =
    'id,public_slug,public_route_id,primary_care_type_slug,name,city,state,state_license_number,address_line1,postal_code,phone,website_url,ownership_type,cms_provider_id,cms_certification_number,cms_certified_number,updated_at,facility_licensing(license_number)';

  try {
    const response = await fetch(
      `${base}?select=${encodeURIComponent(select)}&public_route_id=eq.${encodeURIComponent(String(publicRouteId))}&limit=1`,
      { headers },
    );
    if (!response.ok) return setCacheValue(facilityRecordCache, cacheKey, null);
    const rows = (await response.json()) as FacilityRecord[];
    return setCacheValue(facilityRecordCache, cacheKey, rows?.[0] || null);
  } catch {
    return setCacheValue(facilityRecordCache, cacheKey, null);
  }
};

const buildMetadata = (record: FacilityRecord) => {
  const name = toCleanString(record.name, 'Senior Living Community');
  const city = toCleanString(record.city);
  const state = toCleanString(record.state);
  const street = toCleanString(record.address_line1);
  const postalCode = toCleanString(record.postal_code);
  const phone = toCleanString(record.phone);
  const websiteUrl = toCleanString(record.website_url);
  const licenseNumber =
    toCleanString(record.facility_licensing?.[0]?.license_number) ||
    toCleanString(record.state_license_number);
  const publicSlug = toSlug(record.public_slug || name);
  const publicRouteId = Number(record.public_route_id);
  const primaryCareSlug = toSlug(record.primary_care_type_slug || 'assisted-living');
  const primaryCareLabel =
    ({
      'assisted-living': 'Assisted Living',
      'memory-care': 'Memory Care',
      'nursing-homes': 'Nursing Homes',
      'independent-living': 'Independent Living',
      'residential-care': 'Residential Care',
      'adult-day-services': 'Adult Day Services',
      ccrc: 'CCRC',
    } as Record<string, string>)[primaryCareSlug] || 'Senior Care';

  const citySlug = toSlug(city);
  const stateSlug = toSlug(state);
  const canonical = `${PRODUCTION_ORIGIN}/community/${publicSlug}-${publicRouteId}/`;
  const title = `${name} | ${primaryCareLabel} in ${city}, ${state}`;
  const description = `View verified profile details for ${name} in ${city}, ${state}. License ${licenseNumber || 'pending'} and facility profile highlights.`;
  const shareImage = `${PRODUCTION_ORIGIN}/hero.png`;

  return {
    title,
    description,
    canonical,
    name,
    shareImage,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'MedicalBusiness',
        name,
        identifier: licenseNumber || undefined,
        url: canonical,
        telephone: phone || undefined,
        image: shareImage,
        sameAs: websiteUrl || undefined,
        address: {
          '@type': 'PostalAddress',
          streetAddress: street || undefined,
          addressLocality: city || undefined,
          addressRegion: state || undefined,
          postalCode: postalCode || undefined,
          addressCountry: 'US',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${PRODUCTION_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: primaryCareLabel, item: `${PRODUCTION_ORIGIN}/${primaryCareSlug}/` },
          { '@type': 'ListItem', position: 3, name: state, item: `${PRODUCTION_ORIGIN}/${primaryCareSlug}/${stateSlug}/` },
          { '@type': 'ListItem', position: 4, name: city, item: `${PRODUCTION_ORIGIN}/${primaryCareSlug}/${stateSlug}/${citySlug}/` },
          { '@type': 'ListItem', position: 5, name, item: canonical },
        ],
      },
    ],
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
    `<script data-edge-facility-schema="1" type="application/ld+json">${escapeScript(JSON.stringify(meta.schema))}</script>`,
  ];
  return tags.join('');
};

const hiddenH1 = (name: string) =>
  `<h1 data-edge-facility-h1="1" style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;">${escapeHtml(name)}</h1>`;

const buildNotFoundResponse = (pathname: string) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Community Not Found</title><meta name="robots" content="noindex, nofollow"></head><body><main><h1>Community Not Found</h1><p>The requested community path could not be resolved: ${escapeHtml(pathname)}</p></main></body></html>`,
    {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=0, s-maxage=300',
      },
    },
  );

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
    const url = new URL(request.url);
    const pathParts = parseCommunityPath(url.pathname);
    if (!pathParts) return context.next();

    const supabaseUrl = getNetlifyEnv('VITE_SUPABASE_URL');
    const supabaseAnonKey = getNetlifyEnv('VITE_SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return context.next();
    }

    const facilityRecord = await fetchFacilityFromSupabase(
      supabaseUrl,
      supabaseAnonKey,
      pathParts.publicRouteId,
    );

    if (!facilityRecord) {
      return buildNotFoundResponse(url.pathname);
    }

    const canonicalSlug = toSlug(facilityRecord.public_slug || '');
    if (!canonicalSlug || canonicalSlug !== pathParts.publicSlug) {
      return buildNotFoundResponse(url.pathname);
    }

    const meta = buildMetadata(facilityRecord);
    const response = await context.next();
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return response;

    const transformed = new HTMLRewriter()
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
          element.append(buildHeadMeta(meta), { html: true });
        },
      })
      .on('body', {
        element(element) {
          element.prepend(hiddenH1(meta.name), { html: true });
        },
      })
      .transform(response);

    const headers = new Headers(transformed.headers);
    headers.set('Cache-Control', FACILITY_CACHE_CONTROL);

    return new Response(transformed.body, {
      status: transformed.status,
      statusText: transformed.statusText,
      headers,
    });
  } catch (error) {
    console.error(
      `[facility-metadata] unhandled edge error for ${request.url}: ${errorToMessage(error)}`,
    );
    return context.next();
  }
};

export const config = {
  path: '/community/*',
};
