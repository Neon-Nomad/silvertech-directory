export type HelpRouteKey =
  | 'dashboard_overview'
  | 'dashboard_listings'
  | 'dashboard_leads'
  | 'dashboard_qa'
  | 'dashboard_billing'
  | 'dashboard_help';

export interface HelpRouteEntry {
  title: string;
  article_ids: string[];
  contextual_tip: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content_md: string;
}

export interface HelpRegistry {
  version: string;
  last_updated: string;
  routes: Record<string, HelpRouteEntry>;
  articles: Record<string, HelpArticle>;
}

export interface HelpRouteContent {
  routeKey: HelpRouteKey;
  route: HelpRouteEntry;
  articles: HelpArticle[];
  lastUpdated: string;
}
