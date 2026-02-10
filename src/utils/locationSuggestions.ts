import zipToCity from '@/src/data/zip_to_city.json';
import { ALL_STATES } from '@/src/data/states';

type ZipEntry = { city: string; state: string };

export type LocationSuggestion =
  | { type: 'city'; label: string; city: string; state: string }
  | { type: 'zip'; label: string; zip: string; city: string; state: string }
  | { type: 'state'; label: string; state: string; stateSlug: string };

let cityCache: { key: string; label: string; city: string; state: string }[] | null = null;

const buildCityCache = () => {
  if (cityCache) return cityCache;
  const seen = new Set<string>();
  const entries = Object.entries(zipToCity as Record<string, ZipEntry>);
  const list: { key: string; label: string; city: string; state: string }[] = [];

  for (const [, data] of entries) {
    const label = `${data.city}, ${data.state}`;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({ key, label, city: data.city, state: data.state });
    if (list.length >= 6000) break;
  }

  cityCache = list;
  return list;
};

const normalize = (value: string) => value.toLowerCase().trim();

export const getLocationSuggestions = (query: string, limit = 6): LocationSuggestion[] => {
  const q = normalize(query);
  if (!q) return [];

  const suggestions: LocationSuggestion[] = [];

  if (/^\d+$/.test(q)) {
    const zipMatches = Object.entries(zipToCity as Record<string, ZipEntry>)
      .filter(([zip]) => zip.startsWith(q))
      .slice(0, limit)
      .map(([zip, data]) => ({
        type: 'zip' as const,
        zip,
        city: data.city,
        state: data.state,
        label: `${zip} • ${data.city}, ${data.state}`
      }));
    suggestions.push(...zipMatches);
    if (suggestions.length >= limit) return suggestions.slice(0, limit);
  }

  const cityList = buildCityCache();
  const startsWith = cityList.filter((item) => item.key.startsWith(q));
  const contains = cityList.filter((item) => !item.key.startsWith(q) && item.key.includes(q));

  for (const item of [...startsWith, ...contains]) {
    suggestions.push({ type: 'city', label: item.label, city: item.city, state: item.state });
    if (suggestions.length >= limit) break;
  }

  if (suggestions.length < limit) {
    const stateMatches = ALL_STATES.filter((state) => {
      const name = state.name.toLowerCase();
      const abbr = state.abbreviation.toLowerCase();
      return name.startsWith(q) || abbr === q || name.includes(q);
    }).slice(0, limit - suggestions.length);

    stateMatches.forEach((state) => {
      suggestions.push({
        type: 'state',
        label: state.name,
        state: state.abbreviation,
        stateSlug: state.slug
      });
    });
  }

  return suggestions.slice(0, limit);
};
