import { ALL_STATES } from '@/src/data/states';

export const CARE_TYPE_ROUTE_SLUGS = new Set([
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
]);

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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
  state?: string | null;
  city?: string | null;
};

export const buildFacilityDetailPath = ({ id, state, city }: FacilityPathArgs): string => {
  const pathId = (id || '').trim();
  if (!pathId) return '/search';

  const stateSlug = resolveStateSlug(state);
  const citySlug = toSlug((city || '').trim());
  const encodedId = encodeURIComponent(pathId);

  if (!stateSlug || !citySlug) {
    // Never emit legacy /facility URLs. Unknown placeholders are canonicalized after facility load.
    return `/senior-living/unknown/unknown/${encodedId}/`;
  }

  return `/senior-living/${stateSlug}/${citySlug}/${encodedId}/`;
};

export const buildFacilityCanonicalUrl = (
  args: FacilityPathArgs,
  origin = 'https://silvertechdirectory.com',
): string => `${origin.replace(/\/$/, '')}${buildFacilityDetailPath(args)}`;

export const isCareTypeRouteSlug = (value?: string | null): boolean =>
  CARE_TYPE_ROUTE_SLUGS.has((value || '').trim().toLowerCase());
