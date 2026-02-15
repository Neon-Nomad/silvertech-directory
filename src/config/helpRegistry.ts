import { HelpRegistry, HelpRouteContent, HelpRouteKey } from '@/src/types/helpRegistry';

let cachedRegistry: HelpRegistry | null = null;

const FALLBACK_REGISTRY: HelpRegistry = {
  version: 'fallback',
  last_updated: '1970-01-01',
  routes: {
    dashboard_help: {
      title: 'Help Center',
      article_ids: ['help-fallback'],
      contextual_tip: 'Help content is currently unavailable. Please try again shortly.',
    },
  },
  articles: {
    'help-fallback': {
      id: 'help-fallback',
      slug: 'help-fallback',
      title: 'Help Content Unavailable',
      content_md:
        '### Temporary issue\nHelp articles could not be loaded. Please refresh the page or contact support.',
    },
  },
};

const ensureRoute = (registry: HelpRegistry, routeKey: HelpRouteKey): HelpRouteContent => {
  const route = registry.routes[routeKey] ?? registry.routes.dashboard_help ?? FALLBACK_REGISTRY.routes.dashboard_help;
  const articles = route.article_ids
    .map((articleId) => registry.articles[articleId])
    .filter((article): article is NonNullable<typeof article> => Boolean(article));

  return {
    routeKey,
    route,
    articles,
    lastUpdated: registry.last_updated,
  };
};

export const loadHelpRegistry = async (): Promise<HelpRegistry> => {
  if (cachedRegistry) return cachedRegistry;

  try {
    const response = await fetch('/help-registry.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to load help registry: ${response.status}`);
    const data = (await response.json()) as HelpRegistry;
    cachedRegistry = data;
    return data;
  } catch (err) {
    console.error('Unable to load help registry', err);
    cachedRegistry = FALLBACK_REGISTRY;
    return FALLBACK_REGISTRY;
  }
};

export const getHelpRouteContent = async (routeKey: HelpRouteKey): Promise<HelpRouteContent> => {
  const registry = await loadHelpRegistry();
  return ensureRoute(registry, routeKey);
};

export const clearHelpRegistryCache = (): void => {
  cachedRegistry = null;
};
