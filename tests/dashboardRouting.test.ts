import { describe, expect, it } from 'vitest';
import { dashboardPathForTab, normalizeDashboardTab } from '@/src/utils/dashboardRouting';

describe('dashboardRouting', () => {
  it('maps canonical tabs to canonical paths', () => {
    expect(dashboardPathForTab('leads')).toBe('/dashboard/leads');
    expect(dashboardPathForTab('vault')).toBe('/dashboard/vault');
    expect(dashboardPathForTab('overview')).toBe('/dashboard');
  });

  it('normalizes legacy tab names', () => {
    expect(normalizeDashboardTab('facilities')).toBe('listings');
    expect(normalizeDashboardTab('analytics')).toBe('overview');
    expect(normalizeDashboardTab('settings')).toBe('help');
    expect(normalizeDashboardTab('lineage')).toBe('vault');
  });

  it('returns null for invalid tabs', () => {
    expect(normalizeDashboardTab('not-a-tab')).toBeNull();
  });
});
