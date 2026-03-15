import { ALL_STATES } from '@/src/data/states';

export const CARE_TYPE_ROUTE_ORDER = [
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
] as const;

export type CareTypeRouteSlug = (typeof CARE_TYPE_ROUTE_ORDER)[number];

export const CARE_TYPE_ROUTE_SLUGS = new Set<string>(CARE_TYPE_ROUTE_ORDER);

const CARE_TYPE_ROUTE_LABELS: Record<CareTypeRouteSlug, string> = {
  'assisted-living': 'Assisted Living',
  'memory-care': 'Memory Care',
  'nursing-homes': 'Nursing Homes',
  'independent-living': 'Independent Living',
  'residential-care': 'Residential Care',
  'adult-day-services': 'Adult Day Services',
  ccrc: 'CCRC',
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const COMMUNITY_ID_PATTERN = /^(?<slug>[a-z0-9]+(?:-[a-z0-9]+)*)-(?<routeId>\d+)$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveStateSlug = (state?: string | null): string | null => {
  const raw = (state || '').trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  const stateFromSlug = ALL_STATES.find((item) => item.slug === normalized);
  if (stateFromSlug) return stateFromSlug.slug;

  const stateFromAbbr = ALL_STATES.find((item) => item.abbreviation.toLowerCase() === normalized);
  if (stateFromAbbr) return stateFromAbbr.slug;

  const stateFromName = ALL_STATES.find((item) => item.name.toLowerCase() === normalized);
  if (stateFromName) return stateFromName.slug;

  return toSlug(raw);
};

type FacilityPathArgs = {
  id?: string | null;
  publicSlug?: string | null;
  publicRouteId?: number | string | null;
  state?: string | null;
  city?: string | null;
  careType?: string | null;
};

const toPublicRouteId = (value?: string | number | null): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return value.trim();
  return '';
};

const normalizeCommunityId = ({ id, publicSlug, publicRouteId }: FacilityPathArgs): string => {
  const explicitSlug = toSlug((publicSlug || '').trim());
  const explicitRouteId = toPublicRouteId(publicRouteId);
  if (explicitSlug && explicitRouteId) {
    return `${explicitSlug}-${explicitRouteId}`;
  }

  const value = (id || '').trim();
  if (!value || UUID_PATTERN.test(value)) return '';
  if (COMMUNITY_ID_PATTERN.test(value)) return value.toLowerCase();
  return '';
};

export const parseCommunityId = (value?: string | null): { publicSlug: string; publicRouteId: number } | null => {
  const trimmed = (value || '').trim();
  const match = COMMUNITY_ID_PATTERN.exec(trimmed);
  if (!match?.groups) return null;

  const publicRouteId = Number(match.groups.routeId);
  if (!Number.isFinite(publicRouteId)) return null;

  return {
    publicSlug: match.groups.slug.toLowerCase(),
    publicRouteId,
  };
};

export const buildFacilityDetailPath = (args: FacilityPathArgs): string => {
  const communityId = normalizeCommunityId(args);
  return communityId ? `/community/${encodeURIComponent(communityId)}/` : '/search';
};

export const buildFacilityCanonicalUrl = (args: FacilityPathArgs, origin = 'https://silvertechdirectory.com'): string =>
  `${origin.replace(/\/$/, '')}${buildFacilityDetailPath(args)}`;

type CareTypePathArgs = {
  careType?: string | null;
  state?: string | null;
  city?: string | null;
};

export const buildCareTypePath = ({ careType, state, city }: CareTypePathArgs): string => {
  const careSlug = toSlug((careType || '').trim());
  if (!careSlug || !CARE_TYPE_ROUTE_SLUGS.has(careSlug)) return '/';

  const stateSlug = resolveStateSlug(state);
  if (!stateSlug) return `/${careSlug}/`;

  const citySlug = toSlug((city || '').trim());
  return citySlug ? `/${careSlug}/${stateSlug}/${citySlug}/` : `/${careSlug}/${stateSlug}/`;
};

export const buildRegulationsPath = (state?: string | null, topic?: string | null): string => {
  const stateSlug = resolveStateSlug(state);
  const topicSlug = toSlug((topic || '').trim());
  if (!stateSlug) return '/regulations/';
  return topicSlug ? `/regulations/${stateSlug}/${topicSlug}/` : `/regulations/${stateSlug}/`;
};

export const isCareTypeRouteSlug = (value?: string | null): boolean =>
  CARE_TYPE_ROUTE_SLUGS.has((value || '').trim().toLowerCase());

export const getCareTypeRouteLabel = (value?: string | null): string => {
  const slug = (value || '').trim().toLowerCase() as CareTypeRouteSlug;
  return CARE_TYPE_ROUTE_LABELS[slug] || 'Senior Care';
};
