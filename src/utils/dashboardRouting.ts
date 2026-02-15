export type DashboardTab = 'overview' | 'listings' | 'leads' | 'qa' | 'billing' | 'lineage' | 'help';

const CANONICAL_TABS: DashboardTab[] = ['overview', 'listings', 'leads', 'qa', 'billing', 'lineage', 'help'];

export const isDashboardTab = (value: string | null | undefined): value is DashboardTab =>
  typeof value === 'string' && CANONICAL_TABS.includes(value as DashboardTab);

export const normalizeDashboardTab = (value: string | null | undefined): DashboardTab | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (isDashboardTab(normalized)) return normalized;

  if (normalized === 'facilities') return 'listings';
  if (normalized === 'analytics') return 'overview';
  if (normalized === 'settings') return 'help';

  return null;
};

export const dashboardPathForTab = (tab: DashboardTab): string =>
  tab === 'overview' ? '/dashboard' : `/dashboard/${tab}`;
